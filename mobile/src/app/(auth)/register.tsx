import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { RootState } from '@/redux/store';
import { updateUser } from '@/redux/slices/authSlice';
import { AppUserRole, getDefaultRouteForRole } from '@/utils/auth';
import { secureStore } from '@/utils/secureStore';
import * as Haptics from 'expo-haptics';

export default function RegisterScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedRole, setSelectedRole] = useState<AppUserRole>('CUSTOMER');

  const handleContinue = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const roles = Array.from(new Set([...(user?.roles || []), selectedRole]));

    await secureStore.saveRole(selectedRole);
    dispatch(updateUser({ role: selectedRole, roles }));

    if (user?.isProfileComplete) {
      router.replace(getDefaultRouteForRole(selectedRole));
      return;
    }

    if (selectedRole === 'PROVIDER') {
      router.replace('/(provider)/(tabs)/profile');
      return;
    }

    router.replace('/(customer)/(tabs)/profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h1, { color: colors.text, textAlign: 'center' }]}>Choose Role</Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
          Select how you want to use JustTap. Your app experience will change based on this role.
        </Text>

        <View style={styles.roleGrid}>
          <Pressable
            style={[
              styles.roleCard,
              {
                backgroundColor: selectedRole === 'CUSTOMER' ? colors.primary + '25' : colors.surfaceVariant,
                borderColor: selectedRole === 'CUSTOMER' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedRole('CUSTOMER');
            }}
          >
            <Text style={[typography.h3, { color: colors.text }]}>Customer</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Search services, book providers, track jobs, and manage payments.
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.roleCard,
              {
                backgroundColor: selectedRole === 'PROVIDER' ? colors.secondary + '20' : colors.surfaceVariant,
                borderColor: selectedRole === 'PROVIDER' ? colors.secondary : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedRole('PROVIDER');
            }}
          >
            <Text style={[typography.h3, { color: colors.text }]}>Provider</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              Receive requests, accept jobs, manage services, and track earnings.
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.continueBtn,
            { backgroundColor: selectedRole === 'PROVIDER' ? colors.secondary : colors.primary },
          ]}
          onPress={handleContinue}
        >
          <Text style={[typography.buttonText, { color: selectedRole === 'PROVIDER' ? colors.onSecondary : colors.onPrimary }]}>
            Continue to Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  sheet: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
  },
  roleGrid: {
    gap: 14,
    marginTop: 28,
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
});
