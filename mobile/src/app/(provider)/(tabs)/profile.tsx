import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function ProviderProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await secureStore.clearAll();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.h2, { color: colors.text }]}>Business Profile</Text>
      
      <Pressable 
        style={[styles.logoutButton, { backgroundColor: colors.danger, marginTop: spacing.xl }]}
        onPress={handleLogout}
      >
        <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
