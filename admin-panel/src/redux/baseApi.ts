import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axiosClient from '../api/axiosClient';
import { AxiosRequestConfig, AxiosError } from 'axios';

// Custom base query adapter that routes all RTK Queries through our secure Axios client
const axiosBaseQuery = (): BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: AxiosRequestConfig['data'];
    params?: AxiosRequestConfig['params'];
    headers?: AxiosRequestConfig['headers'];
    baseUrlOverride?: string; // Allows selecting which microservice base URL to run against
  },
  unknown,
  unknown
> =>
  async ({ url, method = 'GET', data, params, headers, baseUrlOverride = '' }) => {
    try {
      const result = await axiosClient({
        url: baseUrlOverride + url,
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
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'User',
    'Provider',
    'Booking',
    'Category',
    'Service',
    'CustomSkill',
    'Payment',
    'Wallet',
    'Review',
    'SupportTicket',
    'AuditLog',
    'SystemHealth',
  ],
  endpoints: () => ({}),
});
