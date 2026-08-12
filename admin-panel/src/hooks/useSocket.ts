import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URLS } from '../api/apiConfig';
import { getAccessToken } from '../api/axiosClient';

export const useSocket = (namespace: string = '/tracking') => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Authorization access token is missing for WebSocket handshake.');
      return;
    }

    // Connect to tracking namespace
    const socket = io(`${API_BASE_URLS.trackingSocket}${namespace}`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(err.message);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [namespace]);

  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
  };
};
