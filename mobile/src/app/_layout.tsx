import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from '../redux/store';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import OfflineBanner from '../components/common/OfflineBanner';
import { getDefaultRouteForRole } from '../utils/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../config/reactQuery';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inCustomerGroup = segments[0] === '(customer)';
    const inProviderGroup = segments[0] === '(provider)';
    const inAdminGroup = segments[0] === '(admin)';
    const inRolePicker = inAuthGroup && segments[1] === 'register';
    const inCustomerProfile = inCustomerGroup && (
      segments[2] === 'profile' || 
      segments[1] === 'edit-profile' || 
      segments[1] === 'addresses'
    );
    const inProviderProfile = inProviderGroup && (
      segments[2] === 'profile' || 
      segments[1] === 'edit-profile' || 
      segments[1] === 'business-info' || 
      segments[1] === 'kyc-upload' || 
      segments[1] === 'bank-setup' ||
      segments[1] === 'service-areas' ||
      segments[1] === 'working-hours'
    );

    // Segment routing lifecycle checks
    if (!isAuthenticated) {
      // Redirect to login if trying to access any protected area
      if (!inAuthGroup && segments.length > 0) {
        router.replace('/(auth)/login');
      }
    } else if (user) {
      const defaultRoute = user.isProfileComplete
        ? getDefaultRouteForRole(user.role)
        : user.role === 'PROVIDER'
          ? '/(provider)/(tabs)/profile'
          : '/(customer)/(tabs)/profile';

      // Redirect authenticated users away from login/onboarding screens
      if (inAuthGroup) {
        if (inRolePicker) {
          return;
        }

        router.replace(defaultRoute);
        return;
      }

      if (!user.isProfileComplete) {
        if (user.role === 'PROVIDER' && !inProviderProfile) {
          router.replace('/(provider)/(tabs)/profile');
          return;
        }

        if (user.role === 'CUSTOMER' && !inCustomerProfile) {
          router.replace('/(customer)/(tabs)/profile');
          return;
        }
      }

      // Enforce role-based access boundaries
      if (user.role === 'CUSTOMER' && (inProviderGroup || inAdminGroup)) {
        router.replace('/(customer)/(tabs)/home');
      } else if (user.role === 'PROVIDER' && (inCustomerGroup || inAdminGroup)) {
        router.replace('/(provider)/(tabs)/dashboard');
      } else if (user.role === 'ADMIN' && (inCustomerGroup || inProviderGroup)) {
        router.replace('/(admin)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OfflineBanner />
        <NavigationGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
            <Stack.Screen name="(provider)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          </Stack>
        </NavigationGuard>
      </QueryClientProvider>
    </Provider>
  );
}
