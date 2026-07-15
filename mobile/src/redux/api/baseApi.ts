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
> => async ({ url, method = 'GET', data, params, headers }) => {
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
  tagTypes: ['User', 'Profile', 'Addresses', 'Categories', 'Services', 'ProviderServices', 'Bookings', 'Matching'],
  endpoints: () => ({}),
});
