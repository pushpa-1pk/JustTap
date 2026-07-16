import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { secureStore } from '../utils/secureStore';
import { setCredentials, logout } from '../redux/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import axios from 'axios';
import { getAbsoluteUrl } from '../config/axios';
import { normalizeProfileCompletion, normalizeUserRole } from '../utils/auth';

import SplashLoader from '../components/common/SplashLoader';

export default function InitialRouteIndex() {
  const router = useRouter();
  const { colors } = useTheme();
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
          dispatch(setCredentials({
            user: {
              id: fetchedUser.id || fetchedUser._id,
              phone: fetchedUser.phone,
              role: normalizeUserRole(fetchedUser.role),
              accountStatus: fetchedUser.accountStatus,
              isProfileComplete: normalizeProfileCompletion(fetchedUser),
            },
            accessToken: token
          }));
        } else {
          dispatch(logout());
        }
      } catch (error) {
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
      // Role-based redirection guards
      if (user.role === 'CUSTOMER') {
        router.replace('/(customer)/(tabs)/home');
      } else if (user.role === 'PROVIDER') {
        router.replace('/(provider)/(tabs)/dashboard');
      } else if (user.role === 'ADMIN') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return <SplashLoader />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
