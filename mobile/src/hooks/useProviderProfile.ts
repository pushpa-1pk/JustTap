import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../config/axios';
import { store } from '../redux/store';

export interface ProviderProfile {
  userId: string;
  businessName: string;
  experience: number;
  workingRadius: number;
  currentLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  workingHours: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  verificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
  bio: string;
  profileImage: string;
  profileImageStorageProvider?: string | null;
  profileImageStorageKey?: string | null;
  profileCompletion: number;
  rating: number;
  totalJobs: number;
  isOnline: boolean;
  approvalRequestedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  // Extra fields from Customer/User Profile linked to personal details
  fullName?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other' | null;
  dateOfBirth?: string | null;
  language?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface ProviderBankDetails {
  _id?: string;
  accountHolderName: string;
  accountNumberMasked?: string;
  accountNumber?: string;
  ifscCode: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  upiId?: string;
  verified?: boolean;
}

export interface ProviderDocument {
  _id: string;
  documentType: 'aadhar' | 'pan' | 'profile_photo' | 'trade_license' | 'gst' | 'shop_license';
  fileUrl: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface ProviderService {
  _id: string;
  providerId: string;
  serviceId: string;
  price: number;
  experience: number;
  isAvailable: boolean;
  serviceDetails?: {
    name: string;
    description: string;
    basePrice: number;
    estimatedDuration: number;
    categoryName?: string;
  };
}

export interface ProviderWallet {
  providerId: string;
  balancePaise: number;
  withdrawnPaise: number;
  pendingSettlementPaise: number;
  commissionRate: number;
}

export interface ProviderTransaction {
  _id: string;
  amountPaise: number;
  type: 'CREDIT' | 'DEBIT';
  balanceType: 'WALLET' | 'SETTLEMENT';
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface ProviderBooking {
  _id: string;
  bookingNumber: string;
  customerId: string;
  bookingStatus: 'PENDING' | 'ACCEPTED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  scheduledStartTime: string;
  customerSnapshot: {
    fullName: string;
    phone: string;
  };
  snapshotPricing: {
    totalAmountToPay: number;
  };
  serviceDetails?: {
    name: string;
  };
}

export interface ProviderReviewsSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ProviderReview {
  _id: string;
  bookingId: string;
  rating: number;
  comment: string;
  reviewerName: string;
  photos: string[];
  providerResponse?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  categories: {
    booking: boolean;
    payment: boolean;
    wallet: boolean;
    review: boolean;
    marketing: boolean;
    support: boolean;
    promotions: boolean;
    system: boolean;
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inapp: boolean;
  };
  language: 'en' | 'hi' | 'te' | 'ta' | 'kn';
}


// --- HOOKS IMPLEMENTATION ---

// Hook: Get Provider Profile
export function useGetProviderProfile() {
  return useQuery({
    queryKey: ['provider', 'profile'],
    queryFn: async () => {
      
      try {
        const profileRes = await apiClient.get('/profiles/provider');
        const personalRes = await apiClient.get('/profiles/customer');
        const profile = profileRes.data?.data;
        const personal = personalRes.data?.data;
        
        return {
          ...profile,
          fullName: personal?.fullName,
          email: personal?.email,
          gender: personal?.gender,
          dateOfBirth: personal?.dateOfBirth,
          language: personal?.language,
          emergencyContact: personal?.emergencyContact,
        } as ProviderProfile;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Empty state placeholder profile
          return null;
        }
        throw err;
      }
    },
  });
}

// Hook: Update Provider Profile
export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProviderProfile>) => {
      
      // Separate personal details and provider profile details
      const personalFields = ['fullName', 'email', 'gender', 'dateOfBirth', 'language', 'emergencyContact'];
      const personalPayload: Record<string, any> = {};
      const providerPayload: Record<string, any> = {};

      Object.entries(payload).forEach(([key, val]) => {
        if (personalFields.includes(key)) {
          personalPayload[key] = val;
        } else {
          providerPayload[key] = val;
        }
      });

      // Execute personal updates if present
      if (Object.keys(personalPayload).length > 0) {
        await apiClient.put('/profiles/customer', personalPayload);
      }

      // Execute provider updates if present
      let updatedProvider = null;
      if (Object.keys(providerPayload).length > 0) {
        const res = await apiClient.put('/profiles/provider', providerPayload);
        updatedProvider = res.data?.data;
      }

      return updatedProvider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
    },
  });
}

// Hook: Create Provider Profile
export function useCreateProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProviderProfile>) => {
      
      
      const personalFields = ['fullName', 'email', 'gender', 'dateOfBirth', 'language', 'emergencyContact'];
      const personalPayload: Record<string, any> = {};
      const providerPayload: Record<string, any> = {};

      Object.entries(payload).forEach(([key, val]) => {
        if (personalFields.includes(key)) {
          personalPayload[key] = val;
        } else {
          providerPayload[key] = val;
        }
      });

      // Execute personal updates if present
      if (Object.keys(personalPayload).length > 0) {
        try {
          await apiClient.put('/profiles/customer', personalPayload);
        } catch (err: any) {
          if (err.response?.status === 404) {
            await apiClient.post('/profiles/customer', {
              ...personalPayload,
              fullName: personalPayload.fullName || 'Provider User',
              language: personalPayload.language || 'English',
            });
          } else {
            throw err;
          }
        }
      }

      // Create provider profile
      const res = await apiClient.post('/profiles/provider', {
        ...providerPayload,
        businessName: providerPayload.businessName || 'Business Provider',
        experience: Number(providerPayload.experience || 2),
        workingRadius: Number(providerPayload.workingRadius || 10),
        latitude: providerPayload.latitude ?? 21.1458,
        longitude: providerPayload.longitude ?? 79.0882,
        workingHours: providerPayload.workingHours ?? { start: '09:00', end: '18:00' },
      });

      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
    },
  });
}

// Hook: Update Provider Location Coords
export function useUpdateProviderLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { latitude: number; longitude: number }) => {
      
      const response = await apiClient.put('/profiles/provider/location', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
    },
  });
}

// Hook: Toggle Online/Offline Status
export function useToggleOnlineStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      
      const response = await apiClient.put('/profiles/provider/online-status', { isOnline });
      return response.data?.data as ProviderProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
    },
  });
}

// Hook: Request Profile Approval
export function useRequestApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      
      const response = await apiClient.post('/profiles/provider/request-approval');
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
    },
  });
}

// Hook: Get Provider Bank Details
export function useGetProviderBankDetails() {
  return useQuery({
    queryKey: ['provider', 'bank'],
    queryFn: async () => {
      
      try {
        const response = await apiClient.get('/bank-details');
        return response.data?.data as ProviderBankDetails;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
  });
}

// Hook: Create Provider Bank Details
export function useCreateProviderBankDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProviderBankDetails) => {
      
      const response = await apiClient.post('/bank-details', payload);
      return response.data?.data as ProviderBankDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'bank'] });
    },
  });
}

// Hook: Update Provider Bank Details
export function useUpdateProviderBankDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProviderBankDetails>) => {
      
      const response = await apiClient.put('/bank-details', payload);
      return response.data?.data as ProviderBankDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'bank'] });
    },
  });
}

// Hook: Delete Provider Bank Details
export function useDeleteProviderBankDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      
      const response = await apiClient.delete('/bank-details');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'bank'] });
    },
  });
}

// Hook: Get Provider KYC Documents
export function useGetProviderDocuments() {
  return useQuery({
    queryKey: ['provider', 'documents'],
    queryFn: async () => {
      
      const response = await apiClient.get('/documents');
      return response.data?.data as ProviderDocument[];
    },
  });
}

// Hook: Upload Provider Document
export function useUploadProviderDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { documentType: string; fileUrl: string }) => {
      
      const response = await apiClient.post('/documents/upload', payload);
      return response.data?.data as ProviderDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
    },
  });
}

// Hook: Delete Provider Document
export function useDeleteProviderDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      
      const response = await apiClient.delete(`/documents/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'documents'] });
    },
  });
}

// Hook: Get Offered Services
export function useGetProviderServices() {
  return useQuery({
    queryKey: ['provider', 'services'],
    queryFn: async () => {
      
      const response = await apiClient.get('/provider/services');
      return response.data?.data as ProviderService[];
    },
  });
}

// Hook: Add Offered Service
export function useCreateProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serviceId: string; price: number; experience: number; isAvailable?: boolean }) => {
      
      const response = await apiClient.post('/provider/services', payload);
      return response.data?.data as ProviderService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
    },
  });
}

// Hook: Edit Offered Service
export function useUpdateProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerServiceId, payload }: { providerServiceId: string; payload: { price?: number; experience?: number } }) => {
      
      const response = await apiClient.put(`/provider/services/${providerServiceId}`, payload);
      return response.data?.data as ProviderService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
    },
  });
}

// Hook: Toggle Offered Service Status
export function useUpdateProviderServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerServiceId, isAvailable }: { providerServiceId: string; isAvailable: boolean }) => {
      
      const response = await apiClient.patch(`/provider/services/${providerServiceId}/status`, { isAvailable });
      return response.data?.data as ProviderService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
    },
  });
}

// Hook: Delete Offered Service
export function useDeleteProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (providerServiceId: string) => {
      
      const response = await apiClient.delete(`/provider/services/${providerServiceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
    },
  });
}

// Hook: Get Catalog Categories
export function useGetCatalogCategories() {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async () => {
      
      const response = await apiClient.get('/categories');
      return response.data?.data?.items || response.data?.data || [];
    },
  });
}

// Hook: Get Catalog Services
export function useGetCatalogServices() {
  return useQuery({
    queryKey: ['catalog', 'services'],
    queryFn: async () => {
      
      const response = await apiClient.get('/services');
      return response.data?.data?.items || response.data?.data || [];
    },
  });
}

// Hook: Get Provider Wallet Details
export function useGetProviderWallet() {
  return useQuery({
    queryKey: ['provider', 'wallet'],
    queryFn: async () => {
      
      const response = await apiClient.get('/wallet');
      return response.data?.data as ProviderWallet;
    },
  });
}

// Hook: Get Provider Ledger Transactions
export function useGetProviderTransactions() {
  return useQuery({
    queryKey: ['provider', 'transactions'],
    queryFn: async () => {
      
      const response = await apiClient.get('/wallet/transactions');
      return response.data?.data as ProviderTransaction[];
    },
  });
}

// Hook: Request Payout Withdrawal
export function useRequestProviderWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amountPaise: number; bankDetails: any }) => {
      
      const response = await apiClient.post('/withdrawals', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'transactions'] });
    },
  });
}

// Hook: Get Provider Bookings History
export function useGetProviderBookings() {
  return useQuery({
    queryKey: ['provider', 'bookings'],
    queryFn: async () => {
      
      const pendingRes = await apiClient.get('/bookings/provider/pending');
      const activeRes = await apiClient.get('/bookings/provider/active');
      const historyRes = await apiClient.get('/bookings/provider/history');

      const bookings: ProviderBooking[] = [];
      
      if (pendingRes.data?.data) {
        bookings.push(...pendingRes.data.data.map((b: any) => ({ ...b, bookingStatus: 'PENDING' })));
      }
      if (activeRes.data?.data) {
        bookings.push(...activeRes.data.data.map((b: any) => ({ ...b, bookingStatus: 'ONGOING' })));
      }
      if (historyRes.data?.data) {
        // History res contains items or arrays directly
        const list = Array.isArray(historyRes.data.data) ? historyRes.data.data : (historyRes.data.data.items || []);
        bookings.push(...list);
      }

      return bookings;
    },
  });
}

// Hook: Get Provider Reviews
export function useGetProviderReviews(providerId: string) {
  return useQuery({
    queryKey: ['provider', 'reviews', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const response = await apiClient.get(`/public/provider/${providerId}`);
      return (response.data?.data || []) as ProviderReview[];
    },
    enabled: Boolean(providerId),
  });
}

// Hook: Get Provider Review Score Summary
export function useGetProviderReviewSummary(providerId: string) {
  return useQuery({
    queryKey: ['provider', 'review-summary', providerId],
    queryFn: async () => {
      const emptySummary: ProviderReviewsSummary = {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      if (!providerId) return emptySummary;
      
      const response = await apiClient.get(`/public/summary/${providerId}`);
      return (response.data?.data || emptySummary) as ProviderReviewsSummary;
    },
    enabled: Boolean(providerId),
  });
}

// Hook: Get Provider Notification Preferences
export function useGetNotificationPreferences() {
  return useQuery({
    queryKey: ['provider', 'notification-preferences'],
    queryFn: async () => {
      
      // Note: we fetch notifications/preferences or preferences directly depending on backend
      const response = await apiClient.get('/preferences');
      return response.data?.data as NotificationPreferences;
    },
  });
}

// Hook: Update Provider Notification Preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<NotificationPreferences>) => {
      
      const response = await apiClient.put('/preferences', payload);
      return response.data?.data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'notification-preferences'] });
    },
  });
}
