import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || '';

  const [sendOtp, { isLoading: isResending }] = useSendOtpMutation();

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
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid phone number', 'Return to login and enter a valid 10-digit mobile number.');
      router.replace('/(auth)/login');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendOtp({ phone }).unwrap();
      setTimer(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Verification code has been resent to your mobile number.');
    } catch (err: any) {
      console.error('Resend OTP failed:', err);
      Alert.alert('Could not resend code', err?.data?.message || (err?.status ? 'Please wait and try again.' : 'No internet connection or server is unavailable. Please reconnect and retry.'));
    }
  };

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/(auth)/register',
      params: { phone, otp: data.otp },
    });
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
                editable={true}
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
                marginTop: spacing.xxl
              }
            ]}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={[typography.buttonText, { color: colors.onPrimary }]}>
              Verify & Continue
            </Text>
          </Pressable>
        </View>


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
});
