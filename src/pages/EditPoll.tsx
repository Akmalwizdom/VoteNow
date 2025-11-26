import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { X, Plus, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { getApiUrl } from '../config/api';
import { toLocalDateTimeString } from '../utils/pollStatus';

export function EditPoll() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingPoll, setFetchingPoll] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<Array<{ text: string; votes: number }>>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [useScheduling, setUseScheduling] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('You must be logged in to edit polls');
      navigate('/login');
      return;
    }
    fetchPoll();
  }, [id, user]);

  const fetchPoll = async () => {
    try {
      const response = await fetch(getApiUrl(`api/polls/${id}`));
      if (!response.ok) {
        throw new Error('Failed to fetch poll');
      }
      const poll = await response.json();
      
      // Check if user is the creator
      if (poll.createdBy !== user?.uid) {
        toast.error('You are not authorized to edit this poll');
        navigate(`/poll/${id}`);
        return;
      }

      setTitle(poll.title);
      setDescription(poll.description || '');
      setOptions(poll.options);
      
      // Load scheduling data
      if (poll.startTime || poll.endTime) {
        setUseScheduling(true);
        if (poll.startTime) setStartTime(toLocalDateTimeString(new Date(poll.startTime)));
        if (poll.endTime) setEndTime(toLocalDateTimeString(new Date(poll.endTime)));
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      toast.error('Failed to load poll');
      navigate('/');
    } finally {
      setFetchingPoll(false);
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { text: '', votes: 0 }]);
    } else {
      toast.error('Maximum 10 options allowed');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error('Minimum 2 options required');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      toast.error('Please enter a poll title');
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 valid options');
      return;
    }

    // Validate scheduling
    if (useScheduling && startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        toast.error('End time must be after start time');
        return;
      }
    }

    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        toast.error('You must be logged in to edit a poll');
        setLoading(false);
        return;
      }
      
      const response = await fetch(getApiUrl(`api/polls/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          options: validOptions.map(opt => ({ text: opt.text, votes: opt.votes })),
          startTime: useScheduling && startTime ? new Date(startTime).toISOString() : null,
          endTime: useScheduling && endTime ? new Date(endTime).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to update poll');
      }

      toast.success('Poll updated successfully!');
      navigate(`/poll/${id}`);
    } catch (error) {
      console.error('Error updating poll:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPoll) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Poll</CardTitle>
          <CardDescription>
            Update your poll details. Note: existing votes will be preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="What's your question?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add more context to your poll..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Poll Options *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 10}
                >
                  <Plus className="size-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center transition-all duration-200 ease-in-out">
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(index, e.target.value)}
                        maxLength={100}
                      />
                      {option.votes > 0 && (
                        <div className="flex items-center gap-1 px-3 bg-muted rounded-md">
                          <span className="text-sm text-muted-foreground">
                            {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      )}
                    </div>
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200 ease-in-out"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useScheduling"
                  checked={useScheduling}
                  onChange={(e) => setUseScheduling(e.target.checked)}
                  className="size-4 rounded border-gray-300 transition-all duration-200 ease-in-out"
                />
                <Label htmlFor="useScheduling" className="flex items-center gap-2 cursor-pointer hover:text-indigo-700 transition-all duration-200 ease-in-out">
                  <Clock className="size-4" />
                  Schedule poll timing
                </Label>
              </div>

              {useScheduling && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to start immediately</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no deadline</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/poll/${id}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Poll'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
