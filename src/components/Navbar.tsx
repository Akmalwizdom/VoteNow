import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Vote, LogOut, User, PlusCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Vote className="size-6 text-indigo-600" />
            <span className="text-xl">VoteNow</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                  <User className="size-4" />
                  <span className="text-sm">{user.displayName || user.email}</span>
                </div>
                <Button 
                  onClick={() => navigate('/create')} 
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusCircle className="size-4 mr-2" />
                  Create Poll
                </Button>
                <Button onClick={handleLogout} variant="outline">
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="outline">
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/signup')} 
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
