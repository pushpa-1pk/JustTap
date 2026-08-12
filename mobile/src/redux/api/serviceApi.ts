import { baseApi } from './baseApi';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface ServiceItem {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  estimatedDuration: number;
  isPopular: boolean;
  isActive: boolean;
}

export interface ProviderOffer {
  _id: string;
  providerId: string;
  serviceId: string;
  price: number;
  experience: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderSearchDetails {
  providerId: string;
  businessName: string;
  phone: string;
  experience: number;
  price: number;
  distance: number;
  rating: number;
  providerServiceId: string;
}

type ListPayload<T> =
  | T[]
  | {
      items?: T[];
      docs?: T[];
      total?: number;
      page?: number;
      pages?: number;
      limit?: number;
    };

const normalizeListPayload = <T>(payload: ListPayload<T> | undefined): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.items && Array.isArray(payload.items)) {
    return payload.items;
  }

  if (payload?.docs && Array.isArray(payload.docs)) {
    return payload.docs;
  }

  return [];
};

export const serviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Categories Public Catalog
    getCategories: builder.query<{ success: boolean; data: Category[] }, void>({
      query: () => ({ url: '/categories', method: 'GET' }),
      transformResponse: (response: { success: boolean; data: ListPayload<Category> }) => ({
        ...response,
        data: normalizeListPayload(response.data),
      }),
      providesTags: ['Categories'],
    }),

    // Services Public Catalog
    getServices: builder.query<{ success: boolean; data: ServiceItem[] }, { categoryId?: string; keyword?: string; isPopular?: boolean } | void>({
      query: (params) => ({
        url: '/services',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: { success: boolean; data: ListPayload<ServiceItem> }) => ({
        ...response,
        data: normalizeListPayload(response.data),
      }),
      providesTags: ['Services'],
    }),
    getServiceById: builder.query<{ success: boolean; data: ServiceItem }, string>({
      query: (serviceId) => ({ url: `/services/${serviceId}`, method: 'GET' }),
    }),

    // Public catalog query to search providers offering a specific service
    getProvidersForService: builder.query<{
      success: boolean;
      data: {
        providers: ProviderSearchDetails[];
        pagination: { total: number; page: number; pages: number; limit: number };
      };
    }, {
      serviceId: string;
      latitude: number;
      longitude: number;
      minPrice?: number;
      maxPrice?: number;
      minExperience?: number;
      minRating?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }>({
      query: ({ serviceId, ...params }) => ({
        url: `/services/${serviceId}/providers`,
        method: 'GET',
        params,
      }),
    }),

    // Provider Service Offers
    getProviderServices: builder.query<{ success: boolean; data: ProviderOffer[] }, void>({
      query: () => ({ url: '/provider/services', method: 'GET' }),
      providesTags: ['ProviderServices'],
    }),
    createProviderService: builder.mutation<{ success: boolean; data: ProviderOffer }, { serviceId: string; price: number; experience: number; isAvailable: boolean }>({
      query: (body) => ({
        url: '/provider/services',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['ProviderServices'],
    }),
    updateProviderService: builder.mutation<{ success: boolean; data: ProviderOffer }, { providerServiceId: string; price: number; experience: number }>({
      query: ({ providerServiceId, ...body }) => ({
        url: `/provider/services/${providerServiceId}`,
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['ProviderServices'],
    }),
    updateProviderServiceStatus: builder.mutation<{ success: boolean; data: ProviderOffer }, { providerServiceId: string; isAvailable: boolean }>({
      query: ({ providerServiceId, isAvailable }) => ({
        url: `/provider/services/${providerServiceId}/status`,
        method: 'PATCH',
        data: { isAvailable },
      }),
      invalidatesTags: ['ProviderServices'],
    }),
    deleteProviderService: builder.mutation<{ success: boolean; message: string }, string>({
      query: (providerServiceId) => ({
        url: `/provider/services/${providerServiceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProviderServices'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useGetProvidersForServiceQuery,
  useGetProviderServicesQuery,
  useCreateProviderServiceMutation,
  useUpdateProviderServiceMutation,
  useUpdateProviderServiceStatusMutation,
  useDeleteProviderServiceMutation,
} = serviceApi;
