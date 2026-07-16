import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useCreateCustomerProfileMutation, useCreateProviderProfileMutation } from '@/redux/api/profileApi';
import { updateUser } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import { secureStore } from '@/utils/secureStore';
import * as Haptics from 'expo-haptics';

// 1. Zod Validation Schema for Customer Profile
const customerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  language: z.string(),
});

// 2. Zod Validation Schema for Provider Profile
const providerSchema = z.object({
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  experience: z.coerce.number().min(0, 'Experience must be a positive number'),
  workingRadius: z.coerce.number().min(1, 'Working radius must be at least 1 km'),
  bio: z.string().min(10, 'Bio must be at least 10 characters long'),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type ProviderFormData = z.infer<typeof providerSchema>;

export default function RegisterScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  
  // Chosen role toggle state
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');

  // Mutations
  const [createCustomerProfile, { isLoading: isCreatingCustomer }] = useCreateCustomerProfileMutation();
  const [createProviderProfile, { isLoading: isCreatingProvider }] = useCreateProviderProfileMutation();

  // 1. Customer Form Setup
  const customerForm = useForm<z.input<typeof customerSchema>, any, CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { fullName: '', email: '', gender: 'Male', dateOfBirth: '1998-01-01', language: 'English' },
  });

  // 2. Provider Form Setup
  const providerForm = useForm<z.input<typeof providerSchema>, any, ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: { businessName: '', experience: 2, workingRadius: 10, bio: '', workingHoursStart: '09:00', workingHoursEnd: '18:00' },
  });

  const handleRoleSelect = (role: 'CUSTOMER' | 'PROVIDER') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRole(role);
  };

  // Submit Customer Profile
  const onCustomerSubmit = async (data: CustomerFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await createCustomerProfile({
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        language: data.language,
      }).unwrap();

      if (response.success) {
        // Update Local Session & Role Storage
        await secureStore.saveRole('CUSTOMER');
        dispatch(updateUser({ role: 'CUSTOMER', isProfileComplete: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(customer)/(tabs)/home');
      }
    } catch (err) {
      console.error('Customer profile creation failed:', err);
    }
  };

  // Submit Provider Profile
  const onProviderSubmit = async (data: ProviderFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await createProviderProfile({
        businessName: data.businessName,
        experience: Number(data.experience),
        workingRadius: Number(data.workingRadius),
        latitude: 19.0760, // Default coordinates for Mumbai center
        longitude: 72.8777,
        workingHours: {
          start: data.workingHoursStart,
          end: data.workingHoursEnd,
        },
        bio: data.bio,
      }).unwrap();

      if (response.success) {
        // Update Local Session & Role Storage
        await secureStore.saveRole('PROVIDER');
        dispatch(updateUser({ role: 'PROVIDER', isProfileComplete: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(provider)/(tabs)/dashboard');
      }
    } catch (err) {
      console.error('Provider profile creation failed:', err);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
          <Text style={[typography.h1, { color: colors.text, textAlign: 'center' }]}>Complete Profile</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl }]}>
            Choose how you want to use JustTap
          </Text>

          {/* Role Toggle Selector */}
          <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Pressable 
              style={[
                styles.toggleButton, 
                selectedRole === 'CUSTOMER' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleRoleSelect('CUSTOMER')}
            >
              <Text style={[
                typography.buttonText, 
                { color: selectedRole === 'CUSTOMER' ? colors.onPrimary : colors.textSecondary }
              ]}>
                Customer
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.toggleButton, 
                selectedRole === 'PROVIDER' && { backgroundColor: colors.secondary }
              ]}
              onPress={() => handleRoleSelect('PROVIDER')}
            >
              <Text style={[
                typography.buttonText, 
                { color: selectedRole === 'PROVIDER' ? colors.onSecondary : colors.textSecondary }
              ]}>
                Service Provider
              </Text>
            </Pressable>
          </View>

          {/* CUSTOMER REGISTRATION FORM */}
          {selectedRole === 'CUSTOMER' && (
            <View style={styles.form}>
              {/* Full Name */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>FULL NAME</Text>
              <Controller
                control={customerForm.control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {customerForm.formState.errors.fullName && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {customerForm.formState.errors.fullName.message}
                </Text>
              )}

              {/* Email */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>EMAIL ADDRESS</Text>
              <Controller
                control={customerForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="name@email.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {customerForm.formState.errors.email && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {customerForm.formState.errors.email.message}
                </Text>
              )}

              {/* Gender Selector */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>GENDER</Text>
              <Controller
                control={customerForm.control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.genderRow}>
                    {['Male', 'Female', 'Other'].map((g) => (
                      <Pressable
                        key={g}
                        style={[
                          styles.genderOption,
                          { 
                            backgroundColor: value === g ? colors.primary : colors.surface,
                            borderColor: value === g ? colors.primary : colors.border
                          }
                        ]}
                        onPress={() => onChange(g)}
                      >
                        <Text style={[
                          typography.bodyMedium, 
                          { color: value === g ? colors.onPrimary : colors.text }
                        ]}>
                          {g}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              />

              {/* Date of Birth */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>DATE OF BIRTH (YYYY-MM-DD)</Text>
              <Controller
                control={customerForm.control}
                name="dateOfBirth"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="1998-05-10"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {customerForm.formState.errors.dateOfBirth && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {customerForm.formState.errors.dateOfBirth.message}
                </Text>
              )}

              <Pressable
                style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: spacing.xl }]}
                onPress={customerForm.handleSubmit(onCustomerSubmit)}
                disabled={isCreatingCustomer}
              >
                {isCreatingCustomer ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Submit Details</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* PROVIDER REGISTRATION FORM */}
          {selectedRole === 'PROVIDER' && (
            <View style={styles.form}>
              {/* Business Name */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>BUSINESS / PROFESSIONAL NAME</Text>
              <Controller
                control={providerForm.control}
                name="businessName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. Fast Electric Works"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {providerForm.formState.errors.businessName && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {providerForm.formState.errors.businessName.message}
                </Text>
              )}

              {/* Experience */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>YEARS OF EXPERIENCE</Text>
              <Controller
                control={providerForm.control}
                name="experience"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. 5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value?.toString()}
                  />
                )}
              />
              {providerForm.formState.errors.experience && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {providerForm.formState.errors.experience.message}
                </Text>
              )}

              {/* Working Radius */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>WORKING RADIUS (IN KM)</Text>
              <Controller
                control={providerForm.control}
                name="workingRadius"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. 15"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value?.toString()}
                  />
                )}
              />
              {providerForm.formState.errors.workingRadius && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {providerForm.formState.errors.workingRadius.message}
                </Text>
              )}

              {/* Working Hours */}
              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>START TIME</Text>
                  <Controller
                    control={providerForm.control}
                    name="workingHoursStart"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        placeholder="09:00"
                        placeholderTextColor={colors.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>END TIME</Text>
                  <Controller
                    control={providerForm.control}
                    name="workingHoursEnd"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        placeholder="18:00"
                        placeholderTextColor={colors.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
              </View>
              {(providerForm.formState.errors.workingHoursStart || providerForm.formState.errors.workingHoursEnd) && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger, marginTop: spacing.xs }]}>
                  Time must be in HH:MM format
                </Text>
              )}

              {/* Bio */}
              <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>BIO / BUSINESS DESCRIPTION</Text>
              <Controller
                control={providerForm.control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input, 
                      styles.textArea,
                      typography.bodyLarge, 
                      { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
                    ]}
                    placeholder="Tell clients about your expertise..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {providerForm.formState.errors.bio && (
                <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
                  {providerForm.formState.errors.bio.message}
                </Text>
              )}

              <Pressable
                style={[styles.submitButton, { backgroundColor: colors.secondary, marginTop: spacing.xl }]}
                onPress={providerForm.handleSubmit(onProviderSubmit)}
                disabled={isCreatingProvider}
              >
                {isCreatingProvider ? (
                  <ActivityIndicator size="small" color={colors.onSecondary} />
                ) : (
                  <Text style={[typography.buttonText, { color: colors.onSecondary }]}>Submit Details</Text>
                )}
              </Pressable>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    marginTop: 4,
  },
  submitButton: {
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
