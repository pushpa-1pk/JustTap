import { create } from 'zustand';
import { Provider, DashboardStats, RecentJob } from '../types/provider';
import { ActiveJob, JobOffer, OfferStage } from '../types/job';

interface ProviderState {
  provider: Provider | null;
  isOnline: boolean;
  isAvailabilityUpdating: boolean;
  activeJob: ActiveJob | null;
  incomingOffer: JobOffer | null;
  offerStage: OfferStage;
  unreadNotificationCount: number;
  dashboardStats: DashboardStats | null;
  recentJobs: RecentJob[];
  pendingRequests: any[];
  
  // Actions
  setProvider: (provider: Provider | null) => void;
  setOnline: (isOnline: boolean) => void;
  setOffline: () => void;
  setAvailabilityUpdating: (updating: boolean) => void;
  setActiveJob: (job: ActiveJob | null) => void;
  setIncomingOffer: (offer: JobOffer | null) => void;
  clearIncomingOffer: () => void;
  setOfferStage: (stage: OfferStage) => void;
  setUnreadNotificationCount: (count: number) => void;
  setDashboardStats: (stats: DashboardStats | null) => void;
  setRecentJobs: (jobs: RecentJob[]) => void;
  setPendingRequests: (requests: any[]) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
  provider: null,
  isOnline: false,
  isAvailabilityUpdating: false,
  activeJob: null,
  incomingOffer: null,
  offerStage: 'NO_OFFER',
  unreadNotificationCount: 0,
  dashboardStats: null,
  recentJobs: [],
  pendingRequests: [],

  setProvider: (provider) => set({ provider }),
  setOnline: (isOnline) => set({ isOnline, isAvailabilityUpdating: false }),
  setOffline: () => set({ isOnline: false, isAvailabilityUpdating: false }),
  setAvailabilityUpdating: (updating) => set({ isAvailabilityUpdating: updating }),
  setActiveJob: (job) => set({ activeJob: job }),
  setIncomingOffer: (offer) => set((state) => {
    // Deduplication check by jobId to prevent multiple overlays (Requirement 27)
    if (offer && state.incomingOffer?.id === offer.id) {
      return {};
    }
    
    // Defensive active job check: never show offer if provider has active job (Requirement 18)
    if (offer && state.activeJob !== null) {
      return {};
    }

    if (offer) {
      // Convert expiresInSeconds into an absolute timestamp (Requirement 21)
      const expiresAtTimestamp = Date.now() + offer.expiresInSeconds * 1000;
      return { 
        incomingOffer: { ...offer, expiresAtTimestamp },
        offerStage: 'OFFER_RECEIVED'
      };
    }

    return { incomingOffer: null, offerStage: 'NO_OFFER' };
  }),
  clearIncomingOffer: () => set({ incomingOffer: null, offerStage: 'NO_OFFER' }),
  setOfferStage: (stage) => set({ offerStage: stage }),
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setRecentJobs: (recentJobs) => set({ recentJobs }),
  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
}));
