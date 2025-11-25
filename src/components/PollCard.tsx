import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Users, Calendar, Edit2, Trash2, Loader2, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { ShareDialog } from './ShareDialog';
import { toast } from 'sonner@2.0.3';
import { getApiUrl } from '../config/api';

interface PollCardProps {
  poll: {
    _id: string;
    title: string;
    description?: string;
    options: Array<{ text: string; votes: number }>;
    createdAt: string;
    createdBy?: string;
    createdByEmail?: string;
    createdByName?: string;
  };
  onDelete?: () => void;
}

export function PollCard({ poll, onDelete }: PollCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const formattedDate = new Date(poll.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isCreator = user && poll.createdBy === user.uid;
  
  // Debug logging
  console.log('PollCard render:', {
    pollId: poll._id,
    pollCreatedBy: poll.createdBy,
    currentUserId: user?.uid,
    isCreator
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit button clicked');
    navigate(`/poll/${poll._id}/edit`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        toast.error('You must be logged in to delete polls');
        return;
      }

      const response = await fetch(getApiUrl(`api/polls/${poll._id}`), {
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
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete poll');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked');
    setShowDeleteDialog(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Share button clicked, isCreator:', isCreator);
    setShowShareDialog(true);
  };

  return (
    <>
      <ShareDialog
        pollId={poll._id}
        pollTitle={poll.title}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      <Link to={`/poll/${poll._id}`}>
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-border hover:border-indigo-400">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-2">{poll.title}</CardTitle>
                {poll.description && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {poll.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="ml-2">
                {poll.options.length} options
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="size-4" />
                  <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              
              {isCreator && (
                <div 
                  className="flex items-center gap-1 z-10 relative" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-indigo-100 hover:text-indigo-700"
                    onClick={handleShareClick}
                    title="Share poll"
                    type="button"
                  >
                    <Share2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={handleEdit}
                    title="Edit poll"
                    type="button"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleDeleteClick}
                    title="Delete poll"
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

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
    </>
  );
}
