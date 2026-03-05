// auth.js — Authentication Logic
// ───────────────────────────────
// Handles: Email/Password signup & login, GitHub OAuth, Google OAuth,
// password reset, logout.
// Every function returns a consistent { user, error } shape so the frontend
// never has to catch — just check the error field.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GithubAuthProvider,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase.js";
import { createUserProfile, mergeUserProfile } from "./userService.js";

// ── GitHub Provider ────────────────────────────────────────────────────────────
const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

// ── Google Provider ────────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL / PASSWORD — SIGN UP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register a new user with email + password.
 * Also creates their Firestore profile document.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {{ user: import("firebase/auth").User|null, error: string|null }}
 */
export async function signUpWithEmail(email, password, displayName) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await updateProfile(user, { displayName });

    await createUserProfile(user.uid, {
      displayName,
      email: user.email,
      avatarUrl: null,
      provider: "email",
    });

    return { user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err.code) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL / PASSWORD — SIGN IN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sign in an existing user with email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ user: import("firebase/auth").User|null, error: string|null }}
 */
export async function signInWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { user: credential.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err.code) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GITHUB — SIGN IN / SIGN UP (OAuth popup)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sign in (or register) via GitHub OAuth popup.
 * New users get a Firestore profile created. Returning users get their
 * avatar + name refreshed.
 *
 * @returns {{ user: import("firebase/auth").User|null, isNew: boolean, error: string|null }}
 */
export async function signInWithGitHub() {
  try {
    const result    = await signInWithPopup(auth, githubProvider);
    const user      = result.user;
    const isNew     = result._tokenResponse?.isNewUser ?? false;
    const avatarUrl = user.photoURL ?? null;

    if (isNew) {
      await createUserProfile(user.uid, {
        displayName: user.displayName ?? "GitHub User",
        email:       user.email,
        avatarUrl,
        provider:    "github",
      });
    } else {
      await mergeUserProfile(user.uid, { displayName: user.displayName, avatarUrl });
    }

    return { user, isNew, error: null };
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") {
      return { user: null, isNew: false, error: null };
    }
    return { user: null, isNew: false, error: friendlyError(err.code) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE — SIGN IN / SIGN UP (OAuth popup)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sign in (or register) via Google OAuth popup.
 * New users get a Firestore profile created. Returning users get their
 * avatar + name refreshed.
 *
 * Setup required:
 *   Firebase Console → Authentication → Sign-in method → Google → Enable
 *
 * @returns {{ user: import("firebase/auth").User|null, isNew: boolean, error: string|null }}
 */
export async function signInWithGoogle() {
  try {
    const result    = await signInWithPopup(auth, googleProvider);
    const user      = result.user;
    const isNew     = result._tokenResponse?.isNewUser ?? false;
    const avatarUrl = user.photoURL ?? null;

    if (isNew) {
      await createUserProfile(user.uid, {
        displayName: user.displayName ?? "Google User",
        email:       user.email,
        avatarUrl,
        provider:    "google",
      });
    } else {
      await mergeUserProfile(user.uid, { displayName: user.displayName, avatarUrl });
    }

    return { user, isNew, error: null };
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") {
      return { user: null, isNew: false, error: null };
    }
    return { user: null, isNew: false, error: friendlyError(err.code) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a password-reset email. Firebase handles the link + expiry.
 *
 * @param {string} email
 * @returns {{ sent: boolean, error: string|null }}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { sent: true, error: null };
  } catch (err) {
    return { sent: false, error: friendlyError(err.code) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN OUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sign the current user out and clear their session.
 *
 * @returns {{ error: string|null }}
 */
export async function logOut() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (err) {
    return { error: friendlyError(err.code) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function friendlyError(code) {
  const messages = {
    "auth/email-already-in-use":    "An account with this email already exists.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Try again.",
    "auth/too-many-requests":       "Too many attempts. Please wait and try again.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email under a different sign-in method.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}