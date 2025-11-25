import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Share2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { auth } from '../firebase';
import { getApiUrl } from '../config/api';

interface ShareDialogProps {
  pollId: string;
  pollTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ pollId, pollTitle, open, onOpenChange }: ShareDialogProps) {
  const [shareLink, setShareLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  console.log('ShareDialog render - open:', open, 'pollId:', pollId, 'pollTitle:', pollTitle);

  const generateShareLink = useCallback(async () => {
    console.log('Generate share link called for poll:', pollId);
    setLoading(true);
    setError('');
    
    try {
      const token = await auth.currentUser?.getIdToken();
      console.log('User token exists:', !!token);
      
      if (!token) {
        toast.error('You must be logged in to generate share link');
        setLoading(false);
        return;
      }

      console.log('Fetching share link from backend...');
      const response = await fetch(getApiUrl(`api/polls/${pollId}/share`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 503) {
          setError(data.error || 'Ngrok is not running');
          if (data.fallbackUrl && data.fallbackUrl.trim()) {
            console.log('Setting fallback URL:', data.fallbackUrl);
            setShareLink(data.fallbackUrl);
            toast.success('Fallback link generated (ngrok not running)');
          }
        } else {
          throw new Error(data.error || 'Failed to generate share link');
        }
      } else {
        // Validate that shareLink exists and is a non-empty string
        if (data.shareLink && typeof data.shareLink === 'string' && data.shareLink.trim()) {
          console.log('Setting share link:', data.shareLink);
          setShareLink(data.shareLink);
          console.log('Share link state updated, should trigger re-render');
          toast.success('Share link generated!');
        } else {
          console.error('Invalid shareLink received from backend:', data.shareLink);
          setError('Invalid share link received from server');
          toast.error('Failed to generate valid share link');
        }
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate share link';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // Auto-generate share link when dialog opens
  useEffect(() => {
    console.log('ShareDialog - open prop changed to:', open);
    if (open && !shareLink && !loading) {
      console.log('Auto-generating share link...');
      generateShareLink();
    }
  }, [open, shareLink, loading, generateShareLink]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('handleOpenChange called with:', newOpen);
    console.log('Current shareLink before close:', shareLink);
    if (!newOpen) {
      // Delay reset to allow dialog to close smoothly
      setTimeout(() => {
        setShareLink('');
        setError('');
        setCopied(false);
        console.log('ShareDialog state reset after close');
      }, 300);
    }
    onOpenChange(newOpen);
  };

  console.log('Rendering Dialog with open:', open, 'shareLink:', shareLink);

  if (!open) {
    console.log('ShareDialog: Dialog is closed (open=false)');
  } else {
    console.log('ShareDialog: Dialog is open (open=true), shareLink exists:', !!shareLink, 'shareLink value:', shareLink);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share Poll
          </DialogTitle>
          <DialogDescription>
            Generate a public link to share "{pollTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Debug info - can be removed after fixing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs bg-gray-100 p-2 rounded font-mono">
              <div>shareLink: {shareLink || '(empty)'}</div>
              <div>loading: {loading.toString()}</div>
              <div>error: {error || '(none)'}</div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Loader2 className="size-5 animate-spin text-indigo-600" />
              <span className="text-sm text-muted-foreground">Generating share link...</span>
            </div>
          )}

          {!loading && !shareLink && !error && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to generate a shareable link using ngrok
              </p>
              <Button
                onClick={generateShareLink}
                className="w-full"
              >
                <Share2 className="size-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          )}

          {error && !shareLink && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">{error}</p>
              </div>
            </div>
          )}

          {/* Always show link if it exists, regardless of error state */}
          {shareLink && shareLink.trim() && (
            <>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                  <AlertCircle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">{error}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Using local URL instead. This link only works on your network.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateShareLink}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate Link'
                    )}
                  </Button>
                  <Button
                    onClick={copyToClipboard}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {error ? (
                    'This local link only works on your network. Start ngrok for a public link.'
                  ) : (
                    'Anyone with this link can view and vote on your poll'
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
