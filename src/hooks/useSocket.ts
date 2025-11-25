import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

// For Socket.IO, use current origin if no API URL is specified
const SOCKET_URL = API_BASE_URL || window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    // Initialize socket connection only once
    if (socketRef.current) return;

    console.log('Initializing socket connection...');
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
      listenersRef.current.clear();
    };
  }, []);

  const joinPollRoom = useCallback((pollId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_poll', pollId);
      console.log('📥 Joined poll room:', pollId);
    } else {
      console.warn('Socket not connected, cannot join room');
    }
  }, []);

  const leavePollRoom = useCallback((pollId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_poll', pollId);
      console.log('📤 Left poll room:', pollId);
    }
  }, []);

  const onPollUpdate = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      // Track listeners to avoid duplicates
      if (!listenersRef.current.has('update_poll')) {
        listenersRef.current.set('update_poll', new Set());
      }
      
      const listeners = listenersRef.current.get('update_poll')!;
      if (!listeners.has(callback)) {
        socketRef.current.on('update_poll', callback);
        listeners.add(callback);
        console.log('👂 Added poll update listener');
      }
    }
  }, []);

  const offPollUpdate = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('update_poll', callback);
      
      const listeners = listenersRef.current.get('update_poll');
      if (listeners) {
        listeners.delete(callback);
        console.log('🔇 Removed poll update listener');
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinPollRoom,
    leavePollRoom,
    onPollUpdate,
    offPollUpdate,
  };
}
