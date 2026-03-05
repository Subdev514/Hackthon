// firebase.js — Firebase App Initialization
// ─────────────────────────────────────────
// Replace the placeholder values below with your actual Firebase project config.
// You can find these in: Firebase Console → Project Settings → Your Apps → SDK setup.
//
// NEVER commit real credentials. Use environment variables in production:
//   import { getFirebaseConfig } from './config.js'   ← load from .env

import { initializeApp } from "firebase/app";
import { getAuth }        from "firebase/auth";
import { getFirestore }   from "firebase/firestore";
import { getStorage }     from "firebase/storage";

// ── Config ────────────────────────────────────────────────────────────────────
// Swap these with your actual values (or load from .env / a config module)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── Initialize ─────────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);       // Firebase Authentication
export const db      = getFirestore(app);  // Firestore Database
export const storage = getStorage(app);    // Cloud Storage (avatars)

export default app;
