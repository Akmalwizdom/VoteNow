# Role
Act as a Senior Backend Engineer specialized in Node.js, Express, and Firebase. Your goal is to build the robust API server for a Real-time Voting System.

# Project Context
We are building a voting app where users create polls and vote in real-time. We need a REST API handling logic and a Socket.IO server for live updates.

# Tech Stack
- Runtime: Node.js
- Framework: Express.js
- Database: Firebase Firestore (NoSQL)
- Auth: Firebase Admin SDK (Verify ID Tokens from frontend)
- Real-time: Socket.IO

# Requirements

## 1. Database Schema (Firestore)
Define the data models for these collections:
- `users`: uid, email, displayName, role (admin/user).
- `polls`: title, description, options [{id, text, voteCount}], createdBy, createdAt, expiresAt, settings {isAnonymous, allowMultiple}.
- `votes`: pollId, userId, optionIds[], timestamp. (Separate collection to prevent double-voting).

## 2. API Endpoints & Logic
Implement the following routes in `server.js` or separate route files:
- `POST /api/polls`: Create a new poll. Verify user token.
- `GET /api/polls`: Get list of polls.
- `GET /api/polls/:id`: Get poll details.
- `POST /api/polls/:id/vote`:
    - logic: Check if user already voted.
    - logic: Validate options exist.
    - logic: Use **Firestore Transactions** to increment counters atomically (prevent race conditions).
    - **IMPORTANT**: After a successful vote, emit a Socket.IO event `update_poll` to room `poll_:id` with the new data.

## 3. Real-time Server
- Setup Socket.IO with CORS enabled.
- Implement rooms: Users should join a room based on poll ID (e.g., `socket.join('poll_123')`) to receive updates only for that poll.

## 4. Security
- Create a middleware `verifyToken` that uses Firebase Admin to check the Authorization header (Bearer token).

# Output
Please provide:
1. The comprehensive `server.js` file.
2. The Firestore service configuration file (`firebase.js`).
3. The Controller logic for Voting (handling the transaction and socket emission).