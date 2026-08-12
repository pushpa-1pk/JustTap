import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../config/axios';
import { store } from '../redux/store';
import { setCredentials } from '../redux/slices/authSlice';
import { secureStore } from '../utils/secureStore';
import { AppUserRole } from '../utils/auth';

export interface Address {
  _id: string;
  label: 'home' | 'office' | 'other';
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface CustomerProfile {
  userId: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | null;
  dateOfBirth: string | null;
  email: string | null;
  language: string;
  profileImage: string;
  profileImageStorageKey: string | null;
  profileImageStorageProvider?: string | null;
  profileCompletion: number;
  emergencyContact?: EmergencyContact;
  createdAt?: string;
}

export interface SupportTicket {
  _id: string;
  subject: string;
  description: string;
  category: 'BILLING' | 'BOOKING' | 'TECHNICAL' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: Array<{
    sender: 'CUSTOMER' | 'SUPPORT_AGENT';
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ReferralInfo {
  referralCode: string;
  referralEarningsPaise: number;
  referralHistory: Array<{
    name: string;
    status: 'COMPLETED' | 'PENDING';
    date: string;
    rewardPaise: number;
  }>;
}

// Hooks for Profile & Addresses
export function useGetCustomerProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/profiles/customer/with-addresses');
      return response.data.data as { profile: CustomerProfile; addresses: Address[] };
    },
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CustomerProfile>) => {
      const response = await apiClient.put('/profiles/customer', payload);
      return response.data.data as CustomerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useCreateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CustomerProfile>) => {
      const response = await apiClient.post('/profiles/customer', payload);
      return response.data.data as CustomerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Hooks for Addresses
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Address, '_id' | 'isPrimary'>) => {
      const response = await apiClient.post('/addresses', payload);
      return response.data.data as Address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Address> }) => {
      const response = await apiClient.put(`/addresses/${id}`, payload);
      return response.data.data as Address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/addresses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/addresses/${id}/set-primary`);
      return response.data.data as Address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Hooks for Support tickets & FAQs
export function useGetFAQs() {
  return useQuery({
    queryKey: ['support', 'faqs'],
    queryFn: async () => {
      const response = await apiClient.get('/support/faqs');
      return response.data.data as FAQ[];
    },
  });
}

export function useGetSupportTickets() {
  return useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: async () => {
      const response = await apiClient.get('/support/tickets');
      return response.data.data as SupportTicket[];
    },
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subject: string; description: string; category: string }) => {
      const response = await apiClient.post('/support/tickets', payload);
      return response.data.data as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },
  });
}

export function useGetReferralInfo() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const response = await apiClient.get('/profiles/customer/referral');
      return response.data.data as ReferralInfo;
    },
  });
}

export function useBecomeProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/become-provider');
      return response.data.data as { user: any; accessToken: string; refreshToken: string };
    },
    onSuccess: async (data) => {
      if (data && data.accessToken) {
        await secureStore.saveTokens(data.accessToken, data.refreshToken);
        await secureStore.saveRole(data.user.role as AppUserRole);
        const { normalizeUserRole, normalizeUserRoles, normalizeProfileCompletion } = require('../utils/auth');
        const normalizedUser = {
          id: data.user.id || data.user._id,
          phone: data.user.phone,
          role: normalizeUserRole(data.user.role),
          roles: normalizeUserRoles(data.user.roles, data.user.role),
          accountStatus: data.user.accountStatus,
          isProfileComplete: normalizeProfileCompletion(data.user),
        };
        store.dispatch(setCredentials({ user: normalizedUser, accessToken: data.accessToken }));
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSwitchRole() {
  return useMutation({
    mutationFn: async (role: AppUserRole) => {
      const response = await apiClient.post('/auth/switch-role', { role: role.toUpperCase() });
      return response.data.data as { user: any; accessToken: string; refreshToken: string };
    },
    onSuccess: async (data) => {
      if (data && data.accessToken) {
        await secureStore.saveTokens(data.accessToken, data.refreshToken);
        await secureStore.saveRole(data.user.role as AppUserRole);
        const { normalizeUserRole, normalizeUserRoles, normalizeProfileCompletion } = require('../utils/auth');
        const normalizedUser = {
          id: data.user.id || data.user._id,
          phone: data.user.phone,
          role: normalizeUserRole(data.user.role),
          roles: normalizeUserRoles(data.user.roles, data.user.role),
          accountStatus: data.user.accountStatus,
          isProfileComplete: normalizeProfileCompletion(data.user),
        };
        store.dispatch(setCredentials({ user: normalizedUser, accessToken: data.accessToken }));
      }
    },
  });
}
