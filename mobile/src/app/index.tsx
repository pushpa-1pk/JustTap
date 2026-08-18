import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { secureStore } from '../utils/secureStore';
import { setCredentials, logout } from '../redux/slices/authSlice';
import axios from 'axios';
import { getAbsoluteUrl } from '../config/axios';
import { getDefaultRouteForRole, normalizeProfileCompletion, normalizeUserRole, normalizeUserRoles } from '../utils/auth';

import SplashLoader from '../components/common/SplashLoader';

export default function InitialRouteIndex() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Attempt auto-login session restoration
    const restoreSession = async () => {
      try {
        const token = await secureStore.getAccessToken();
        if (!token) {
          dispatch(logout());
          return;
        }

        // Call /me to verify token validity and retrieve fresh profile flags
        // Using axios directly to avoid initial load interceptor conflicts
        const meUrl = getAbsoluteUrl('/auth/me');
        const response = await axios.get(meUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200 && response.data?.data) {
          const fetchedUser = response.data.data;
          const restoredUser = {
            id: fetchedUser.id || fetchedUser._id,
            phone: fetchedUser.phone,
            role: normalizeUserRole(fetchedUser.role),
            roles: normalizeUserRoles(fetchedUser.roles, fetchedUser.role),
            accountStatus: fetchedUser.accountStatus,
            isProfileComplete: normalizeProfileCompletion(fetchedUser),
          };
          await secureStore.saveUser(restoredUser);
          dispatch(setCredentials({
            user: restoredUser,
            accessToken: token
          }));
        } else {
          dispatch(logout());
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          // If the backend strictly rejected the token with 401/403, clear credentials
          if (error.response?.status === 401) {
            try {
              const refreshToken = await secureStore.getRefreshToken();
              if (!refreshToken) throw new Error('No refresh token available');

              const refreshResponse = await axios.post(getAbsoluteUrl('/auth/refresh-token'), {
                refreshToken,
                deviceId: await secureStore.getDeviceId(),
              });
              const freshToken = refreshResponse.data?.data?.accessToken;
              const nextRefreshToken = refreshResponse.data?.data?.refreshToken;
              if (!freshToken || !nextRefreshToken) throw new Error('Invalid refresh response');

              await secureStore.saveTokens(freshToken, nextRefreshToken);
              const meResponse = await axios.get(getAbsoluteUrl('/auth/me'), {
                headers: { Authorization: `Bearer ${freshToken}` },
              });
              const fetchedUser = meResponse.data?.data;
              if (!fetchedUser) throw new Error('User profile missing after token refresh');

              const refreshedUser = {
                id: fetchedUser.id || fetchedUser._id,
                phone: fetchedUser.phone,
                role: normalizeUserRole(fetchedUser.role),
                roles: normalizeUserRoles(fetchedUser.roles, fetchedUser.role),
                accountStatus: fetchedUser.accountStatus,
                isProfileComplete: normalizeProfileCompletion(fetchedUser),
              };
              await secureStore.saveUser(refreshedUser);
              dispatch(setCredentials({ user: refreshedUser, accessToken: freshToken }));
              return;
            } catch (refreshError) {
              console.warn('Session refresh during startup failed:', refreshError);
              await secureStore.clearAll();
              dispatch(logout());
              return;
            }
          }

          if (error.response?.status === 403) {
            await secureStore.clearAll();
            dispatch(logout());
            return;
          }
          
          // For network/connection errors (offline state), do NOT log out the user.
          // Restore only the previously authenticated user; never invent profile data.
          console.warn('Network offline during session restoration:', error.message);
          const cachedToken = await secureStore.getAccessToken();
          const cachedUser = await secureStore.getUser<{
            id: string;
            phone: string;
            role: string;
            roles?: string[];
            accountStatus: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DELETED';
            isProfileComplete?: boolean;
          }>();
          if (cachedToken && cachedUser?.id && cachedUser.phone) {
            dispatch(setCredentials({
              user: {
                id: cachedUser.id,
                phone: cachedUser.phone,
                role: normalizeUserRole(cachedUser.role),
                roles: normalizeUserRoles(cachedUser.roles, cachedUser.role),
                accountStatus: cachedUser.accountStatus,
                isProfileComplete: normalizeProfileCompletion(cachedUser),
              },
              accessToken: cachedToken
            }));
            return;
          }
        }
        
        console.warn('Session restoration failed:', error);
        dispatch(logout());
      }
    };

    restoreSession();
  }, [dispatch]);

  useEffect(() => {
    // Wait for auth check to finish
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (!user.isProfileComplete) {
        router.replace(user.role === 'PROVIDER' ? '/(provider)/(tabs)/profile' : '/(customer)/(tabs)/profile');
        return;
      }

      router.replace(getDefaultRouteForRole(user.role));
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return <SplashLoader />;
}
