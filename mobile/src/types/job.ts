export interface ActiveJob {
  id: string;
  serviceName: string;
  status: string;
  etaMinutes: number | null;
}

export interface JobOffer {
  id: string;
  serviceType: string;
  distanceKm: number;
  customerFirstName: string;
  customerRating: number;
  price: number;
  estimatedDurationMinutes: number;
  expiresInSeconds: number;
  expiresAtTimestamp?: number; // Absolute timestamp computed locally upon receipt
}

export type OfferStage = 
  | 'NO_OFFER'
  | 'OFFER_RECEIVED'
  | 'DISPLAYING'
  | 'ACCEPTING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type JobStatus =
  | 'SCHEDULED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'SERVICE_STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export interface ProviderJob {
  id: string;
  serviceName: string;
  serviceType: string;

  customer: {
    id: string;
    firstName: string;
    rating: number | null;
  };

  scheduledAt: string;
  hasStartedTravel: boolean;

  status: JobStatus;
  paymentStatus: PaymentStatus;

  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  distanceKm?: number;
  estimatedEarnings: number;

  cancellation?: {
    cancelledBy: 'CUSTOMER' | 'PROVIDER' | 'SYSTEM' | 'JUSTTAP';
    reason?: string;
    cancelledAt: string;
  };

  rating?: number | null;
}

