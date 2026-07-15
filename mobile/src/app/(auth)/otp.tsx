import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useVerifyOtpMutation, useSendOtpMutation } from '@/redux/api/authApi';
import { setCredentials } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import * as Haptics from 'expo-haptics';

// Validation Schema for 6-digit OTP
const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
});

type FormData = z.infer<typeof otpSchema>;

export default function OtpScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || '9999999999';

  // API Mutations
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendOtp({ phone }).unwrap();
      setTimer(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Resend OTP failed:', err);
    }
  };

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      // For general login, we default request as customer role, 
      // but the backend will return the correct user role if already registered.
      const response = await verifyOtp({
        phone,
        otp: data.otp,
        role: 'customer', 
        deviceId: 'mobile-app-client',
        deviceName: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
        platform: 'MOBILE',
      }).unwrap();

      if (response.success && response.data) {
        const { accessToken, refreshToken, user: authUser } = response.data;
        
        // 1. Store tokens securely
        await secureStore.saveTokens(accessToken, refreshToken);
        await secureStore.saveRole(authUser.role);

        // 2. Set credentials in Redux
        dispatch(
          setCredentials({
            user: {
              id: authUser.id,
              phone: authUser.phone,
              role: authUser.role,
              accountStatus: authUser.accountStatus,
              isProfileComplete: authUser.isProfileComplete || false,
            },
            accessToken,
          })
        );

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // 3. Role-based redirect or Profile completion redirect
        const isNewUser = (response as any).isNewUser || !authUser.isProfileComplete;
        if (isNewUser) {
          router.replace('/(auth)/register');
        } else {
          // Direct redirect based on user role
          if (authUser.role === 'CUSTOMER') {
            router.replace('/(customer)/home');
          } else if (authUser.role === 'PROVIDER') {
            router.replace('/(provider)/dashboard');
          } else if (authUser.role === 'ADMIN') {
            router.replace('/(admin)/dashboard');
          } else {
            router.replace('/(auth)/login');
          }
        }
      }
    } catch (err: any) {
      console.error('Verify OTP failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
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
