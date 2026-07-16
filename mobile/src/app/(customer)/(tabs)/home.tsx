import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, RefreshControl, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useGetCategoriesQuery, useGetServicesQuery } from '@/redux/api/serviceApi';
import { useGetAddressesQuery } from '@/redux/api/profileApi';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48 - 24) / 4; // Adjust grid widths

export default function CustomerHomeScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // API Queries
  const { data: categoriesRes, isLoading: isCategoriesLoading, refetch: refetchCategories, isError: isCategoriesError } = useGetCategoriesQuery();
  const { data: servicesRes, isLoading: isServicesLoading, refetch: refetchServices } = useGetServicesQuery({ isPopular: true });
  const { data: addressesRes, isLoading: isAddressesLoading, refetch: refetchAddresses } = useGetAddressesQuery();

  const categories = categoriesRes?.data || [];
  const popularServices = servicesRes?.data || [];
  
  // Find primary address
  const primaryAddress = addressesRes?.data?.find(addr => addr.isPrimary) || addressesRes?.data?.[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refetchCategories(),
      refetchServices(),
      refetchAddresses()
    ]);
    setRefreshing(false);
  }, [refetchCategories, refetchServices, refetchAddresses]);

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(customer)/search',
      params: { categoryId, categoryName },
    });
  };

  const handleServicePress = (serviceId: string, serviceName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(customer)/search',
      params: { serviceId, serviceName },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header Location */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>DELIVERING TO</Text>
          <Pressable 
            style={styles.locationSelector}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
              {primaryAddress ? `${primaryAddress.label.toUpperCase()} (${primaryAddress.city})` : 'Select Location'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
              {primaryAddress ? `${primaryAddress.addressLine1}, ${primaryAddress.addressLine2 || ''}`.trim() : 'Tap to add your delivery address'}
            </Text>
          </Pressable>
        </View>
        
        {/* Notification Bell Icon */}
        <Pressable 
          style={[styles.notificationBtn, { borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(customer)/notifications');
          }}
        >
          <View style={[styles.bellDot, { backgroundColor: colors.secondary }]} />
          {/* Simple Bell Svg drawing */}
          <SvgIcon name="briefcase" color={colors.text} size={20} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* 2. Interactive Search Trigger Bar */}
        <Pressable 
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(customer)/search')}
        >
          <SvgIcon name="briefcase" color={colors.textSecondary} size={18} />
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
            Search for electrician, plumber, AC repair...
          </Text>
        </Pressable>

        {/* 3. Promotional banner matching website combo */}
        <View style={[styles.promoBanner, { backgroundColor: colors.secondary }]}>
          <Text style={[typography.bodyMedium, { color: colors.onSecondary, fontWeight: '700' }]}>
            ⚡ Flat 20% OFF on your first booking!
          </Text>
          <View style={[styles.couponBadge, { backgroundColor: colors.primary }]}>
            <Text style={[typography.caption, { color: colors.onPrimary, fontWeight: '800' }]}>TAP20</Text>
          </View>
        </View>

        {/* 4. Categories Grid Section */}
        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Categories</Text>
          
          {isCategoriesLoading ? (
            <View style={styles.gridRow}>
              {[1, 2, 3, 4].map(k => (
                <View key={k} style={styles.gridItem}>
                  <Shimmer width={COLUMN_WIDTH} height={COLUMN_WIDTH} borderRadius={16} />
                  <Shimmer width={COLUMN_WIDTH - 10} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                </View>
              ))}
            </View>
          ) : isCategoriesError ? (
            <View style={styles.errorContainer}>
              <Text style={[typography.bodyMedium, { color: colors.danger }]}>Failed to load categories.</Text>
              <Pressable style={styles.retryBtn} onPress={refetchCategories}>
                <Text style={[typography.bodySmall, { color: colors.secondary, fontWeight: '700' }]}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {categories.map((cat) => (
                <Pressable
                  key={cat._id}
                  style={styles.gridItem}
                  onPress={() => handleCategoryPress(cat._id, cat.name)}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <SvgIcon name={cat.slug} color={colors.secondary} size={28} />
                  </View>
                  <Text style={[typography.bodySmall, { color: colors.text, textAlign: 'center', marginTop: spacing.xs, fontWeight: '600' }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 5. Popular Services Horizontal Section */}
        <View style={[styles.section, { marginVertical: spacing.lg }]}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Popular Services</Text>

          {isServicesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} gap={16}>
              {[1, 2, 3].map(k => (
                <View key={k} style={[styles.popularCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Shimmer width={120} height={80} borderRadius={12} />
                  <Shimmer width={100} height={14} style={{ marginTop: 8 }} />
                  <Shimmer width={60} height={10} style={{ marginTop: 6 }} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={popularServices}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ gap: spacing.md }}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.popularCard, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      shadowColor: colors.text,
                    }
                  ]}
                  onPress={() => handleServicePress(item._id, item.name)}
                >
                  <View style={[styles.popularIconBox, { backgroundColor: colors.surfaceVariant }]}>
                    <SvgIcon name={item.slug} color={colors.primary} size={32} />
                  </View>
                  <View style={styles.popularCardDetails}>
                    <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                      ⏱️ {item.estimatedDuration} mins
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  locationSelector: {
    marginTop: 4,
    maxWidth: 240,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  promoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
  },
  couponBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: COLUMN_WIDTH - 8,
    height: COLUMN_WIDTH - 8,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popularCard: {
    width: 160,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  popularIconBox: {
    width: '100%',
    height: 90,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularCardDetails: {
    marginTop: 10,
  },
});
