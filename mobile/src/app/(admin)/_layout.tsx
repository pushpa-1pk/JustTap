import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Admin Console' }} />
      <Stack.Screen name="approvals" options={{ title: 'Pending Provider Approvals' }} />
      <Stack.Screen name="catalog" options={{ title: 'Category & Service Catalog' }} />
    </Stack>
  );
}
