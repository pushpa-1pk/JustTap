import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import apiClient from '../../config/axios';
import { AxiosRequestConfig, AxiosError } from 'axios';

// Custom base query using our pre-configured Axios client
const axiosBaseQuery = (): BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: AxiosRequestConfig['data'];
    params?: AxiosRequestConfig['params'];
    headers?: AxiosRequestConfig['headers'];
  },
  unknown,
  unknown
> => async ({ url, method = 'GET', data, params, headers }, api) => {
  // If we are operating in demo mode, intercept real endpoints to prevent unauthorized 401 logouts
  const state = api.getState() as any;
  const isDemo = Boolean(state?.auth?.user?.id?.startsWith('demo-') || state?.auth?.accessToken?.startsWith('demo-'));

  if (isDemo) {
    console.warn(`[RTK Query Demo Interceptor] Bypassing backend request for: ${url}`);
    
    // Return structured empty/success mock data for each endpoint category
    if (url.startsWith('/bookings')) {
      return { data: { success: true, data: [] } };
    }
    if (url.startsWith('/profiles') || url.startsWith('/addresses')) {
      return { data: { success: true, data: { profile: null, addresses: [] } } };
    }
    if (url.startsWith('/categories') || url.startsWith('/services')) {
      return { data: { success: true, data: [] } };
    }
    if (url.startsWith('/search/providers-matching')) {
      return { data: { success: true, data: { providers: [] } } };
    }
    return { data: { success: true, data: {} } };
  }

  try {
    const result = await apiClient({
      url,
      method,
      data,
      params,
      headers,
    });
    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError;
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || { message: err.message },
      },
    };
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User', 'Profile', 'Addresses', 'BankDetails', 'Categories', 'Services', 'ProviderServices', 'Bookings', 'Matching'],
  endpoints: () => ({}),
});
