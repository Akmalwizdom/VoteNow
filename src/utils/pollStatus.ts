export type PollStatus = 'not_started' | 'active' | 'ended';

export interface PollStatusInfo {
  status: PollStatus;
  label: string;
  canVote: boolean;
  timeRemaining?: string;
  color: string;
}

export function getPollStatus(startTime?: string | null, endTime?: string | null): PollStatusInfo {
  const now = new Date();
  
  if (startTime) {
    const start = new Date(startTime);
    if (now < start) {
      return {
        status: 'not_started',
        label: 'Not Started',
        canVote: false,
        timeRemaining: getTimeRemaining(start),
        color: 'yellow'
      };
    }
  }
  
  if (endTime) {
    const end = new Date(endTime);
    if (now > end) {
      return {
        status: 'ended',
        label: 'Ended',
        canVote: false,
        color: 'red'
      };
    }
    
    return {
      status: 'active',
      label: 'Active',
      canVote: true,
      timeRemaining: getTimeRemaining(end),
      color: 'green'
    };
  }
  
  return {
    status: 'active',
    label: 'Active',
    canVote: true,
    color: 'green'
  };
}

export function getTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Now';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function toLocalDateTimeString(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  // Format: YYYY-MM-DDTHH:mm (for datetime-local input)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
