// userService.js — Firestore User Profile Management
// Profile shape:
// {
//   uid, displayName, email, provider, avatarUrl, createdAt, updatedAt
// }

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase.js";

const USERS_COLLECTION = "users";

export async function createUserProfile(uid, { displayName, email, avatarUrl, provider }) {
  try {
    const userRef  = doc(db, USERS_COLLECTION, uid);
    const existing = await getDoc(userRef);
    if (existing.exists()) return { profile: existing.data(), error: null };

    const profile = {
      uid, displayName, email,
      avatarUrl: avatarUrl ?? null,
      provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);
    return { profile, error: null };
  } catch (err) {
    return { profile: null, error: err.message };
  }
}

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return { profile: null, error: "User profile not found." };
    return { profile: snap.data(), error: null };
  } catch (err) {
    return { profile: null, error: err.message };
  }
}

export async function mergeUserProfile(uid, fields) {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      ...fields,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}