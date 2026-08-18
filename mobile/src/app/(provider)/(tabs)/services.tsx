import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, TextInput, ActivityIndicator, Modal, Switch, Alert, RefreshControl, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetProviderServices, 
  useCreateProviderService, 
  useUpdateProviderService,
  useUpdateProviderServiceStatus,
  useDeleteProviderService,
  useGetCatalogServices
} from '@/hooks/useProviderProfile';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ProviderServicesScreen() {
  const { colors, typography, spacing } = useTheme();
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Form fields
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [price, setPrice] = useState('499');
  const [experience, setExperience] = useState('5');
  const [isAvailable, setIsAvailable] = useState(true);

  // React Query Hooks
  const { data: offers, isLoading: isOffersLoading, isRefetching, refetch } = useGetProviderServices();
  const { data: catalogServices } = useGetCatalogServices();
  const createServiceMutation = useCreateProviderService();
  const updateServiceMutation = useUpdateProviderService();
  const updateStatusMutation = useUpdateProviderServiceStatus();
  const deleteServiceMutation = useDeleteProviderService();

  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingServiceId(null);
    setSelectedServiceId(catalogServices?.[0]?._id || '');
    setPrice('499');
    setExperience('5');
    setIsAvailable(true);
    setModalVisible(true);
  };

  const handleOpenEditModal = (offer: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingServiceId(offer._id);
    setSelectedServiceId(offer.serviceId);
    setPrice(offer.price.toString());
    setExperience(offer.experience.toString());
    setIsAvailable(offer.isAvailable);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const priceVal = Number(price);
    const expVal = Number(experience);

    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }
    if (isNaN(expVal) || expVal < 0) {
      Alert.alert('Invalid Experience', 'Please enter valid years of experience.');
      return;
    }

    try {
      if (editingServiceId) {
        // Edit service
        await updateServiceMutation.mutateAsync({
          providerServiceId: editingServiceId,
          payload: {
            price: priceVal,
            experience: expVal,
          }
        });
      } else {
        // Add new service
        await createServiceMutation.mutateAsync({
          serviceId: selectedServiceId,
          price: priceVal,
          experience: expVal,
          isAvailable,
        });
      }
      setModalVisible(false);
      refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Submit service offer failed:', err);
      Alert.alert('Submit Error', err.response?.data?.message || 'Failed to submit service offer.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateStatusMutation.mutateAsync({
        providerServiceId: id,
        isAvailable: !currentStatus,
      });
      refetch();
    } catch (err) {
      console.error('Toggle service status failed:', err);
    }
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Service',
      'Are you sure you want to stop offering this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServiceMutation.mutateAsync(id);
              refetch();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              console.error('Delete service failed:', err);
            }
          }
        }
      ]
    );
  };

  if (isOffersLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.secondary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[typography.h2, { color: colors.text }]}>Offered Services</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
              Manage the services and rates you offer to customers.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700', marginTop: 12 }]}>
              No services offered
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
              Click the add button below to start configuring your professional service rates.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const detail = item.serviceDetails;
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                    {detail?.name || 'Custom Skill Service'}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    Category: {detail?.categoryName || 'General'} | Exp: {item.experience} yrs
                  </Text>
                </View>
                
                <Pressable onPress={() => handleDelete(item._id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginVertical: 8 }]} numberOfLines={2}>
                {detail?.description || 'No description available for this service catalog item.'}
              </Text>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>YOUR BASE RATE</Text>
                  <Text style={[typography.h3, { color: colors.secondary, fontWeight: '800' }]}>
                    ₹{item.price}
                  </Text>
                </View>

                <View style={styles.footerActions}>
                  <Pressable 
                    style={[styles.btnIcon, { borderColor: colors.border }]} 
                    onPress={() => handleOpenEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.text} />
                  </Pressable>

                  <View style={styles.toggleWrapper}>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginRight: 6 }]}>Available</Text>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={() => handleToggleStatus(item._id, item.isAvailable)}
                      trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
                      thumbColor={item.isAvailable ? colors.secondary : '#94A3B8'}
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Floating Add Button */}
      <Pressable style={[styles.fab, { backgroundColor: colors.secondary }]} onPress={handleOpenAddModal}>
        <Ionicons name="add" size={28} color={colors.onSecondary} />
      </Pressable>

      {/* Add / Edit Service Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 16 }]}>
              {editingServiceId ? 'Edit Service Offer' : 'Configure Service Offer'}
            </Text>

            {!editingServiceId && (
              <>
                <Text style={styles.label}>Select Catalog Service</Text>
                <ScrollView 
                  style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                  nestedScrollEnabled={true}
                >
                  {catalogServices?.map((serv: any) => (
                    <Pressable
                      key={serv._id}
                      style={[
                        styles.pickerItem,
                        selectedServiceId === serv._id && { backgroundColor: colors.secondary + '20' }
                      ]}
                      onPress={() => setSelectedServiceId(serv._id)}
                    >
                      <Text style={[typography.bodyMedium, { color: colors.text }]}>{serv.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>Your Service Rate (in INR)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              placeholder="e.g. 499"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Your Specific Experience (Years)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
              value={experience}
              onChangeText={setExperience}
              keyboardType="number-pad"
              placeholder="e.g. 5"
            />

            <View style={styles.modalActionRow}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalVisible(false)}>
                <Text style={[typography.buttonText, { color: '#0F172A' }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.secondary }]} onPress={handleSubmit}>
                <Text style={[typography.buttonText, { color: colors.onSecondary }]}>Save Config</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 20 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  pickerContainer: {
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
