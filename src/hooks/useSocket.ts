import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinPollRoom = (pollId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_poll', pollId);
      console.log('Joined poll room:', pollId);
    }
  };

  const leavePollRoom = (pollId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_poll', pollId);
      console.log('Left poll room:', pollId);
    }
  };

  const onPollUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('update_poll', callback);
    }
  };

  const offPollUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('update_poll', callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinPollRoom,
    leavePollRoom,
    onPollUpdate,
    offPollUpdate,
  };
}
