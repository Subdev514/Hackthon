// userService.js — Firestore User Profile Management
// ────────────────────────────────────────────────────
// Handles creating, reading, and updating user profile documents in Firestore.
// Collection: "users"  •  Document ID: Firebase Auth UID
//
// Profile shape stored in Firestore:
// {
//   uid:         string       — mirrors the document ID
//   displayName: string
//   email:       string
//   avatarUrl:   string|null  — Storage download URL, or null
//   provider:    "email"|"github"
//   createdAt:   Timestamp
//   updatedAt:   Timestamp
// }

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "./firebase.js";

const USERS_COLLECTION = "users";

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new user profile document in Firestore.
 * Called once at registration — will not overwrite an existing document.
 *
 * @param {string} uid
 * @param {{ displayName: string, email: string, avatarUrl: string|null, provider: string }} data
 * @returns {{ profile: object|null, error: string|null }}
 */
export async function createUserProfile(uid, { displayName, email, avatarUrl, provider }) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Guard: don't overwrite if the doc already exists (e.g. duplicate call)
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      return { profile: existing.data(), error: null };
    }

    const profile = {
      uid,
      displayName,
      email,
      avatarUrl,
      provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, profile);
    return { profile, error: null };
  } catch (err) {
    console.error("[userService] createUserProfile:", err);
    return { profile: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch a user's profile from Firestore by UID.
 *
 * @param {string} uid
 * @returns {{ profile: object|null, error: string|null }}
 */
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) {
      return { profile: null, error: "User profile not found." };
    }
    return { profile: snap.data(), error: null };
  } catch (err) {
    console.error("[userService] getUserProfile:", err);
    return { profile: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE — PARTIAL MERGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Merge (partial update) a user's profile. Only provided fields are touched.
 * Used for: refreshing GitHub avatar, changing display name, etc.
 *
 * @param {string} uid
 * @param {Partial<{ displayName: string, avatarUrl: string }>} fields
 * @returns {{ error: string|null }}
 */
export async function mergeUserProfile(uid, fields) {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      ...fields,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    console.error("[userService] mergeUserProfile:", err);
    return { error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR — UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Upload a new avatar image to Firebase Storage and update the user's
 * Firestore profile with the resulting download URL.
 *
 * Storage path: avatars/{uid}/avatar   (single file, always overwritten)
 *
 * @param {string} uid
 * @param {File}   file   — image File object from an <input type="file">
 * @returns {{ avatarUrl: string|null, error: string|null }}
 */
export async function uploadAvatar(uid, file) {
  try {
    // Validate: images only, max 5 MB
    if (!file.type.startsWith("image/")) {
      return { avatarUrl: null, error: "Only image files are allowed." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { avatarUrl: null, error: "Avatar must be smaller than 5 MB." };
    }

    // 1. Upload to Storage
    const avatarRef = ref(storage, `avatars/${uid}/avatar`);
    await uploadBytes(avatarRef, file, { contentType: file.type });

    // 2. Get the public download URL
    const avatarUrl = await getDownloadURL(avatarRef);

    // 3. Persist URL to Firestore profile
    const { error } = await mergeUserProfile(uid, { avatarUrl });
    if (error) throw new Error(error);

    return { avatarUrl, error: null };
  } catch (err) {
    console.error("[userService] uploadAvatar:", err);
    return { avatarUrl: null, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR — DELETE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Remove the user's avatar from Storage and clear the URL in Firestore.
 *
 * @param {string} uid
 * @returns {{ error: string|null }}
 */
export async function deleteAvatar(uid) {
  try {
    const avatarRef = ref(storage, `avatars/${uid}/avatar`);
    await deleteObject(avatarRef);
    return mergeUserProfile(uid, { avatarUrl: null });
  } catch (err) {
    // File not found is fine — already gone
    if (err.code === "storage/object-not-found") {
      return mergeUserProfile(uid, { avatarUrl: null });
    }
    console.error("[userService] deleteAvatar:", err);
    return { error: err.message };
  }
}
