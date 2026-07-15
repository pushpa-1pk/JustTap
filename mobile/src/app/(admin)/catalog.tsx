import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Modal, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useGetCategoriesQuery, useGetServicesQuery } from '@/redux/api/serviceApi';
import { useCreateCategoryMutation, useCreateServiceMutation } from '@/redux/api/adminApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function AdminCatalogScreen() {
  const { colors, typography, spacing, border } = useTheme();

  // Modal display controls
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [svcModalVisible, setSvcModalVisible] = useState(false);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [selectedCatId, setSelectedCatId] = useState('');
  const [svcName, setSvcName] = useState('');
  const [svcSlug, setSvcSlug] = useState('');
  const [svcDuration, setSvcDuration] = useState('60');
  const [svcDesc, setSvcDesc] = useState('');

  // API Queries & Mutations
  const { data: categoriesRes, isLoading: isCatsLoading, refetch: refetchCats } = useGetCategoriesQuery();
  const { data: servicesRes, isLoading: isSvcsLoading, refetch: refetchSvcs } = useGetServicesQuery();
  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();
  const [createService, { isLoading: isCreatingSvc }] = useCreateServiceMutation();

  const categories = categoriesRes?.data || [];
  const services = servicesRes?.data || [];

  const handleOpenCatModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatModalVisible(true);
  };

  const handleOpenSvcModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (categories.length === 0) {
      Alert.alert('Category Required', 'Please create a service category first.');
      return;
    }
    setSelectedCatId(categories[0]._id);
    setSvcName('');
    setSvcSlug('');
    setSvcDuration('60');
    setSvcDesc('');
    setSvcModalVisible(true);
  };

  const handleCreateCategorySubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (catName.trim() === '' || catSlug.trim() === '') {
      Alert.alert('Error', 'Name and Slug are required fields.');
      return;
    }
    try {
      const response = await createCategory({
        name: catName,
        slug: catSlug.toLowerCase().replace(/\s+/g, '-'),
        description: catDesc,
        isActive: true,
      }).unwrap();

      if (response.success) {
        setCatModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Category Created', 'New category added to database catalog.');
        refetchCats();
      }
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to create category');
    }
  };

  const handleCreateServiceSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (svcName.trim() === '' || svcSlug.trim() === '') {
      Alert.alert('Error', 'Name and Slug are required fields.');
      return;
    }
    try {
      const response = await createService({
        categoryId: selectedCatId,
        name: svcName,
        slug: svcSlug.toLowerCase().replace(/\s+/g, '-'),
        estimatedDuration: Number(svcDuration),
        description: svcDesc,
        isActive: true,
      }).unwrap();

      if (response.success) {
        setSvcModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Service Created', 'New catalog service added.');
        refetchSvcs();
      }
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to create service');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.lg }]}>
      
      {/* Header operations buttons */}
      <View style={styles.headerRow}>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenCatModal}
        >
          <Text style={[typography.buttonText, { color: colors.onPrimary, fontSize: 13 }]}>+ Add Category</Text>
        </Pressable>

        <Pressable 
          style={[styles.addBtn, { backgroundColor: colors.secondary }]}
          onPress={handleOpenSvcModal}
        >
          <Text style={[typography.buttonText, { color: '#FFFFFF', fontSize: 13 }]}>+ Add Service</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.md }]}>
        Active Catalog Categories
      </Text>

      {isCatsLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : categories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>No category entries configured yet.</Text>
        </View>
      ) : (
        <View style={{ maxHeight: 150 }}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
            renderItem={({ item }) => (
              <View style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SvgIcon name={item.slug} color={colors.secondary} size={20} />
                <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700', marginTop: 4 }]}>
                  {item.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  slug: {item.slug}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      <Text style={[styles.sectionTitle, typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
        Official Catalog Services
      </Text>

      {isSvcsLoading ? (
        <ActivityIndicator size="small" color={colors.secondary} />
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>No services configured yet.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: 12, marginTop: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.svcCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.svcHeader}>
                <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                  🛠️ {item.name}
                </Text>
                <View style={[styles.durationBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[typography.caption, { color: colors.text }]}>
                    ⏱️ {item.estimatedDuration} mins
                  </Text>
                </View>
              </View>
              {item.description && (
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  {item.description}
                </Text>
              )}
            </View>
          )}
        />
      )}

      {/* 1. CREATE CATEGORY MODAL */}
      <Modal
        visible={catModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Add Category</Text>
            
            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary }]}>CATEGORY NAME</Text>
            <TextInput
              style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="e.g. Electrician"
              value={catName}
              onChangeText={setCatName}
            />

            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>CATEGORY SLUG</Text>
            <TextInput
              style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="e.g. electrician"
              value={catSlug}
              onChangeText={setCatSlug}
            />

            <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="Category overview..."
              value={catDesc}
              onChangeText={setCatDesc}
            />

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setCatModalVisible(false)}>
                <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Dismiss</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]} 
                onPress={handleCreateCategorySubmit}
                disabled={isCreatingCat}
              >
                {isCreatingCat ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. CREATE SERVICE MODAL */}
      <Modal
        visible={svcModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSvcModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.scrollModal} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Add Catalog Service</Text>
              
              <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary }]}>PARENT CATEGORY</Text>
              <View style={styles.pickerRow}>
                {categories.map(c => (
                  <Pressable
                    key={c._id}
                    style={[
                      styles.pickerItem,
                      selectedCatId === c._id && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setSelectedCatId(c._id)}
                  >
                    <Text style={[
                      typography.caption, 
                      { color: selectedCatId === c._id ? colors.onPrimary : colors.text, fontWeight: '700' }
                    ]}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>SERVICE NAME</Text>
              <TextInput
                style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                placeholder="e.g. Ceiling Fan Repair"
                value={svcName}
                onChangeText={setSvcName}
              />

              <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>SERVICE SLUG</Text>
              <TextInput
                style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                placeholder="e.g. fan-repair"
                value={svcSlug}
                onChangeText={setSvcSlug}
              />

              <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>ESTIMATED DURATION (MINUTES)</Text>
              <TextInput
                style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                placeholder="60"
                keyboardType="number-pad"
                value={svcDuration}
                onChangeText={setSvcDuration}
              />

              <Text style={[styles.modalLabel, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>DESCRIPTION</Text>
              <TextInput
                style={[styles.textInput, typography.bodyLarge, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                placeholder="Details of what service covers..."
                value={svcDesc}
                onChangeText={setSvcDesc}
              />

              <View style={styles.modalBtns}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setSvcModalVisible(false)}>
                  <Text style={[typography.buttonText, { color: colors.textSecondary }]}>Dismiss</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.secondary }]} 
                  onPress={handleCreateServiceSubmit}
                  disabled={isCreatingSvc}
                >
                  {isCreatingSvc ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Save Service</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCard: {
    width: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svcCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  svcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  scrollModal: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
  },
  modalLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
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
