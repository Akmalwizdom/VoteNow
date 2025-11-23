# VoteNow Backend API

Real-time Voting System Backend built with Node.js, Express, Firebase Firestore, and Socket.IO.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Admin SDK
- **Real-time**: Socket.IO

## Project Structure

```
backend/
├── controllers/
│   └── pollController.js    # Poll logic with transactions
├── middleware/
│   └── verifyToken.js        # Firebase auth middleware
├── firebase.js               # Firestore configuration
├── server.js                 # Main Express + Socket.IO server
├── package.json
├── .env.example
└── README.md
```

## Database Schema (Firestore)

### Collections

#### `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'admin' | 'user'
}
```

#### `polls`
```javascript
{
  title: string,
  description: string,
  options: [
    {
      id: string,
      text: string,
      voteCount: number
    }
  ],
  createdBy: string,
  createdAt: timestamp,
  expiresAt: timestamp | null,
  settings: {
    isAnonymous: boolean,
    allowMultiple: boolean
  }
}
```

#### `votes`
```javascript
{
  pollId: string,
  userId: string,
  optionIds: string[],
  timestamp: timestamp
}
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check endpoint
- `GET /api/polls` - Get list of all polls
- `GET /api/polls/:id` - Get poll details by ID

### Protected Endpoints (Require Authentication)

- `POST /api/polls` - Create a new poll
- `POST /api/polls/:id/vote` - Vote on a poll

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file

### 3. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Firebase credentials in `.env`:

```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
CORS_ORIGIN=http://localhost:5173
```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## Socket.IO Events

### Client → Server

- `join_poll` - Join a poll room to receive real-time updates
  ```javascript
  socket.emit('join_poll', pollId);
  ```

- `leave_poll` - Leave a poll room
  ```javascript
  socket.emit('leave_poll', pollId);
  ```

### Server → Client

- `update_poll` - Emitted when a poll is updated (new vote)
  ```javascript
  socket.on('update_poll', (pollData) => {
    // Handle updated poll data
  });
  ```

## Security Features

- **Token Verification**: All protected routes verify Firebase ID tokens
- **Transaction Safety**: Firestore transactions prevent race conditions during voting
- **Double-Vote Prevention**: Checks if user has already voted before allowing a vote
- **Input Validation**: Validates poll options and vote data
- **CORS Protection**: Configurable CORS origin

## Vote Logic Flow

1. Client sends vote request with authentication token
2. Middleware verifies Firebase ID token
3. Controller checks if user has already voted
4. Validates selected options exist in poll
5. Uses Firestore transaction to:
   - Increment vote counts atomically
   - Record vote in `votes` collection
6. Emits Socket.IO event to all clients in poll room
7. Returns updated poll data

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Testing with cURL

**Create a poll:**
```bash
curl -X POST http://localhost:5000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "title": "Favorite Programming Language?",
    "description": "Vote for your favorite",
    "options": [
      {"text": "JavaScript"},
      {"text": "Python"},
      {"text": "Go"}
    ],
    "settings": {
      "isAnonymous": false,
      "allowMultiple": false
    }
  }'
```

**Vote on a poll:**
```bash
curl -X POST http://localhost:5000/api/polls/POLL_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "optionIds": ["opt_0_1234567890"]
  }'
```
