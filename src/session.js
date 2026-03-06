// session.js — Auth State Listener & Session Persistence
// ────────────────────────────────────────────────────────
// Firebase Auth persists sessions automatically via IndexedDB (LOCAL persistence).
// This module exposes:
//   • onAuthStateChange()   — subscribe to login/logout events
//   • getCurrentUser()      — synchronously read the current auth user
//   • waitForAuthReady()    — await the first auth state resolution (useful on app init)
//
// Firebase persistence modes:
//   LOCAL   (default) — survives tab/browser restarts         ← we use this
//   SESSION           — clears when tab is closed
//   NONE              — never persists (memory only)
//
// To change persistence, import { setPersistence, browserSessionPersistence }
// and call setPersistence(auth, browserSessionPersistence) before any sign-in.

import {
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

import { auth }           from "./firebase/firebase.js";
import { getUserProfile } from "./firebase/userService.js";

// ── Ensure LOCAL persistence is explicitly set ────────────────────────────────
// (Firebase defaults to LOCAL, but being explicit avoids surprises when the
//  SDK default changes or a previous call used a different mode.)
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH STATE LISTENER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to auth state changes. The callback fires:
 *   • Immediately with the current user (or null) on first call
 *   • On every subsequent sign-in or sign-out
 *
 * Also fetches the Firestore profile and passes it alongside the Auth user,
 * so the frontend always has both in one place.
 *
 * @param {(state: { authUser: User|null, profile: object|null, loading: boolean }) => void} callback
 * @returns {() => void} — unsubscribe function; call it on component unmount
 *
 * Usage:
 *   const unsubscribe = onAuthStateChange(({ authUser, profile }) => {
 *     if (authUser) { ... } else { // redirect to login }
 *   });
 *
 *   // Cleanup (e.g. in React useEffect return, or Vue onUnmounted):
 *   unsubscribe();
 */
export function onAuthStateChange(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
    if (!authUser) {
      // Signed out
      callback({ authUser: null, profile: null, loading: false });
      return;
    }

    // Signed in — load their Firestore profile
    const { profile } = await getUserProfile(authUser.uid);
    callback({ authUser, profile, loading: false });
  });

  return unsubscribe;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET CURRENT USER (synchronous snapshot)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Return the currently signed-in Firebase Auth user, or null.
 * This is synchronous but may return null briefly on page load before the
 * SDK has restored the session — use waitForAuthReady() in that case.
 *
 * @returns {import("firebase/auth").User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAIT FOR AUTH READY (async, one-shot)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wait for Firebase to finish restoring the session from storage.
 * Resolves with the current User (or null) exactly once.
 *
 * Use this in app initialization before rendering protected routes,
 * so you don't flash the login page for already-authenticated users.
 *
 * @returns {Promise<import("firebase/auth").User|null>}
 *
 * Usage:
 *   const user = await waitForAuthReady();
 *   if (user) router.replace('/dashboard');
 *   else       router.replace('/login');
 */
export function waitForAuthReady() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Only need the first emission
      resolve(user);
    });
  });
}
