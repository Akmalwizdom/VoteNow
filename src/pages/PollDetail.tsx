import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ArrowLeft, Users, CheckCircle2, Loader2, Edit2, Trash2, Share2, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getApiUrl } from '../config/api';

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdAt: string;
  createdBy?: string;
  createdByEmail?: string;
  createdByName?: string;
}

export function PollDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { joinPollRoom, leavePollRoom, onPollUpdate, offPollUpdate, isConnected } = useSocket();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Inline share box state
  const [showShareBox, setShowShareBox] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const generateShareLink = useCallback(async () => {
    if (!id) return;
    
    setShareLoading(true);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        toast.error('You must be logged in to generate share link');
        setShareLoading(false);
        return;
      }

      const response = await fetch(getApiUrl(`api/polls/${id}/share`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503 && data.fallbackUrl) {
          setShareLink(data.fallbackUrl);
          toast.success('Fallback link generated (ngrok not running)');
        } else {
          throw new Error(data.error || 'Failed to generate share link');
        }
      } else if (data.shareLink) {
        setShareLink(data.shareLink);
        toast.success('Share link generated!');
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate share link');
    } finally {
      setShareLoading(false);
    }
  }, [id]);

  const handleShareClick = () => {
    if (showShareBox) {
      setShowShareBox(false);
      setShareLink('');
      setShareCopied(false);
    } else {
      setShowShareBox(true);
      generateShareLink();
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Auto-open share box if navigated with ?share=true
  useEffect(() => {
    if (searchParams.get('share') === 'true' && !showShareBox && !loading) {
      setShowShareBox(true);
      generateShareLink();
      // Remove the query param from URL
      setSearchParams({});
    }
  }, [searchParams, showShareBox, loading, generateShareLink, setSearchParams]);

  // Fetch poll data
  const fetchPoll = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl(`api/polls/${id}`));
      if (!response.ok) {
        throw new Error('Poll not found');
      }
      const data = await response.json();
      setPoll(data);
      
      // Check if user has already voted (from localStorage)
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      if (votedPolls[id]) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      toast.error('Failed to load poll');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    
    // Fetch poll data
    fetchPoll();
    
    // Join the poll room for real-time updates
    joinPollRoom(id);

    // Listen for poll updates
    const handleUpdate = (updatedPoll: Poll) => {
      setPoll(updatedPoll);
    };
    
    onPollUpdate(handleUpdate);

    // Cleanup function - runs when component unmounts or id changes
    return () => {
      leavePollRoom(id);
      offPollUpdate(handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id - socket functions are now stable with useCallback

  const handleVote = async () => {
    if (selectedOption === null || !poll) {
      toast.error('Please select an option');
      return;
    }

    setVoting(true);

    try {
      // Generate or retrieve voter ID for anonymous voting
      let voterId = localStorage.getItem('voterId');
      if (!voterId) {
        // Generate a unique voter ID based on timestamp and random string
        voterId = `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('voterId', voterId);
      }

      // If user is authenticated, get their token (optional for voting)
      const token = user ? await auth.currentUser?.getIdToken() : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`api/polls/${id}/vote`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          optionIndex: selectedOption,
          voterId: voterId, // Send voterId for anonymous users
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const data = await response.json();
      setPoll(data.poll || data);
      setHasVoted(true);

      // Store in localStorage
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      votedPolls[id!] = selectedOption;
      localStorage.setItem('votedPolls', JSON.stringify(votedPolls));

      toast.success('Vote submitted successfully!');
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/poll/${id}/edit`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        toast.error('You must be logged in to delete polls');
        return;
      }

      const response = await fetch(getApiUrl(`api/polls/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete poll');
      }

      toast.success('Poll deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete poll');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Prepare chart data
  const chartData = poll?.options.map((option, index) => ({
    name: option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text,
    votes: option.votes,
    fullName: option.text,
  })) || [];

  const totalVotes = poll?.options.reduce((sum, option) => sum + option.votes, 0) || 0;
  const isCreator = user && poll && poll.createdBy === user.uid;

  const COLORS = [
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f97316', // orange-500
    '#06b6d4', // cyan-500
    '#a855f7', // purple-500
    '#ef4444', // red-500
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Polls
        </Button>

        {/* Poll Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1>{poll.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="size-3" />
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </Badge>
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Live
                </Badge>
              )}
              {isCreator && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareClick}
                    className={showShareBox ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"}
                    type="button"
                  >
                    {showShareBox ? (
                      <>
                        <X className="size-4 mr-2" />
                        Close
                      </>
                    ) : (
                      <>
                        <Share2 className="size-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Edit2 className="size-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
          {poll.description && (
            <p className="text-muted-foreground">{poll.description}</p>
          )}
        </div>

        {/* Inline Share Box */}
        {showShareBox && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="size-5 text-indigo-600" />
              <span className="font-medium text-indigo-900">Share this poll</span>
            </div>
            
            {shareLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="size-4 animate-spin text-indigo-600" />
                <span className="text-sm text-indigo-700">Generating share link...</span>
              </div>
            ) : shareLink ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1 font-mono text-sm bg-white"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    onClick={copyShareLink}
                    className={shareCopied ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"}
                  >
                    {shareCopied ? (
                      <>
                        <Check className="size-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-indigo-600">
                  Anyone with this link can view and vote on your poll
                </p>
              </div>
            ) : (
              <div className="text-sm text-red-600">
                Failed to generate link. Please try again.
              </div>
            )}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Voting Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>
                {hasVoted ? 'You have already voted in this poll' : 'Select one option below'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasVoted ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="size-5 text-green-600" />
                    <span className="text-green-700">Thank you for voting!</span>
                  </div>
                  
                  {/* Show results as list */}
                  <div className="space-y-3 mt-6">
                    {poll.options.map((option, index) => {
                      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{option.text}</span>
                            <span className="text-muted-foreground">
                              {option.votes} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <RadioGroup
                    value={selectedOption?.toString()}
                    onValueChange={(value) => setSelectedOption(parseInt(value))}
                  >
                    <div className="space-y-3">
                      {poll.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => setSelectedOption(index)}
                        >
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label
                            htmlFor={`option-${index}`}
                            className="flex-1 cursor-pointer"
                          >
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <Button
                    onClick={handleVote}
                    disabled={selectedOption === null || voting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {voting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Vote'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Live Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Live Results</CardTitle>
              <CardDescription>
                Results update in real-time as votes come in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalVotes > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                Votes: {data.votes} ({((data.votes / totalVotes) * 100).toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="votes" radius={[0, 8, 8, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <Users className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No votes yet</p>
                    <p className="text-sm">Be the first to vote!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be undone and all votes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
