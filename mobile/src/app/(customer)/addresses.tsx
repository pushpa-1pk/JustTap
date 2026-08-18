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
  useGetCustomerProfile,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  Address,
} from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { getRequiredDeviceLocation } from '@/hooks/useDeviceLocation';
import * as Location from 'expo-location';

export default function AddressesScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const { data, isLoading: isProfileLoading, refetch } = useGetCustomerProfile();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  const addresses = data?.addresses || [];

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [label, setLabel] = useState<'home' | 'office' | 'other'>('home');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel('home');
    setAddressLine1('');
    setAddressLine2('');
    setLandmark('');
    setCity('');
    setState('');
    setPincode('');
    setCoordinates(null);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setCoordinates(Number.isFinite(addr.latitude) && Number.isFinite(addr.longitude) ? { latitude: addr.latitude, longitude: addr.longitude } : null);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAddress = async () => {
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields (Address line 1, City, State, Pincode).');
      return;
    }

    let location = coordinates;
    if (!location) {
      setIsLocating(true);
      location = await getRequiredDeviceLocation();
      setIsLocating(false);
      if (!location) return;
      setCoordinates(location);
    }

    setIsSubmitting(true);
    const payload = {
      label,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: 'India',
      latitude: location.latitude,
      longitude: location.longitude,
    };

    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({
          id: editingAddress._id,
          payload,
        });
        Alert.alert('Success', 'Address updated successfully!');
      } else {
        await createAddressMutation.mutateAsync(payload);
        Alert.alert('Success', 'Address created successfully!');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      refetch();
    } catch (err: any) {
      console.error('Failed to save address:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.message || 'Could not save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddressMutation.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetch();
            Alert.alert('Success', 'Address deleted successfully.');
          } catch (err: any) {
            console.error('Delete address failed:', err);
            Alert.alert('Error', 'Failed to delete address.');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddressMutation.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (err) {
      console.error('Set primary address failed:', err);
      Alert.alert('Error', 'Failed to update default address.');
    }
  };

  if (isProfileLoading) {
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
        <Text style={[typography.h3, { color: colors.text }]}>Saved Addresses</Text>
        <Pressable onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
            <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginTop: 12 }]}>
              No saved addresses found.
            </Text>
            <Pressable
              onPress={openAddModal}
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyAddText}>Add Address</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((addr) => (
              <View
                key={addr._id}
                style={[
                  styles.addressCard,
                  { borderColor: addr.isPrimary ? colors.primary : colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.labelRow}>
                    <Ionicons
                      name={
                        addr.label === 'home'
                          ? 'home'
                          : addr.label === 'office'
                            ? 'business'
                            : 'location'
                      }
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.addressLabel, { color: colors.text }]}>
                      {addr.label.toUpperCase()}
                    </Text>
                  </View>
                  {addr.isPrimary && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.defaultText, { color: colors.primary }]}>DEFAULT</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.addressText, { color: colors.text }]}>
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  {addr.landmark ? ` (Near ${addr.landmark})` : ''}
                </Text>
                <Text style={[styles.cityText, { color: colors.textSecondary }]}>
                  {addr.city}, {addr.state} - {addr.pincode}
                </Text>

                {/* Actions row */}
                <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                  {!addr.isPrimary ? (
                    <Pressable onPress={() => handleSetDefault(addr._id)} style={styles.actionBtn}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                        Set Default
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.actionBtn}>
                      <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                      <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Default Address</Text>
                    </View>
                  )}

                  <View style={styles.rightActions}>
                    <Pressable onPress={() => openEditModal(addr)} style={styles.actionBtn}>
                      <Ionicons name="create-outline" size={16} color={colors.text} />
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteAddress(addr._id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'New Address'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111111" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Label selector */}
              <Text style={styles.modalLabel}>Address Type</Text>
              <View style={styles.labelPicker}>
                {(['home', 'office', 'other'] as const).map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setLabel(l)}
                    style={[
                      styles.pickerBtn,
                      label === l && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.pickerText, label === l && { color: '#FFFFFF' }]}>
                      {l.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Address Line 1 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="House No, Apartment, Street name"
                value={addressLine1}
                onChangeText={addressLine1 => setAddressLine1(addressLine1)}
              />

              <Text style={styles.modalLabel}>Address Line 2</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Area, Colony (optional)"
                value={addressLine2}
                onChangeText={addressLine2 => setAddressLine2(addressLine2)}
              />

              <Text style={styles.modalLabel}>Landmark</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Near Big Bazaar (optional)"
                value={landmark}
                onChangeText={landmark => setLandmark(landmark)}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>City *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="City"
                    value={city}
                    onChangeText={city => setCity(city)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalLabel}>State *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="State"
                    value={state}
                    onChangeText={state => setState(state)}
                  />
                </View>
              </View>

              <Text style={styles.modalLabel}>Pincode *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="6-digit Pincode"
                keyboardType="number-pad"
                value={pincode}
                onChangeText={pincode => setPincode(pincode)}
              />

              <Pressable 
                onPress={async () => { 
                  setIsLocating(true); 
                  const location = await getRequiredDeviceLocation(); 
                  setIsLocating(false); 
                  if (location) {
                    setCoordinates(location);
                    try {
                      const geocode = await Location.reverseGeocodeAsync({
                        latitude: location.latitude,
                        longitude: location.longitude,
                      });
                      if (geocode && geocode.length > 0) {
                        const addr = geocode[0];
                        // Automatically fill the fields:
                        if (addr.streetNumber || addr.street || addr.name) {
                          const streetVal = [addr.streetNumber, addr.street, addr.name]
                            .filter(Boolean)
                            .join(', ');
                          setAddressLine1(streetVal);
                        } else if (addr.district) {
                          setAddressLine1(addr.district);
                        }
                        
                        if (addr.subregion || addr.district) {
                          setAddressLine2([addr.subregion, addr.district].filter(Boolean).join(', '));
                        }
                        
                        if (addr.city) {
                          setCity(addr.city);
                        } else if (addr.subregion) {
                          setCity(addr.subregion);
                        }
                        
                        if (addr.region) {
                          setState(addr.region);
                        }
                        
                        if (addr.postalCode) {
                          setPincode(addr.postalCode);
                        }
                      }
                    } catch (e) {
                      console.warn('Reverse geocode error:', e);
                    }
                  } 
                }} 
                disabled={isLocating || isSubmitting} 
                style={[styles.locationBtn, { borderColor: colors.primary }]}
              >
                {isLocating ? <ActivityIndicator color={colors.primary} /> : <><Ionicons name="locate-outline" size={18} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700' }}>{coordinates ? 'Location captured' : 'Use my current location'}</Text></>}
              </Pressable>
              {!coordinates && <Text style={styles.locationHint}>A real GPS location is required before this address can be saved.</Text>}

              <Pressable
                onPress={handleSaveAddress}
                disabled={isSubmitting}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Address</Text>
                )}
              </Pressable>
            </ScrollView>
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
  addButton: { padding: 4 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyAddBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  emptyAddText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  addressList: {
    gap: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '900',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
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
    maxHeight: '85%',
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
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 6,
    marginTop: 10,
  },
  labelPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  pickerBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    color: '#111111',
    fontSize: 15,
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
  locationBtn: { height: 46, borderWidth: 1, borderRadius: 10, marginTop: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  locationHint: { marginTop: 8, color: '#64748B', fontSize: 12 },
});
