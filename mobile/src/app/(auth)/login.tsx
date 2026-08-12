import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useSendOtpMutation } from '@/redux/api/authApi';
import * as Haptics from 'expo-haptics';

// Zod Validation Schema for Indian Phone Numbers (10 Digits)
const loginSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number must be exactly 10 digits')
    .max(10, 'Phone number must be exactly 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
});

type FormData = z.infer<typeof loginSchema>;

type FlowStep = 'language' | 'onboarding' | 'login';

export default function LoginScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const onboardingSlides = [
    {
      title: selectedLanguage === 'en' ? 'Instantly Find Nearby Service Providers' : 'तुरंत पास के सेवा प्रदाताओं को खोजें',
      desc: selectedLanguage === 'en' 
        ? 'Connect with trusted local electricians, plumbers, carpenters, cleaners, and more in seconds.'
        : 'कुछ ही सेकंड में विश्वसनीय स्थानीय इलेक्ट्रीशियन, प्लंबर, बढ़ई, क्लीनर और अन्य लोगों से जुड़ें।',
    },
    {
      title: selectedLanguage === 'en' ? 'Transparent Upfront Pricing & Reviews' : 'पारदर्शी कीमतें और समीक्षाएं',
      desc: selectedLanguage === 'en'
        ? 'Compare provider rates, ratings, and experience to pick the perfect expert for your home.'
        : 'अपने घर के लिए सही विशेषज्ञ चुनने के लिए प्रदाताओं की दरों, रेटिंग और अनुभव की तुलना करें।',
    },
    {
      title: selectedLanguage === 'en' ? 'Secure OTP Handshake Verification' : 'सुरक्षित ओटीपी हैंडशेक सत्यापन',
      desc: selectedLanguage === 'en'
        ? 'Services start and complete with verified secure PIN codes to ensure your complete satisfaction.'
        : 'आपकी पूर्ण संतुष्टि सुनिश्चित करने के लिए सेवाएं सत्यापित ओटीपी पिन कोड के साथ शुरू और समाप्त होती हैं।',
    },
  ];

  const handleLanguageSelect = (lang: 'en' | 'hi') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLanguage(lang);
  };

  const handleLanguageContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('onboarding');
  };

  const handleOnboardingNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onboardingIndex < onboardingSlides.length - 1) {
      setOnboardingIndex(prev => prev + 1);
    } else {
      setStep('login');
    }
  };

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await sendOtp({ phone: data.phone }).unwrap();
      if (response.success) {
        router.push({
          pathname: '/(auth)/otp',
          params: { phone: data.phone },
        });
      }
    } catch (err: any) {
      console.warn('Send OTP error:', err);
      const { Alert } = require('react-native');
      Alert.alert(
        'Login Failed',
        err.data?.message || 'Failed to send OTP. Please check your internet connection or mobile number and try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
          
          {/* STEP 1: LANGUAGE SELECTION */}
          {step === 'language' && (
            <View style={styles.stepContainer}>
              <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>
                Choose Language / भाषा चुनें
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxl }]}>
                Select your preferred language to continue
              </Text>

              {/* Language Option En */}
              <Pressable
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selectedLanguage === 'en' ? colors.primary : colors.border,
                    borderWidth: selectedLanguage === 'en' ? 2 : 1,
                  },
                ]}
                onPress={() => handleLanguageSelect('en')}
              >
                <View style={styles.radioRow}>
                  <Text style={[typography.h3, { color: colors.text }]}>English</Text>
                  <View style={[styles.radioCircle, { borderColor: selectedLanguage === 'en' ? colors.primary : colors.textSecondary }]}>
                    {selectedLanguage === 'en' && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                </View>
              </Pressable>

              {/* Language Option Hi */}
              <Pressable
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selectedLanguage === 'hi' ? colors.primary : colors.border,
                    borderWidth: selectedLanguage === 'hi' ? 2 : 1,
                    marginTop: spacing.md,
                  },
                ]}
                onPress={() => handleLanguageSelect('hi')}
              >
                <View style={styles.radioRow}>
                  <Text style={[typography.h3, { color: colors.text }]}>हिन्दी (Hindi)</Text>
                  <View style={[styles.radioCircle, { borderColor: selectedLanguage === 'hi' ? colors.primary : colors.textSecondary }]}>
                    {selectedLanguage === 'hi' && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                </View>
              </Pressable>

              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: spacing.xxl }]}
                onPress={handleLanguageContinue}
              >
                <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Continue</Text>
              </Pressable>
            </View>
          )}

          {/* STEP 2: ONBOARDING CAROUSEL */}
          {step === 'onboarding' && (
            <View style={styles.stepContainer}>
              <View style={styles.carouselContainer}>
                {/* Brand Logo Header */}
                <Text style={[typography.h1, { color: colors.text, textAlign: 'center', marginBottom: spacing.xxl }]}>
                  Just<Text style={{ color: colors.secondary }}>Tap</Text>
                </Text>

                {/* Animated Slide Content */}
                <View key={onboardingIndex} style={styles.slideContent}>
                  <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginBottom: spacing.md }]}>
                    {onboardingSlides[onboardingIndex].title}
                  </Text>
                  <Text style={[typography.bodyLarge, { color: colors.textSecondary, textAlign: 'center', lineHeight: 24 }]}>
                    {onboardingSlides[onboardingIndex].desc}
                  </Text>
                </View>
              </View>

              {/* Slide Indicators */}
              <View style={styles.indicatorRow}>
                {onboardingSlides.map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.indicatorDot, 
                      { 
                        backgroundColor: i === onboardingIndex ? colors.primary : colors.border,
                        width: i === onboardingIndex ? 20 : 8 
                      }
                    ]} 
                  />
                ))}
              </View>

              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: spacing.xxl }]}
                onPress={handleOnboardingNext}
              >
                <Text style={[typography.buttonText, { color: colors.onPrimary }]}>
                  {onboardingIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* STEP 3: PHONE LOGIN FORM */}
          {step === 'login' && (
            <View style={styles.stepContainer}>
              <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.sm }]}>
                Welcome to JustTap
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
                Enter your mobile number to log in or create an account
              </Text>

              {/* Phone Input Box */}
              <View style={styles.inputLabelRow}>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: '600' }]}>
                  MOBILE NUMBER
                </Text>
              </View>
              
              <View style={[
                styles.phoneInputContainer, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: errors.phone ? colors.danger : colors.border 
                }
              ]}>
                <Text style={[typography.bodyLarge, { color: colors.text, marginRight: spacing.xs, fontWeight: '600' }]}>
                  +91
                </Text>
                <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.textInput, typography.bodyLarge, { color: colors.text }]}
                      placeholder="99999 99999"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      maxLength={10}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isSendingOtp}
                      autoFocus
                    />
                  )}
                />
              </View>

              {errors.phone && (
                <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.xs }]}>
                  {errors.phone.message}
                </Text>
              )}

              <Pressable
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: colors.primary, 
                    marginTop: spacing.xl,
                    opacity: isSendingOtp ? 0.7 : 1
                  }
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.buttonText, { color: colors.onPrimary }]}>
                    Send Verification Code
                  </Text>
                )}
              </Pressable>

              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }]}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    width: '100%',
  },
  optionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  carouselContainer: {
    minHeight: 280,
    justifyContent: 'center',
  },
  slideContent: {
    paddingHorizontal: 12,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
  },
  inputLabelRow: {
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    padding: 0, // Reset default padding
  },
});
