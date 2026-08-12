import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  useGetPaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  PaymentMethod,
} from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';

export default function PaymentMethodsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const { data: methods = [], isLoading: isMethodsLoading, refetch } = useGetPaymentMethods();
  const addMethodMutation = useAddPaymentMethod();
  const deleteMethodMutation = useDeletePaymentMethod();
  const setDefaultMutation = useSetDefaultPaymentMethod();

  const [modalVisible, setModalVisible] = useState(false);
  const [methodType, setMethodType] = useState<'UPI' | 'CARD'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const openAddModal = (type: 'UPI' | 'CARD') => {
    setMethodType(type);
    setUpiId('');
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSavePaymentMethod = async () => {
    setIsSubmitting(true);
    let payload = {};

    if (methodType === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        Alert.alert('Invalid UPI ID', 'Please enter a valid UPI address (e.g. user@okaxis).');
        setIsSubmitting(false);
        return;
      }
      payload = {
        type: 'UPI',
        details: { upiId: upiId.trim().toLowerCase() },
      };
    } else {
      if (cardNumber.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
        Alert.alert('Incomplete Card Details', 'Please fill in card number, expiry, and CVV.');
        setIsSubmitting(false);
        return;
      }
      const last4 = cardNumber.slice(-4);
      payload = {
        type: 'CARD',
        details: {
          cardLast4: last4,
          cardBrand: 'Visa', // mock brand calculation
          cardExpiry: cardExpiry,
        },
      };
    }

    try {
      await addMethodMutation.mutateAsync(payload as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      refetch();
      Alert.alert('Success', 'Payment method saved successfully.');
    } catch (err: any) {
      console.error('Failed to save payment method:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.message || 'Could not save payment method.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    Alert.alert('Confirm Remove', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMethodMutation.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetch();
            Alert.alert('Removed', 'Payment method removed.');
          } catch (err: any) {
            console.error('Remove payment method failed:', err);
            Alert.alert('Error', 'Failed to remove payment method.');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (err) {
      console.error('Set default payment failed:', err);
      Alert.alert('Error', 'Failed to update default payment method.');
    }
  };

  if (isMethodsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* UPI section */}
        <View style={styles.methodSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved UPI Handles</Text>
            <Pressable onPress={() => openAddModal('UPI')} style={styles.addLink}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>+ Add UPI</Text>
            </Pressable>
          </View>

          {methods.filter(m => m.type === 'UPI').length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No saved UPI handles.
            </Text>
          ) : (
            <View style={styles.list}>
              {methods
                .filter(m => m.type === 'UPI')
                .map(m => (
                  <View
                    key={m._id}
                    style={[
                      styles.methodRow,
                      { borderColor: m.isDefault ? colors.primary : colors.border },
                    ]}
                  >
                    <View style={styles.methodLogo}>
                      <Ionicons name="flash" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={[styles.methodTitle, { color: colors.text }]}>
                        {m.details.upiId}
                      </Text>
                      {m.isDefault && (
                        <Text style={[styles.defaultLabel, { color: colors.primary }]}>
                          Default Option
                        </Text>
                      )}
                    </View>
                    <View style={styles.methodActions}>
                      {!m.isDefault && (
                        <Pressable onPress={() => handleSetDefault(m._id)} style={styles.actionBtn}>
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                            Set Default
                          </Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleDeleteMethod(m._id)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Card section */}
        <View style={styles.methodSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Cards</Text>
            <Pressable onPress={() => openAddModal('CARD')} style={styles.addLink}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>+ Add Card</Text>
            </Pressable>
          </View>

          {methods.filter(m => m.type === 'CARD').length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved cards.</Text>
          ) : (
            <View style={styles.list}>
              {methods
                .filter(m => m.type === 'CARD')
                .map(m => (
                  <View
                    key={m._id}
                    style={[
                      styles.methodRow,
                      { borderColor: m.isDefault ? colors.primary : colors.border },
                    ]}
                  >
                    <View style={styles.methodLogo}>
                      <Ionicons name="card" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={[styles.methodTitle, { color: colors.text }]}>
                        {m.details.cardBrand} •••• {m.details.cardLast4}
                      </Text>
                      <Text style={[styles.expiryLabel, { color: colors.textSecondary }]}>
                        Expires: {m.details.cardExpiry}
                      </Text>
                      {m.isDefault && (
                        <Text style={[styles.defaultLabel, { color: colors.primary }]}>
                          Default Option
                        </Text>
                      )}
                    </View>
                    <View style={styles.methodActions}>
                      {!m.isDefault && (
                        <Pressable onPress={() => handleSetDefault(m._id)} style={styles.actionBtn}>
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                            Set Default
                          </Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleDeleteMethod(m._id)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Form */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {methodType === 'UPI' ? 'Add UPI Handle' : 'Add Credit / Debit Card'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111111" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {methodType === 'UPI' ? (
                <View>
                  <Text style={styles.modalLabel}>UPI ID *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. mobileNumber@upi, name@okicici"
                    autoCapitalize="none"
                    value={upiId}
                    onChangeText={upiId => setUpiId(upiId)}
                  />
                  <Text style={styles.hintText}>
                    Verify and save your virtual payment address for quick checkouts.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalLabel}>Card Number *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="XXXX XXXX XXXX XXXX"
                    keyboardType="numeric"
                    maxLength={16}
                    value={cardNumber}
                    onChangeText={cardNumber => setCardNumber(cardNumber)}
                  />

                  <Text style={styles.modalLabel}>Cardholder Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="John Doe"
                    autoCapitalize="words"
                    value={cardHolder}
                    onChangeText={cardHolder => setCardHolder(cardHolder)}
                  />

                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Expiry *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={cardExpiry => setCardExpiry(cardExpiry)}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.modalLabel}>CVV *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="123"
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry={true}
                        value={cardCvv}
                        onChangeText={cardCvv => setCardCvv(cardCvv)}
                      />
                    </View>
                  </View>
                </View>
              )}

              <Pressable
                onPress={handleSavePaymentMethod}
                disabled={isSubmitting}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Payment Method</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { padding: 4 },
  methodSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addLink: {
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  list: {
    gap: 12,
  },
  methodRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  methodLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  defaultLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  expiryLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  removeBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    color: '#111111',
    fontSize: 15,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
    marginTop: 4,
  },
  twoCol: {
    flexDirection: 'row',
    marginTop: 4,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
