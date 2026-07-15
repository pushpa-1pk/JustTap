import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, TextInput, ActivityIndicator, Modal, Switch } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGetProviderServicesQuery, 
  useCreateProviderServiceMutation, 
  useUpdateProviderServiceMutation,
  useUpdateProviderServiceStatusMutation,
  useDeleteProviderServiceMutation,
  useGetServicesQuery
} from '@/redux/api/serviceApi';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function ProviderServicesScreen() {
  const { colors, typography, spacing, border } = useTheme();
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  
  // Form fields
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [price, setPrice] = useState('499');
  const [experience, setExperience] = useState('5');
  const [isAvailable, setIsAvailable] = useState(true);

  // API Queries & Mutations
  const { data: offersRes, isLoading: isOffersLoading, refetch: refetchOffers } = useGetProviderServicesQuery();
  const { data: catalogServicesRes } = useGetServicesQuery();
  const [createOffer, { isLoading: isCreating }] = useCreateProviderServiceMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateProviderServiceMutation();
  const [updateStatus] = useUpdateProviderServiceStatusMutation();
  const [deleteOffer] = useDeleteProviderServiceMutation();

  const offers = offersRes?.data || [];
  const catalogServices = catalogServicesRes?.data || [];

  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingOfferId(null);
    setSelectedServiceId(catalogServices[0]?._id || '');
    setPrice('499');
    setExperience('5');
    setIsAvailable(true);
    setModalVisible(true);
  };

  const handleOpenEditModal = (offer: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingOfferId(offer._id);
    setSelectedServiceId(offer.serviceId);
    setPrice(offer.price.toString());
    setExperience(offer.experience.toString());
    setIsAvailable(offer.isAvailable);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (editingOfferId) {
        // Edit offer
        await updateOffer({
          providerServiceId: editingOfferId,
          price: Number(price),
          experience: Number(experience),
        }).unwrap();
      } else {
        // Add new offer
        await createOffer({
          serviceId: selectedServiceId,
          price: Number(price),
          experience: Number(experience),
          isAvailable,
        }).unwrap();
      }
      setModalVisible(false);
      refetchOffers();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Submit service offer failed:', err);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateStatus({
        providerServiceId: id,
        isAvailable: !currentStatus,
      }).unwrap();
      refetchOffers();
    } catch (err) {
      console.error('Toggle service status failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteOffer(id).unwrap();
      refetchOffers();
    } catch (err) {
      console.error('Delete service offer failed:', err);
    }
  };

  const getServiceName = (serviceId: string) => {
    const s = catalogServices.find(item => item._id === serviceId);
    return s ? s.name : 'Home Service';
  };

  const getServiceSlug = (serviceId: string) => {
    const s = catalogServices.find(item => item._id === serviceId);
    return s ? s.slug : 'briefcase';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header add button */}
      <View style={styles.header}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Manage the services you offer to local clients
        </Text>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: colors.secondary }]}
          onPress={handleOpenAddModal}
        >
          <Text style={[typography.buttonText, { color: '#FFFFFF', fontSize: 14 }]}>+ Offer Service</Text>
        </Pressable>
      </View>

      {/* List of Offers */}
      {isOffersLoading ? (
        <View style={styles.listContainer}>
          {[1, 2].map(k => (
            <View key={k} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Shimmer width={180} height={18} />
              <Shimmer width={100} height={12} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.centerContainer}>
          <SvgIcon name="briefcase" color={colors.textSecondary} size={48} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            No Services Offered
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            Tap "Offer Service" to configure your first professional service.
          </Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                  <SvgIcon name={getServiceSlug(item.serviceId)} color={colors.secondary} size={28} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.h3, { color: colors.text, fontWeight: '700' }]}>
                    {getServiceName(item.serviceId)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    {item.experience} years experience
                  </Text>
                  <Text style={[typography.h2, { color: colors.secondary, fontWeight: '800', marginTop: 4 }]}>
                    ₹{item.price} <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '400' }]}>/ job</Text>
                  </Text>
                </View>

                {/* Toggle availability Switch */}
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => handleToggleStatus(item._id, item.isAvailable)}
                  trackColor={{ false: colors.border, true: colors.secondary + '60' }}
                  thumbColor={item.isAvailable ? colors.secondary : colors.textSecondary}
                />
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
                <Pressable onPress={() => handleDelete(item._id)}>
                  <Text style={[typography.bodySmall, { color: colors.danger, fontWeight: '700' }]}>Remove Offer</Text>
                </Pressable>
                
                <Pressable style={styles.editBtn} onPress={() => handleOpenEditModal(item)}>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: '700' }]}>Edit Rate</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* ADD / EDIT MODAL FORM */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
              {editingOfferId ? 'Edit Service Offer' : 'Offer New Service'}
            </Text>

            {/* Service Selection (Only if adding new) */}
            {!editingOfferId && (
              <>
                <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary }]}>SELECT CATALOG SERVICE</Text>
                <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  {catalogServices.map(svc => (
                    <Pressable
                      key={svc._id}
                      style={[
                        styles.pickerItem,
                        selectedServiceId === svc._id && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setSelectedServiceId(svc._id)}
                    >
                      <Text style={[
                        typography.caption, 
                        { color: selectedServiceId === svc._id ? colors.onPrimary : colors.text, fontWeight: '600' }
                      ]}>
                        {svc.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Price Rate input */}
            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>
              UPFRONT PRICE RATE (₹)
            </Text>
            <TextInput
              style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="e.g. 499"
              keyboardType="number-pad"
              value={price}
              onChangeText={setPrice}
            />

            {/* Experience input */}
            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>
              EXPERIENCE LEVEL (IN YEARS)
            </Text>
            <TextInput
              style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="e.g. 5"
              keyboardType="number-pad"
              value={experience}
              onChangeText={setExperience}
            />

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Dismiss</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: colors.secondary }]} 
                onPress={handleSubmit}
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>
                    {editingOfferId ? 'Save Rate' : 'Offer Service'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  addBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
  },
  modalLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalConfirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
