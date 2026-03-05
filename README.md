# Firebase Auth Backend

Full auth backend for Email/Password + GitHub OAuth with Firestore user profiles.

## File Overview

| File | Purpose |
|---|---|
| `firebase.js` | Firebase app init — exports `auth`, `db`, `storage` |
| `auth.js` | Sign up, sign in, GitHub OAuth, password reset, logout |
| `userService.js` | Firestore user profile CRUD + avatar upload/delete |
| `session.js` | Auth state listener, session persistence, `waitForAuthReady()` |
| `firestore.rules` | Firestore security rules — deploy to Firebase |
| `storage.rules` | Storage security rules — deploy to Firebase |
| `.env.example` | Environment variable template |
| `index.html` | Minimal placeholder UI — replace with real frontend |

---

## Setup

### 1. Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) → New Project
2. Enable **Authentication** → Sign-in methods: **Email/Password** and **GitHub**
3. Enable **Firestore Database** (start in production mode)
4. Enable **Storage**

### 2. GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New
2. Set **Authorization callback URL** to:
   ```
   https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler
   ```
3. Copy the Client ID and Client Secret into Firebase Console → Authentication → GitHub

### 3. Environment Variables
```bash
cp .env.example .env.local    # for Vite
# Fill in all VITE_FIREBASE_* values from Firebase Console → Project Settings
```

### 4. Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init              # select Firestore + Storage, link your project
firebase deploy --only firestore:rules,storage
```

---

## Frontend Integration

### Sign up
```js
import { signUpWithEmail } from "./auth.js";

const { user, error } = await signUpWithEmail(email, password, displayName);
if (error) showError(error);
else navigateTo("/dashboard");
```

### GitHub Sign in
```js
import { signInWithGitHub } from "./auth.js";

const { user, isNew, error } = await signInWithGitHub();
```

### Password Reset
```js
import { resetPassword } from "./auth.js";

const { sent, error } = await resetPassword(email);
```

### Auth State (React example)
```js
import { onAuthStateChange } from "./session.js";
import { useEffect, useState } from "react";

function App() {
  const [authState, setAuthState] = useState({ authUser: null, profile: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(setAuthState);
    return unsubscribe; // cleanup on unmount
  }, []);
}
```

### App Init (wait for session restore)
```js
import { waitForAuthReady } from "./session.js";

const user = await waitForAuthReady();
if (user) router.push("/dashboard");
else       router.push("/login");
```

### Upload Avatar
```js
import { uploadAvatar } from "./userService.js";

const file = event.target.files[0];
const { avatarUrl, error } = await uploadAvatar(user.uid, file);
```
