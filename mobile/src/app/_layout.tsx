import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from '../redux/store';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import OfflineBanner from '../components/common/OfflineBanner';

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

    // Segment routing lifecycle checks
    if (!isAuthenticated) {
      // Redirect to login if trying to access any protected area
      if (!inAuthGroup && segments.length > 0) {
        router.replace('/(auth)/login');
      }
    } else if (user) {
      // Redirect authenticated users away from login/onboarding screens
      if (inAuthGroup) {
        if (user.role === 'CUSTOMER') {
          router.replace('/(customer)/(tabs)/home');
        } else if (user.role === 'PROVIDER') {
          router.replace('/(provider)/(tabs)/dashboard');
        } else if (user.role === 'ADMIN') {
          router.replace('/(admin)/dashboard');
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
    </Provider>
  );
}
