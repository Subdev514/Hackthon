# Firebase Chat

Real-time collaborative chat + code editor built on Firebase.

## Structure

```
src/
├── firebase/
│   ├── firebase.js       # App init — exports auth, db
│   ├── auth.js           # Email, GitHub, Google sign-in/up
│   ├── userService.js    # Firestore user profiles
│   ├── roomService.js    # Room create, join, leave
│   ├── chatService.js    # Messages + typing indicators
│   └── fileService.js    # File upload + live code editing
├── session.js            # Auth state listener, session persistence
└── pages/
    ├── index.html        # Login
    ├── signup.html       # Register
    ├── create-room.html  # Create room + upload project folder
    ├── join-room.html    # Join by room ID
    └── editor.html       # Chat + live file editor

rules/
└── firestore.rules       # Security rules

vite.config.js
firebase.json
.env.example
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in Firebase config
cp .env.example .env.local

# 3. Start dev server
npm run dev

# 4. Deploy rules
firebase deploy --only firestore:rules

# 5. Deploy app
npm run deploy
```

## Page Flow

```
index.html (login)
    └── editor.html?room=XXXX
            ↑
create-room.html ──→ (auto redirect after creation)
join-room.html   ──→ (redirect after joining)
```
