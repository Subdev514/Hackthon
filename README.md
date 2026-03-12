# Firebase Chat/Dechat

Real-time collaborative chat + code editor built on Firebase.
AI powered developer collaboration platform built during Hackathon.

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



## Page Flow

```
index.html (login)
    └── editor.html?room=XXXX
            ↑
create-room.html ──→ (auto redirect after creation)
join-room.html   ──→ (redirect after joining)
```




## Features

- Real-time developer chat
- AI code assistant
- Firebase authentication
- Room based collaboration

## Tech Stack

Frontend:
- React
Backend:
- Firebase
- Firestore

## Installation

Clone repo

git clone https://github.com/username/devchat.git

Install dependencies:
npm install
Run project:
npm run dev

## Folder Structure

src/
pages/
firebase/
components/

## Future Improvements

- UI improvements
- authentication system
- AI chat assistant
- deployment

## Team
Hackathon Team DevChat