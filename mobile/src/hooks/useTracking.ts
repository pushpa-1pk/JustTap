import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV } from '@/config/env';
import { secureStore } from '@/utils/secureStore';

interface LocationCoordinate {
  latitude: number;
  longitude: number;
  heading?: number;
}

export function useTracking(bookingId: string | null) {
  const [coordinates, setCoordinates] = useState<LocationCoordinate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    let socket: Socket | null = null;

    const initializeSocket = async () => {
      try {
        const token = await secureStore.getAccessToken();
        
        // Resolve absolute URL for socket gateway
        const socketUrl = ENV.TRACKING_SERVICE_URL;

        socket = io(`${socketUrl}/tracking`, {
          auth: { token },
          transports: ['websocket'],
          forceNew: true,
        });

        socket.on('connect', () => {
          setIsConnected(true);
          console.log('[Socket] Connected to tracking service namespace');
          // Join the room for the active booking
          socket?.emit('join_booking_room', { bookingId });
        });

        // Listen for live location updates streamed from the provider
        socket.on('location_update', (data: any) => {
          console.log('[Socket] Location update received:', data);
          if (data && data.latitude && data.longitude) {
            setCoordinates({
              latitude: data.latitude,
              longitude: data.longitude,
              heading: data.heading,
            });
          }
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          console.log('[Socket] Disconnected from tracking service');
        });

        socket.on('connect_error', (err) => {
          console.warn('[Socket] Connection error:', err.message);
        });

      } catch (err) {
        console.error('[Socket] Initialization error:', err);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.emit('leave_booking_room', { bookingId });
        socket.disconnect();
      }
    };
  }, [bookingId]);

  return { coordinates, isConnected };
}

export default useTracking;
