import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetProviderBankDetails, 
  useCreateProviderBankDetails, 
  useUpdateProviderBankDetails,
  useDeleteProviderBankDetails
} from '@/hooks/useProviderProfile';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Zod Validation Schema for Bank Setup.
const bankSchema = z.object({
  accountHolderName: z.string().min(3, 'Holder name must be at least 3 characters'),
  accountNumber: z
    .string()
    .regex(/^\d*$/, 'Account number must contain only digits')
    .refine((value) => value === '' || (value.length >= 9 && value.length <= 18), {
      message: 'Account number must be 9-18 digits',
    }),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g. HDFC0123456)'),
  bankName: z.string().min(3, 'Bank name must be at least 3 characters'),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
  upiId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof bankSchema>;

export default function BankSetupScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  // Queries & Mutations
  const { data: bank, isLoading: isBankLoading, refetch } = useGetProviderBankDetails();
  const createBankDetails = useCreateProviderBankDetails();
  const updateBankDetails = useUpdateProviderBankDetails();
  const deleteBankDetails = useDeleteProviderBankDetails();

  const { control, handleSubmit, setValue, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountType: 'SAVINGS',
      upiId: '',
    }
  });

  // Pre-populate fields if bank details exist
  useEffect(() => {
    if (bank) {
      setValue('accountHolderName', bank.accountHolderName);
      setValue('ifscCode', bank.ifscCode);
      setValue('bankName', bank.bankName);
      setValue('accountType', bank.accountType);
      setValue('upiId', bank.upiId || '');
    }
  }, [bank, setValue]);

  const onSubmit = async (data: FormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (!bank && !data.accountNumber) {
      setError('accountNumber', { message: 'Account number is required' });
      return;
    }

    try {
      if (bank) {
        // A blank field means "keep the stored number", so omit the key entirely.
        const { accountNumber, ...rest } = data;
        await updateBankDetails.mutateAsync(accountNumber ? data : rest);
      } else {
        // Create Bank Details
        await createBankDetails.mutateAsync(data);
      }
      refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Bank details saved successfully!');
      router.back();
    } catch (err: any) {
      console.error('Submit bank details failed:', err);
      Alert.alert('Submit Error', err.response?.data?.message || 'Failed to save bank info.');
    }
  };

  const handleDeleteBank = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Payout Bank',
      'Are you sure you want to remove your payout bank details? You will not be able to trigger withdrawals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBankDetails.mutateAsync();
              refetch();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Removed', 'Bank details removed successfully.');
              router.back();
            } catch (err) {
              console.error('Remove bank details failed:', err);
            }
          }
        }
      ]
    );
  };

  if (isBankLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const isSaving = createBankDetails.isPending || updateBankDetails.isPending;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
        
        {/* Status display */}
        {bank && (
          <View style={[styles.verifiedBanner, { backgroundColor: bank.verified ? colors.secondary + '12' : colors.warning + '12', borderColor: bank.verified ? colors.secondary : colors.warning }]}>
            <Ionicons name={bank.verified ? 'shield-checkmark' : 'time'} size={20} color={bank.verified ? colors.secondary : colors.warning} />
            <Text style={[typography.bodyMedium, { color: bank.verified ? colors.secondary : colors.warning, marginLeft: 8, fontWeight: '700' }]}>
              {bank.verified ? 'Bank details are verified and active.' : 'Verification review pending.'}
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Payout Credentials</Text>

          <Text style={styles.label}>Account Holder Name</Text>
          <Controller
            control={control}
            name="accountHolderName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Account Holder Name"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.accountHolderName && <Text style={styles.error}>{errors.accountHolderName.message}</Text>}

          <Text style={styles.label}>Account Number</Text>
          <Controller
            control={control}
            name="accountNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder={bank ? bank.accountNumberMasked : 'Enter full account number'}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.accountNumber && <Text style={styles.error}>{errors.accountNumber.message}</Text>}

          <Text style={styles.label}>Bank IFSC Code</Text>
          <Controller
            control={control}
            name="ifscCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={(val) => onChange(val.toUpperCase())}
                value={value}
                autoCapitalize="characters"
                placeholder="IFSC Code (e.g. SBIN0004030)"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.ifscCode && <Text style={styles.error}>{errors.ifscCode.message}</Text>}

          <Text style={styles.label}>Bank Name</Text>
          <Controller
            control={control}
            name="bankName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Bank Name (e.g. State Bank of India)"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          {errors.bankName && <Text style={styles.error}>{errors.bankName.message}</Text>}

          <Text style={styles.label}>UPI ID (Optional)</Text>
          <Controller
            control={control}
            name="upiId"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ''}
                placeholder="UPI ID (e.g. name@okaxis)"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Account Type</Text>
          <Controller
            control={control}
            name="accountType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeRow}>
                {['SAVINGS', 'CURRENT'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeButton,
                      { borderColor: colors.border },
                      value === type && { backgroundColor: colors.secondary, borderColor: colors.secondary }
                    ]}
                    onPress={() => onChange(type)}
                  >
                    <Text style={[
                      typography.bodyMedium,
                      { color: colors.text },
                      value === type && { color: colors.onSecondary, fontWeight: '700' }
                    ]}>
                      {type} Account
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        {/* Action Button */}
        <Pressable 
          style={[styles.submitBtn, { backgroundColor: colors.secondary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.onSecondary} />
          ) : (
            <Text style={[typography.buttonText, { color: colors.onSecondary }]}>
              {bank ? 'Update Payout Details' : 'Configure Payout Bank'}
            </Text>
          )}
        </Pressable>

        {bank && (
          <Pressable 
            style={[styles.deleteBtn, { borderColor: colors.danger }]}
            onPress={handleDeleteBank}
            disabled={deleteBankDetails.isPending}
          >
            {deleteBankDetails.isPending ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={[typography.buttonText, { color: colors.danger }]}>Remove Payout Bank Details</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  error: { color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: '600' },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
});
