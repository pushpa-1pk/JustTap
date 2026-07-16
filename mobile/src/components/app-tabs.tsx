import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => <Text>H</Text> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: () => <Text>E</Text> }} />
    </Tabs>
  );
}
