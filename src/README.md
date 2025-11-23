# VoteNow - Real-Time Voting System

A modern, real-time polling application built with React, featuring live updates via WebSocket, beautiful visualizations, and a clean user interface.

## 🚀 Features

- **Real-Time Updates**: See poll results update instantly as votes come in using Socket.io
- **Beautiful UI**: Clean, minimalist design with Tailwind CSS and shadcn/ui components
- **Interactive Charts**: Visualize poll results with Recharts bar charts
- **User Authentication**: Mock Firebase auth (ready to integrate real Firebase)
- **Protected Routes**: Only authenticated users can create polls
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Toast Notifications**: User-friendly feedback for all actions

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Socket.io-client** for real-time communication
- **Recharts** for data visualization
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend Integration
The app expects a backend API running at `http://localhost:5000` with the following endpoints:

#### API Endpoints:
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get a specific poll
- `POST /api/polls` - Create a new poll
- `POST /api/polls/:id/vote` - Submit a vote

#### WebSocket Events:
- `join_poll` - Join a poll room for real-time updates
- `leave_poll` - Leave a poll room
- `update_poll` - Receive poll updates in real-time

## 📁 Project Structure

```
/
├── App.tsx                      # Main app with routing
├── contexts/
│   └── AuthContext.tsx         # Authentication context (mock Firebase)
├── hooks/
│   └── useSocket.ts            # Custom Socket.io hook
├── pages/
│   ├── Home.tsx                # Landing page with poll list
│   ├── CreatePoll.tsx          # Poll creation form
│   ├── PollDetail.tsx          # Voting interface with live chart
│   ├── Login.tsx               # Login page
│   └── Signup.tsx              # Registration page
├── components/
│   ├── Navbar.tsx              # Navigation bar
│   ├── PollCard.tsx            # Poll card component
│   ├── ProtectedRoute.tsx      # Route protection wrapper
│   └── ui/                     # shadcn/ui components
└── styles/
    └── globals.css             # Global styles and theme tokens
```

## 🎨 Key Components

### 1. useSocket Hook (`/hooks/useSocket.ts`)
Custom React hook that manages Socket.io connection:
- Auto-connects on mount
- Provides methods to join/leave poll rooms
- Handles poll update events
- Manages connection state

### 2. CreatePoll (`/pages/CreatePoll.tsx`)
Form component with:
- Dynamic option fields (add/remove)
- Form validation
- API integration
- Loading states

### 3. PollDetail (`/pages/PollDetail.tsx`)
The core voting interface featuring:
- **Left Panel**: Voting form with radio buttons
- **Right Panel**: Live bar chart with Recharts
- Real-time updates via Socket.io
- Vote tracking (localStorage)
- Beautiful data visualization

### 4. AuthContext (`/contexts/AuthContext.tsx`)
Mock authentication system:
- Replace with real Firebase auth
- Manages user state
- Handles login/signup/logout
- Persists user in localStorage

## 🎯 Color Scheme

The app uses an Indigo-based color palette:
- Primary: `#4f46e5` (Indigo 600)
- Hover: `#4338ca` (Indigo 700)
- Background: `#eef2ff` (Indigo 50)
- Accent: `#e0e7ff` (Indigo 100)

## 🔒 Authentication

Currently uses a mock authentication system. To integrate real Firebase:

1. Install Firebase:
```bash
npm install firebase
```

2. Replace mock methods in `/contexts/AuthContext.tsx` with:
```typescript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
```

## 📊 Real-Time Updates

The Socket.io integration works as follows:

1. **Connection**: Socket connects on app load
2. **Join Room**: When viewing a poll, client joins that poll's room
3. **Vote**: When someone votes, backend emits `update_poll` event
4. **Update**: All clients in the room receive the updated poll data
5. **UI Update**: Chart and vote counts update automatically

## 🚀 Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

3. **Ensure backend is running**:
Make sure your backend server is running at `http://localhost:5000`

## 📝 Backend Requirements

Your backend should implement:

### Poll Schema:
```typescript
{
  _id: string;
  title: string;
  description?: string;
  options: Array<{
    text: string;
    votes: number;
  }>;
  createdBy: string;
  createdAt: Date;
}
```

### Socket.io Integration:
```javascript
io.on('connection', (socket) => {
  socket.on('join_poll', (pollId) => {
    socket.join(pollId);
  });
  
  socket.on('leave_poll', (pollId) => {
    socket.leave(pollId);
  });
  
  // After vote is processed:
  io.to(pollId).emit('update_poll', updatedPoll);
});
```

## 🎨 Customization

### Changing Colors:
Edit `/styles/globals.css` to modify the color tokens:
```css
:root {
  --indigo-600: #your-color;
  --indigo-700: #your-hover-color;
}
```

### Adding Features:
- Poll expiration dates
- Poll categories
- User profiles
- Poll sharing
- Export results
- Comments on polls

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- Mobile: Default single-column layout
- Tablet: Grid layouts adapt
- Desktop: Full two-column layout for poll details

## 🔧 Development Notes

- The app uses localStorage for vote tracking (can be replaced with backend)
- Mock auth should be replaced with real authentication
- Add proper error boundaries in production
- Consider adding rate limiting for vote submission
- Implement poll ownership and deletion

## 📄 License

MIT License - feel free to use this project for learning or production!

---

Built with ❤️ using React, Tailwind CSS, and Socket.io
