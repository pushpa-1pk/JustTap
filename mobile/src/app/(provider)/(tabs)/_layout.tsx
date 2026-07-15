import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { View } from 'react-native';

export default function ProviderTabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.secondary, // Provider theme active is green
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />,
        }}
      />
    </Tabs>
  );
}
