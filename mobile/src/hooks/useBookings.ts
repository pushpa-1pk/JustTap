import { useQuery } from '@tanstack/react-query';
import apiClient from '../config/axios';
import { store } from '../redux/store';

export interface Booking {
  _id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string | null;
  serviceId: string;
  providerServiceId: string;
  bookingType: string;
  bookingStatus: string;
  paymentStatus: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  requestedAt: string;
  customerSnapshot: {
    fullName: string;
    phone: string;
  };
  providerSnapshot?: {
    businessName: string;
    phone: string;
  };
  snapshotPricing: {
    serviceBasePrice: number;
    travelCharge: number;
    platformCommissionFee: number;
    taxAmount: number;
    discountAmount: number;
    couponDiscount: number;
    totalAmountToPay: number;
    currency: string;
  };
}

export function useGetCustomerBookings(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['bookings', { page, limit }],
    queryFn: async () => {
      const response = await apiClient.get('/bookings/customer/history', {
        params: { page, limit },
      });
      return response.data.data as {
        items: Booking[];
        total: number;
        page: number;
        pages: number;
        limit: number;
      };
    },
  });
}
