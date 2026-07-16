import { baseApi } from './baseApi';

export interface WalletSummary {
  balancePaise: number;
  pendingBalancePaise: number;
  withdrawnPaise: number;
  lifetimeEarningsPaise: number;
  currency: string;
}

export interface PayoutRequest {
  amountPaise: number;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

type RawWallet = {
  availableBalancePaise?: number;
  pendingBalancePaise?: number;
  withdrawnBalancePaise?: number;
  lifetimeEarningsPaise?: number;
};

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<{ success: boolean; data: { gatewayOrderId: string; amountPaise: number; currency: string } }, { bookingId: string }>({
      query: (body) => ({
        url: '/payments/orders',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: { success: boolean; data: { gatewayOrderId: string; amount: number; currency: string } }) => ({
        ...response,
        data: {
          gatewayOrderId: response.data.gatewayOrderId,
          amountPaise: response.data.amount,
          currency: response.data.currency,
        },
      }),
    }),
    verifyPayment: builder.mutation<{ success: boolean; message: string; data: unknown }, { gatewayOrderId: string; gatewayPaymentId: string; gatewaySignature: string }>({
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
      transformResponse: (response: { success: boolean; data: RawWallet }) => ({
        ...response,
        data: {
          balancePaise: response.data.availableBalancePaise ?? 0,
          pendingBalancePaise: response.data.pendingBalancePaise ?? 0,
          withdrawnPaise: response.data.withdrawnBalancePaise ?? 0,
          lifetimeEarningsPaise: response.data.lifetimeEarningsPaise ?? 0,
          currency: 'INR',
        },
      }),
      providesTags: ['Profile'],
    }),
    requestWithdrawal: builder.mutation<{ success: boolean; message: string; data: unknown }, PayoutRequest>({
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
