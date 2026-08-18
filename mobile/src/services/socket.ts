import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { secureStore } from '../utils/secureStore';
import { useProviderStore } from '../store/providerStore';
import { JobOffer } from '../types/job';

class SocketService {
  private socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;

    try {
      const token = await secureStore.getAccessToken();
      if (!token) return;

      this.socket = io(ENV.NOTIFICATION_SERVICE_URL, {
        auth: { token },
        transports: ['websocket'],
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to notification service');
      });

      this.socket.on('job:offer', (payload: any) => {
        console.log('[Socket] Incoming job offer event:', payload);
        if (!payload || !payload.jobId) return;

        const normalizedOffer: JobOffer = {
          id: payload.jobId,
          serviceType: payload.serviceType || 'General Service',
          distanceKm: payload.distanceKm || 0,
          customerFirstName: payload.customerFirstName || 'Customer',
          customerRating: payload.customerRating || 5.0,
          price: payload.price || 0,
          estimatedDurationMinutes: payload.estimatedDurationMinutes || 30,
          expiresInSeconds: payload.expiresInSeconds || 30,
        };

        useProviderStore.getState().setIncomingOffer(normalizedOffer);
      });

      this.socket.on('job:expired', (payload: any) => {
        console.log('[Socket] Job expired/withdrawn:', payload);
        const currentOffer = useProviderStore.getState().incomingOffer;
        if (currentOffer && payload?.jobId === currentOffer.id) {
          useProviderStore.getState().clearIncomingOffer();
        }
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from notification service');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

    } catch (err) {
      console.error('[Socket] Initialization failed:', err);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
