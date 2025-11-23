# Role
Act as a Senior Full Stack Developer. We have an existing React Frontend (Vite + Tailwind) for a Voting App, but the Backend is missing, and Authentication is currently mocked.

# Task
Your task is to build the complete **Node.js/Express Backend** and upgrade the **Frontend Authentication** to use real Firebase Auth.

# Current Frontend Context
- **Frontend Port:** Running on `http://localhost:3000`
- **Backend Expected URL:** `http://localhost:5000`
- **Data Structure (Poll):**
  ```json
  {
    "_id": "mongo_object_id",
    "title": "String",
    "description": "String",
    "options": [{ "text": "String", "votes": Number }],
    "createdBy": "user_uid",
    "createdAt": "Date"
  }

Requirements
Part 1: Backend Setup (Node.js + Express + MongoDB)
Create a backend folder with a robust structure.

Dependencies: Use express, mongoose (for MongoDB), socket.io (for real-time), cors, dotenv, and firebase-admin (for verifying tokens).

Server Setup (server.js):

Run on port 5000.

CORS Configuration: Strictly allow origin http://localhost:3000 to prevent connection errors.

Initialize MongoDB connection.

Initialize Socket.IO with CORS allowed for the frontend.

Database Schema: Create a Mongoose schema for Poll matching the data structure above.

API Endpoints: Implement these exact routes used by the frontend:

GET /api/polls: Return all polls (sorted by newest).

GET /api/polls/:id: Return specific poll details.

POST /api/polls: Create a new poll. Secure this route (require Auth).

POST /api/polls/:id/vote:

Body: { optionIndex: number }

Logic: Increment the vote count for the specific option.

IMPORTANT: After saving, emit a global Socket.IO event 'update_poll' with the updated poll data to the room 'poll_:id'.

Socket.IO Logic:

Listen for 'join_poll' (payload: pollId) -> Join room.

Listen for 'leave_poll' (payload: pollId) -> Leave room.

Part 2: Frontend Authentication (Firebase)
Refactor the file src/contexts/AuthContext.tsx to replace the mock logic with real Firebase Authentication.

Setup: Provide the code to initialize Firebase (src/firebase.ts) using firebase/app and firebase/auth.

Context Logic:

Replace the dummy login, signup, and logout functions with signInWithEmailAndPassword, createUserWithEmailAndPassword, and signOut from Firebase.

Track the currentUser state using onAuthStateChanged.

Expose the user object and auth functions to the app.

Part 3: Security Integration
Backend Middleware: Create a middleware function verifyToken using firebase-admin. Use this middleware to protect the POST /api/polls route so only logged-in users can create polls.

Frontend Token: In the CreatePoll.tsx logic (I will update this manually, just explain how), ensure the API call includes the Authorization: Bearer <token> header.

Output Deliverables
Please provide the code in this order:

backend/package.json (dependencies list).

backend/server.js (Main server code with Socket.io & Routes).

backend/models/Poll.js (Mongoose Schema).

backend/middleware/auth.js (Firebase Admin verification).

src/firebase.ts (Frontend Firebase config).

src/contexts/AuthContext.tsx (Refactored with real Auth).

Let's start coding.