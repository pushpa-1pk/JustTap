import { baseApi } from './baseApi';

export interface WalletSummary {
  balancePaise: number;
  withdrawnPaise: number;
  currency: string;
  bankDetailsSnapshot?: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
  };
}

export interface PayoutRequest {
  amountPaise: number;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<{ success: boolean; data: { gatewayOrderId: string; amountPaise: number; currency: string } }, { bookingId: string }>({
      query: (body) => ({
        url: '/payments/orders',
        method: 'POST',
        data: body,
      }),
    }),
    verifyPayment: builder.mutation<{ success: boolean; message: string; data: any }, { gatewayOrderId: string; gatewayPaymentId: string; gatewaySignature: string }>({
      query: (body) => ({
        url: '/payments/verify',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Bookings'],
    }),
    getWallet: builder.query<{ success: boolean; data: WalletSummary }, void>({
      query: () => ({
        url: '/payments/wallet',
        method: 'GET',
      }),
      providesTags: ['Profile'],
    }),
    requestWithdrawal: builder.mutation<{ success: boolean; message: string; data: any }, PayoutRequest>({
      query: (body) => ({
        url: '/payments/withdrawals',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetWalletQuery,
  useRequestWithdrawalMutation,
} = paymentApi;
