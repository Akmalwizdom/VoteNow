import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { CreatePoll } from './pages/CreatePoll';
import { EditPoll } from './pages/EditPoll';
import { PollDetail } from './pages/PollDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/poll/:id" element={<PollDetail />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreatePoll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/poll/:id/edit"
              element={
                <ProtectedRoute>
                  <EditPoll />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </AuthProvider>
    </Router>
  );
}
