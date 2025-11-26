import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PollCard } from '../components/PollCard';
import { Skeleton } from '../components/ui/skeleton';
import { PlusCircle, Vote, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import { auth } from '../firebase';
import { toast } from 'sonner@2.0.3';

interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: Array<{ text: string; votes: number }>;
  createdAt: string;
  createdBy?: string;
  createdByEmail?: string;
  createdByName?: string;
}

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      // Get authentication token
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        console.error('No authentication token available');
        toast.error('Authentication required to view polls');
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl('api/polls'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Please log in to view polls');
        } else {
          throw new Error('Failed to fetch polls');
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      // Backend returns paginated data: { page, limit, total, data }
      // We need to extract the 'data' array which contains the actual polls
      setPolls(result.data || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-indigo-100 rounded-2xl">
              <Vote className="size-12 text-indigo-600" />
            </div>
          </div>
          <h1 className="mb-4">Real-Time Voting Made Simple</h1>
          <p className="text-muted-foreground mb-8">
            Create polls, gather opinions, and see results update live. 
            Perfect for teams, events, and community decisions.
          </p>
          {user ? (
            <Button
              onClick={() => navigate('/create')}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="size-5 mr-2" />
              Create Your First Poll
            </Button>
          ) : (
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate('/signup')}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started Free
              </Button>
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                variant="outline"
              >
                Login
              </Button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-card rounded-xl border hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out active:scale-[0.99] cursor-default">
            <div className="inline-flex p-3 bg-indigo-100 rounded-lg mb-4 transition-all duration-200 ease-in-out">
              <TrendingUp className="size-6 text-indigo-600" />
            </div>
            <h3 className="mb-2">Real-Time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Watch results update instantly as votes come in with WebSocket technology
            </p>
          </div>
          <div className="text-center p-6 bg-card rounded-xl border hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out active:scale-[0.99] cursor-default">
            <div className="inline-flex p-3 bg-violet-100 rounded-lg mb-4 transition-all duration-200 ease-in-out">
              <Users className="size-6 text-violet-600" />
            </div>
            <h3 className="mb-2">Easy to Share</h3>
            <p className="text-sm text-muted-foreground">
              Share polls with anyone via a simple link. No sign-up required to vote
            </p>
          </div>
          <div className="text-center p-6 bg-card rounded-xl border hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out active:scale-[0.99] cursor-default">
            <div className="inline-flex p-3 bg-pink-100 rounded-lg mb-4 transition-all duration-200 ease-in-out">
              <Vote className="size-6 text-pink-600" />
            </div>
            <h3 className="mb-2">Beautiful Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Visualize results with interactive charts and detailed breakdowns
            </p>
          </div>
        </div>

        {/* Polls List */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2>Active Polls</h2>
            {user && (
              <Button
                onClick={() => navigate('/create')}
                variant="outline"
              >
                <PlusCircle className="size-4 mr-2" />
                New Poll
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : polls.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {polls.map((poll) => (
                <PollCard key={poll._id} poll={poll} onDelete={fetchPolls} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border hover:shadow-md transition-all duration-200 ease-in-out">
              <Vote className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="mb-2">No polls yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a poll and start gathering opinions!
              </p>
              {user && (
                <Button
                  onClick={() => navigate('/create')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusCircle className="size-4 mr-2" />
                  Create First Poll
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
