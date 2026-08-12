import { baseApi } from '../baseApi';
import { API_BASE_URLS } from '../../api/apiConfig';

export interface BookingAnalytics {
  requestedCount?: number;
  acceptedCount?: number;
  arrivedCount?: number;
  startedCount?: number;
  completedCount?: number;
  cancelledCount?: number;
  total?: number;
}

export interface HealthStatus {
  service: string;
  status: 'UP' | 'DOWN';
  latency?: number;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookingAnalytics: builder.query<BookingAnalytics, void>({
      query: () => ({
        url: '/admin/bookings/analytics',
        baseUrlOverride: API_BASE_URLS.bookings,
      }),
      providesTags: ['Booking'],
    }),
    
    getPendingApprovals: builder.query<any[], void>({
      query: () => ({
        url: '/admin/pending-approvals',
        baseUrlOverride: API_BASE_URLS.profiles,
      }),
      providesTags: ['Provider'],
      transformResponse: (response: any) => response.data || [],
    }),
    
    // Checks health of microservices
    getServicesHealth: builder.query<HealthStatus[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        const servicesToCheck = [
          { name: 'Auth Service', base: API_BASE_URLS.auth, path: '/health/live' },
          { name: 'Profile Service', base: API_BASE_URLS.profiles, path: '/health' },
          { name: 'Service Management', base: API_BASE_URLS.services, path: '/health/live' },
          { name: 'Booking Service', base: API_BASE_URLS.bookings, path: '/health' },
        ];

        const healthResults: HealthStatus[] = [];

        for (const s of servicesToCheck) {
          const startTime = Date.now();
          try {
            const result = await baseQuery({
              url: s.path,
              method: 'GET',
              baseUrlOverride: s.base,
            });
            
            const elapsed = Date.now() - startTime;
            if (result.error) {
              healthResults.push({ service: s.name, status: 'DOWN', latency: elapsed });
            } else {
              healthResults.push({ service: s.name, status: 'UP', latency: elapsed });
            }
          } catch {
            healthResults.push({ service: s.name, status: 'DOWN' });
          }
        }

        return { data: healthResults };
      },
      providesTags: ['SystemHealth'],
    }),
  }),
});

export const {
  useGetBookingAnalyticsQuery,
  useGetPendingApprovalsQuery,
  useGetServicesHealthQuery,
} = dashboardApi;
