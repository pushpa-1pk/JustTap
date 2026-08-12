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

        const cachedRole = await secureStore.getRole();
        const userRole = normalizeUserRole(cachedRole);



        // Call /me to verify token validity and retrieve fresh profile flags
        // Using axios directly to avoid initial load interceptor conflicts
        const meUrl = getAbsoluteUrl('/auth/me');
        const response = await axios.get(meUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200 && response.data?.data) {
          const fetchedUser = response.data.data;
          dispatch(setCredentials({
            user: {
              id: fetchedUser.id || fetchedUser._id,
              phone: fetchedUser.phone,
              role: normalizeUserRole(fetchedUser.role),
              roles: normalizeUserRoles(fetchedUser.roles, fetchedUser.role),
              accountStatus: fetchedUser.accountStatus,
              isProfileComplete: normalizeProfileCompletion(fetchedUser),
            },
            accessToken: token
          }));
        } else {
          dispatch(logout());
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          // If the backend strictly rejected the token with 401/403, clear credentials
          if (error.response?.status === 401 || error.response?.status === 403) {
            dispatch(logout());
            return;
          }
          
          // For network/connection errors (offline state), do NOT log out the user.
          // Restore credentials using cached storage values so they stay on home/dashboard.
          console.warn('Network offline during session restoration:', error.message);
          const cachedToken = await secureStore.getAccessToken();
          const cachedRole = await secureStore.getRole();
          if (cachedToken && cachedRole) {
            const userRole = normalizeUserRole(cachedRole);
            dispatch(setCredentials({
              user: {
                id: 'cached-user',
                phone: 'cached-phone',
                role: userRole,
                roles: [userRole],
                accountStatus: 'ACTIVE',
                isProfileComplete: true,
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
