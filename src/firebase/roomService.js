// roomService.js — Room / Session Management
// ────────────────────────────────────────────
// Handles creating rooms, joining, leaving, and real-time channel content sync.
//
// Firestore structure:
//
//   rooms/{roomId}
//     name        : string
//     createdBy   : uid
//     createdAt   : Timestamp
//     channels    : [{ id: string, name: string }]   ← array on the room doc
//
//   rooms/{roomId}/members/{uid}
//     displayName : string
//     joinedAt    : Timestamp
//
//   rooms/{roomId}/channels/{channelId}
//     name        : string
//     content     : string   ← live code/text, updated by any member in real time

import {
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase.js";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Generate a short human-readable room ID e.g. "X7K-29A" */
function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0, I/1 ambiguity
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${seg(3)}-${seg(3)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE ROOM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new room with an auto-generated ID and initial channels.
 * The creator is automatically added as the first member.
 *
 * @param {{
 *   roomName:    string,
 *   channels:    string[],   — array of channel name strings e.g. ["general","css","js"]
 *   createdBy:   string,     — uid of the creating user
 *   displayName: string,     — display name of the creating user
 * }} opts
 * @returns {{ roomId: string|null, error: string|null }}
 */
export async function createRoom({ roomName, channels, createdBy, displayName }) {
  try {
    // 1. Build channel objects with stable IDs
    const channelList = channels.map((name, i) => ({
      id:   `ch_${Date.now()}_${i}`,
      name: name.trim(),
    }));

    // 2. Generate a unique room ID (retry once on collision)
    let roomId = generateRoomId();
    let exists = await getDoc(doc(db, "rooms", roomId));
    if (exists.exists()) roomId = generateRoomId();

    // 3. Write the room document
    await setDoc(doc(db, "rooms", roomId), {
      roomId,
      name:      roomName.trim(),
      channels:  channelList,
      createdBy,
      createdAt: serverTimestamp(),
    });

    // 4. Create a Firestore sub-document per channel to hold live content
    for (const ch of channelList) {
      await setDoc(doc(db, "rooms", roomId, "channels", ch.id), {
        name:      ch.name,
        content:   "",          // starts empty — creator pastes/types code here
        updatedBy: createdBy,
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Add creator as first member
    await setDoc(doc(db, "rooms", roomId, "members", createdBy), {
      displayName,
      joinedAt: serverTimestamp(),
    });

    return { roomId, error: null };
  } catch (err) {
    console.error("[roomService] createRoom:", err);
    return { roomId: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOIN ROOM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Join an existing room by its ID.
 * Returns the room document (name, channels list) if found.
 *
 * @param {{ roomId: string, uid: string, displayName: string }} opts
 * @returns {{ room: object|null, error: string|null }}
 */
export async function joinRoom({ roomId, uid, displayName }) {
  try {
    const roomRef = doc(db, "rooms", roomId.trim().toUpperCase());
    const snap    = await getDoc(roomRef);

    if (!snap.exists()) {
      return { room: null, error: "Room not found. Check the room ID and try again." };
    }

    // Register as a member (idempotent — safe to call again if already joined)
    await setDoc(doc(db, "rooms", roomId, "members", uid), {
      displayName,
      joinedAt: serverTimestamp(),
    });

    return { room: snap.data(), error: null };
  } catch (err) {
    console.error("[roomService] joinRoom:", err);
    return { room: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET ROOM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch a room document once (non-realtime).
 *
 * @param {string} roomId
 * @returns {{ room: object|null, error: string|null }}
 */
export async function getRoom(roomId) {
  try {
    const snap = await getDoc(doc(db, "rooms", roomId));
    if (!snap.exists()) return { room: null, error: "Room not found." };
    return { room: snap.data(), error: null };
  } catch (err) {
    return { room: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAVE ROOM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Remove the current user from a room's member list.
 *
 * @param {{ roomId: string, uid: string }} opts
 * @returns {{ error: string|null }}
 */
export async function leaveRoom({ roomId, uid }) {
  try {
    await deleteDoc(doc(db, "rooms", roomId, "members", uid));
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME: SUBSCRIBE TO CHANNEL CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to live content changes on a specific channel.
 * The callback fires immediately with the current content, then on every update.
 *
 * @param {string}   roomId
 * @param {string}   channelId
 * @param {(data: { content: string, updatedBy: string }) => void} callback
 * @returns {() => void}  unsubscribe function — call on component unmount
 *
 * Usage:
 *   const unsub = subscribeToChannel(roomId, channelId, ({ content }) => {
 *     editor.setValue(content);
 *   });
 *   // cleanup:
 *   unsub();
 */
export function subscribeToChannel(roomId, channelId, callback) {
  const ref = doc(db, "rooms", roomId, "channels", channelId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ content: snap.data().content, updatedBy: snap.data().updatedBy });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME: SUBSCRIBE TO MEMBER LIST
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to the live member list of a room.
 *
 * @param {string} roomId
 * @param {(members: Array<{ uid: string, displayName: string }>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToMembers(roomId, callback) {
  const ref = collection(db, "rooms", roomId, "members");
  return onSnapshot(ref, (snap) => {
    const members = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    callback(members);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE CHANNEL CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Push updated code/text to a channel. Called on every keystroke (debounced
 * in the UI to avoid excessive writes — see editor page).
 *
 * @param {{ roomId: string, channelId: string, content: string, uid: string }} opts
 * @returns {{ error: string|null }}
 */
export async function updateChannelContent({ roomId, channelId, content, uid }) {
  try {
    await updateDoc(doc(db, "rooms", roomId, "channels", channelId), {
      content,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    console.error("[roomService] updateChannelContent:", err);
    return { error: err.message };
  }
}
