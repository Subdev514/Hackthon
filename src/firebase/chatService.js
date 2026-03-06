// chatService.js — Real-time Chat Logic
// ──────────────────────────────────────
// Replaces roomService.js channel content sync with a proper message-based
// chat system. Room creation, joining, and leaving remain in roomService.js.
//
// Firestore structure:
//
//   rooms/{roomId}/channels/{channelId}/messages/{messageId}
//     text        : string
//     senderId    : string  (uid)
//     senderName  : string
//     senderAvatar: string | null
//     createdAt   : Timestamp
//
//   rooms/{roomId}/typing/{uid}
//     displayName : string
//     updatedAt   : Timestamp   ← stale if older than TYPING_TIMEOUT_MS

import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase.js";

// Typing indicator expires after 4 s of no updates (safety net if tab closes)
const TYPING_TIMEOUT_MS = 4000;
// Max messages loaded per channel on first open
const MESSAGE_PAGE_SIZE = 50;

// ═══════════════════════════════════════════════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a message to a channel. Clears the sender's typing indicator.
 *
 * @param {{
 *   roomId:       string,
 *   channelId:    string,
 *   text:         string,
 *   senderId:     string,
 *   senderName:   string,
 *   senderAvatar: string | null,
 * }} opts
 * @returns {{ messageId: string | null, error: string | null }}
 */
export async function sendMessage({ roomId, channelId, text, senderId, senderName, senderAvatar }) {
  const trimmed = text.trim();
  if (!trimmed) return { messageId: null, error: "Message cannot be empty." };

  try {
    const messagesRef = collection(db, "rooms", roomId, "channels", channelId, "messages");
    const docRef = await addDoc(messagesRef, {
      text:         trimmed,
      senderId,
      senderName,
      senderAvatar: senderAvatar ?? null,
      createdAt:    serverTimestamp(),
    });

    // Clear typing indicator on send
    await clearTyping({ roomId, uid: senderId });

    return { messageId: docRef.id, error: null };
  } catch (err) {
    console.error("[chatService] sendMessage:", err);
    return { messageId: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBE TO MESSAGES (real-time)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to live messages in a channel, ordered oldest → newest.
 * Loads the last MESSAGE_PAGE_SIZE messages and streams new ones as they arrive.
 *
 * @param {string}   roomId
 * @param {string}   channelId
 * @param {(messages: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 *
 * Usage:
 *   const unsub = subscribeToMessages(roomId, channelId, (msgs) => renderMessages(msgs));
 *   // cleanup:
 *   unsub();
 */
export function subscribeToMessages(roomId, channelId, callback) {
  const messagesRef = collection(db, "rooms", roomId, "channels", channelId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(MESSAGE_PAGE_SIZE));

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      // Convert Firestore Timestamp → JS Date for easy formatting in the UI
      createdAt: d.data().createdAt?.toDate() ?? new Date(),
    }));
    callback(messages);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPING INDICATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mark the current user as typing. Call this on every keypress in the input.
 * The document is timestamped so stale indicators can be filtered client-side.
 *
 * @param {{ roomId: string, uid: string, displayName: string }} opts
 */
export async function setTyping({ roomId, uid, displayName }) {
  try {
    await setDoc(doc(db, "rooms", roomId, "typing", uid), {
      displayName,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    // Typing indicators are best-effort — swallow errors silently
    console.warn("[chatService] setTyping:", err);
  }
}

/**
 * Remove the current user's typing indicator. Call on send or input blur.
 *
 * @param {{ roomId: string, uid: string }} opts
 */
export async function clearTyping({ roomId, uid }) {
  try {
    await deleteDoc(doc(db, "rooms", roomId, "typing", uid));
  } catch (_) {}
}

/**
 * Subscribe to live typing indicators for a room.
 * Filters out the current user and stale entries older than TYPING_TIMEOUT_MS.
 *
 * @param {string} roomId
 * @param {string} currentUid   — excluded from the list (don't show "you are typing")
 * @param {(typers: string[]) => void} callback   — array of display names
 * @returns {() => void} unsubscribe
 *
 * Usage:
 *   const unsub = subscribeToTyping(roomId, user.uid, (names) => {
 *     typingEl.textContent = names.length ? `${names.join(", ")} is typing…` : "";
 *   });
 */
export function subscribeToTyping(roomId, currentUid, callback) {
  const typingRef = collection(db, "rooms", roomId, "typing");

  return onSnapshot(typingRef, (snap) => {
    const now = Date.now();
    const typers = snap.docs
      .filter((d) => {
        if (d.id === currentUid) return false; // exclude self
        const updatedAt = d.data().updatedAt?.toMillis();
        // Filter stale indicators (tab closed without cleanup, etc.)
        return updatedAt && (now - updatedAt) < TYPING_TIMEOUT_MS;
      })
      .map((d) => d.data().displayName);

    callback(typers);
  });
}
