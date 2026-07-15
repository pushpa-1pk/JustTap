import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { useGetBankDetailsQuery, useCreateBankDetailsMutation, useUpdateBankDetailsMutation } from '@/redux/api/profileApi';
import * as Haptics from 'expo-haptics';

// Zod Validation Schema for Bank Setup
const bankSchema = z.object({
  accountHolderName: z.string().min(3, 'Holder name must be at least 3 characters'),
  accountNumber: z.string().min(9, 'Account number must be 9-18 digits').max(18, 'Account number must be 9-18 digits').regex(/^\d+$/, 'Account number must contain only digits'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g. HDFC0123456)'),
  bankName: z.string().min(3, 'Bank name must be at least 3 characters'),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
});

type FormData = z.infer<typeof bankSchema>;

export default function BankSetupScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();

  // Queries & Mutations
  const { data: bankRes, isLoading: isBankLoading, refetch } = useGetBankDetailsQuery();
  const [createBankDetails, { isLoading: isCreating }] = useCreateBankDetailsMutation();
  const [updateBankDetails, { isLoading: isUpdating }] = useUpdateBankDetailsMutation();

  const existingBank = bankRes?.data;

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountType: 'SAVINGS',
    }
  });

  // Pre-populate fields if bank details exist
  useEffect(() => {
    if (existingBank) {
      setValue('accountHolderName', existingBank.accountHolderName);
      setValue('accountNumber', existingBank.accountNumber);
      setValue('ifscCode', existingBank.ifscCode);
      setValue('bankName', existingBank.bankName);
      setValue('accountType', existingBank.accountType);
    }
  }, [existingBank, setValue]);

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (existingBank) {
        // Edit Bank Details
        await updateBankDetails(data).unwrap();
      } else {
        // Create Bank Details
        await createBankDetails(data).unwrap();
      }
      refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      console.error('Submit bank details failed:', err);
    }
  };

  if (isBankLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            Configure your payout account details below. Payouts are made directly to this account upon job completions.
          </Text>

          {/* Account Holder */}
          <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>ACCOUNT HOLDER NAME</Text>
          <Controller
            control={control}
            name="accountHolderName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter holder's name"
                placeholderTextColor={colors.textSecondary}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.accountHolderName && (
            <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
              {errors.accountHolderName.message}
            </Text>
          )}

          {/* Bank Name */}
          <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>BANK NAME</Text>
          <Controller
            control={control}
            name="bankName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. HDFC Bank"
                placeholderTextColor={colors.textSecondary}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.bankName && (
            <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
              {errors.bankName.message}
            </Text>
          )}

          {/* Account Number */}
          <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>ACCOUNT NUMBER</Text>
          <Controller
            control={control}
            name="accountNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter account number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.accountNumber && (
            <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
              {errors.accountNumber.message}
            </Text>
          )}

          {/* IFSC Code */}
          <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>IFSC CODE</Text>
          <Controller
            control={control}
            name="ifscCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="IFSC Code (e.g. HDFC0123456)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.ifscCode && (
            <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
              {errors.ifscCode.message}
            </Text>
          )}

          {/* Account Type Toggle */}
          <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>ACCOUNT TYPE</Text>
          <Controller
            control={control}
            name="accountType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.toggleRow}>
                {['SAVINGS', 'CURRENT'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.toggleOption,
                      { 
                        backgroundColor: value === type ? colors.secondary : colors.surface,
                        borderColor: value === type ? colors.secondary : colors.border
                      }
                    ]}
                    onPress={() => onChange(type)}
                  >
                    <Text style={[
                      typography.bodyMedium, 
                      { color: value === type ? '#FFFFFF' : colors.text }
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.secondary, marginTop: spacing.xl }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>
                {existingBank ? 'Save Changes' : 'Link Payout Account'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 24,
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
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
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
