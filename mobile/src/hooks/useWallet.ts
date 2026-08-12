import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../config/axios';
import { store } from '../redux/store';

export interface CustomerWallet {
  customerId: string;
  balancePaise: number;
  rewardPoints: number;
  cashbackPaise: number;
  referralBonusPaise: number;
}

export interface CustomerTransaction {
  _id: string;
  amountPaise: number;
  type: 'CREDIT' | 'DEBIT';
  balanceType: 'WALLET' | 'REWARDS' | 'CASHBACK' | 'REFERRAL';
  description: string;
  createdAt: string;
}

export interface PaymentMethod {
  _id: string;
  type: 'UPI' | 'CARD';
  details: {
    upiId?: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpiry?: string;
  };
  isDefault: boolean;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscountPaise?: number;
  minOrderValuePaise: number;
  expiryDate: string;
  isActive: boolean;
}

export interface Invoice {
  _id: string;
  bookingId: string;
  invoiceNumber: string;
  type: 'CUSTOMER_RECEIPT' | 'PROVIDER_SETTLEMENT' | 'PLATFORM_COMMISSION';
  invoiceStatus: 'GENERATING' | 'READY' | 'FAILED';
  recipientId: string;
  totalAmountPaise: number;
  taxAmountPaise: number;
  s3Url: string | null;
  issuedAt: string;
}

export function useGetCustomerWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/customer');
      return response.data.data as CustomerWallet;
    },
  });
}

export function useGetCustomerTransactions() {
  return useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/customer/transactions');
      return response.data.data as CustomerTransaction[];
    },
  });
}

export function useAddCustomerFunds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amountPaise: number) => {
      const response = await apiClient.post('/wallet/customer/add-funds', { amountPaise });
      return response.data.data as CustomerWallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
}

// Payment Methods Hooks
export function useGetPaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await apiClient.get('/methods');
      return response.data.data as PaymentMethod[];
    },
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { type: 'UPI' | 'CARD'; details: any }) => {
      const response = await apiClient.post('/methods', payload);
      return response.data.data as PaymentMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/methods/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/methods/${id}/default`);
      return response.data.data as PaymentMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

// Coupon Hooks
export function useGetAvailableCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const response = await apiClient.get('/coupons/available');
      return response.data.data as Coupon[];
    },
  });
}

// Invoice Hooks
export function useGetCustomerInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await apiClient.get('/invoices');
      return response.data.data as Invoice[];
    },
  });
}
