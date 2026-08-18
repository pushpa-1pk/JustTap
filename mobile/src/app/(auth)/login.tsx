import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<FlowStep>('onboarding');
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
      Alert.alert(
        'Could not send code',
        err.data?.message || (err?.status ? 'Please check your mobile number and try again.' : 'No internet connection or server is unavailable. Please reconnect and retry.')
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
        <View style={[
          styles.container, 
          { 
            backgroundColor: colors.background, 
            padding: step === 'onboarding' ? 0 : spacing.xl 
          }
        ]}>
          


          {/* STEP 2: ONBOARDING CAROUSEL */}
          {step === 'onboarding' && (
            <LinearGradient
              colors={['#FEF08A', '#FEF9C3', '#FFFFFF']}
              style={[styles.onboardingGradient, { paddingTop: insets.top + 8, paddingBottom: 0 }]}
            >
              {/* Provider Image */}
              <View style={styles.imageContainer}>
                {onboardingIndex === 0 && (
                  <Image
                    source={require('../../../assets/images/onboarding_1@.png')}
                    style={styles.providerImage}
                    resizeMode="contain"
                  />
                )}
                {onboardingIndex === 1 && (
                  <Image
                    source={require('../../../assets/images/onboarding_2@.png')}
                    style={styles.providerImage}
                    resizeMode="contain"
                  />
                )}
                {onboardingIndex === 2 && (
                  <Image
                    source={require('../../../assets/images/onboarding_3@.png')}
                    style={styles.providerImage}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* Content Card (white background at the bottom) */}
              <View style={[styles.onboardingContentCard, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
                {/* Slide Indicators */}
                <View style={styles.indicatorRowOnboarding}>
                  {onboardingSlides.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.indicatorDotOnboarding,
                        {
                          backgroundColor: i === onboardingIndex ? '#FBC02D' : '#e2e8f0',
                          width: i === onboardingIndex ? 16 : 8,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Animated Slide Content */}
                <View key={onboardingIndex} style={styles.slideContentOnboarding}>
                  <Text style={[typography.h2, styles.slideTitle, { color: colors.text }]}>
                    {onboardingSlides[onboardingIndex].title}
                  </Text>
                  <Text style={[typography.bodyMedium, styles.slideDesc, { color: colors.textSecondary }]}>
                    {onboardingSlides[onboardingIndex].desc}
                  </Text>
                </View>

                {/* Let's Get Started / Next Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.sliderButton,
                    {
                      backgroundColor: '#FBC02D',
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                  onPress={handleOnboardingNext}
                >
                  <Text style={styles.sliderButtonText}>
                    {onboardingIndex === onboardingSlides.length - 1 ? "Let's Get Started" : "Next"}
                  </Text>
                  <View style={styles.sliderButtonCircle}>
                    <Ionicons name="chevron-forward" size={20} color="#FBC02D" />
                  </View>
                </Pressable>
              </View>
            </LinearGradient>
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
  onboardingGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    minHeight: 680,
  },
  onboardingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoJ: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBC02D',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
  },
  providerImage: {
    width: '100%',
    height: '100%',
  },
  onboardingContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
  },
  indicatorRowOnboarding: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  indicatorDotOnboarding: {
    height: 8,
    borderRadius: 4,
  },
  slideContentOnboarding: {
    alignItems: 'center',
    marginBottom: 36,
  },
  slideTitle: {
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  slideDesc: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  sliderButton: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 28,
    paddingRight: 6,
    shadowColor: '#FBC02D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sliderButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sliderButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
