import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Calendar } from 'lucide-react';

interface PollCardProps {
  poll: {
    _id: string;
    title: string;
    description?: string;
    options: Array<{ text: string; votes: number }>;
    createdAt: string;
  };
}

export function PollCard({ poll }: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const formattedDate = new Date(poll.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
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
        </CardContent>
      </Card>
    </Link>
  );
}
