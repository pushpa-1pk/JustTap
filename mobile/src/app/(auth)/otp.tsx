import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useVerifyOtpMutation, useSendOtpMutation } from '@/redux/api/authApi';
import { setCredentials } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import { AppUserRole, getAuthPlatform, getDefaultRouteForRole } from '@/utils/auth';
import * as Haptics from 'expo-haptics';

// Validation Schema for 6-digit OTP
const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
});

type FormData = z.infer<typeof otpSchema>;

type PendingSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    role: AppUserRole;
    roles: AppUserRole[];
    accountStatus: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DELETED';
    isProfileComplete: boolean;
  };
};

export default function OtpScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || '';

  const [sendOtp, { isLoading: isResending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const [pendingOtp, setPendingOtp] = useState('');
  const [isCompletingRole, setIsCompletingRole] = useState(false);
  
  // Timer for OTP resend (60 seconds)
  const [timer, setTimer] = useState(60);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendOtp({ phone }).unwrap();
      setTimer(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Verification code has been resent to your mobile number.');
    } catch (err: any) {
      console.error('Resend OTP failed:', err);
      Alert.alert('Error', err?.data?.message || err?.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const openRolePicker = () => {
    setShowRolePicker(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRoleSelect = async (role: AppUserRole) => {
    setIsCompletingRole(true);

    if (!pendingSession) {
      try {
        const response = await verifyOtp({
          phone,
          otp: pendingOtp,
          role: role.toLowerCase() as 'customer' | 'provider' | 'admin',
          deviceId: 'mobile-app-client',
          deviceName: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
          platform: getAuthPlatform(),
          appVersion: '1.0.0',
        }).unwrap();

        if (response.success && response.data) {
          const { accessToken, refreshToken, user: authUser } = response.data;
          const session = {
            accessToken,
            refreshToken,
            user: {
              id: authUser.id,
              phone: authUser.phone,
              role: authUser.role,
              roles: Array.from(new Set([...(authUser.roles || []), role])),
              accountStatus: authUser.accountStatus,
              isProfileComplete: authUser.isProfileComplete || false,
            },
          };
          setPendingSession(session);
          await finishRoleLogin(role, session);
          setIsCompletingRole(false);
          return;
        }
      } catch (error: any) {
        console.warn('Verify OTP error:', error);
        if (error && (typeof error.status === 'number' || error.status === 400 || error.status === 401)) {
          Alert.alert(
            'Verification Failed',
            error.data?.message || 'The verification code you entered is incorrect. Please check and try again.'
          );
          setIsCompletingRole(false);
          setShowRolePicker(false);
          return;
        }
        setIsCompletingRole(false);
        return;
      }
    }

    if (pendingSession) {
      await finishRoleLogin(role, pendingSession);
    }
    setIsCompletingRole(false);
  };

  const finishRoleLogin = async (role: AppUserRole, session: PendingSession) => {
    if (!session) return;

    const roles = Array.from(new Set([...session.user.roles, role]));
    const selectedUser = {
      ...session.user,
      role,
      roles,
    };

    await secureStore.saveTokens(session.accessToken, session.refreshToken);
    await secureStore.saveRole(role);

    dispatch(
      setCredentials({
        user: selectedUser,
        accessToken: session.accessToken,
      })
    );

    setShowRolePicker(false);

    if (!selectedUser.isProfileComplete) {
      router.replace(role === 'PROVIDER' ? '/(provider)/(tabs)/profile' : '/(customer)/(tabs)/profile');
      return;
    }

    router.replace(getDefaultRouteForRole(role));
  };

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPendingOtp(data.otp);
    openRolePicker();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.text }]}>Verification Code</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Sent to +91 {phone}
          </Text>
        </View>

        {/* OTP Input Field */}
        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.otpInput,
                  typography.h2,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: errors.otp ? colors.danger : colors.border,
                    color: colors.text,
                    letterSpacing: spacing.md
                  }
                ]}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                editable={!isVerifying}
                autoFocus
              />
            )}
          />

          {errors.otp && (
            <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm, textAlign: 'center' }]}>
              {errors.otp.message}
            </Text>
          )}

          {/* Resend Countdown Text */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                Resend code in <Text style={{ color: colors.text, fontWeight: '600' }}>{timer}s</Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={isResending}>
                <Text style={[typography.bodyMedium, { color: colors.secondary, fontWeight: '600' }]}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[
              styles.verifyButton,
              { 
                backgroundColor: colors.primary, 
                opacity: isVerifying ? 0.7 : 1,
                marginTop: spacing.xxl
              }
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={[typography.buttonText, { color: colors.onPrimary }]}>
                Verify & Continue
              </Text>
            )}
          </Pressable>
        </View>

        {showRolePicker && (
          <View style={styles.roleOverlay}>
            <View style={[styles.roleSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>Choose Role</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Select how you want to use JustTap right now.
              </Text>

              <Pressable
                style={[styles.roleCard, { backgroundColor: colors.primary + '25', borderColor: colors.primary }]}
                onPress={() => handleRoleSelect('CUSTOMER')}
                disabled={isCompletingRole}
              >
                <Text style={[typography.h3, { color: colors.text }]}>Customer</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
                  Book services, search providers, track bookings, and manage your profile.
                </Text>
              </Pressable>

              <Pressable
                style={[styles.roleCard, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}
                onPress={() => handleRoleSelect('PROVIDER')}
                disabled={isCompletingRole}
              >
                <Text style={[typography.h3, { color: colors.text }]}>Provider</Text>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
                  Manage jobs, messages, earnings, services, and provider profile.
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
  },
  otpInput: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  verifyButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  roleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  roleSheet: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
  },
});
