import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useGetCategoriesQuery, useGetServicesQuery } from '@/redux/api/serviceApi';
import { getClayIcon } from '@/utils/iconMapper';

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  
  const validId = typeof categoryId === 'string' && /^[a-f\d]{24}$/i.test(categoryId);
  const categoriesQuery = useGetCategoriesQuery();
  const servicesQuery = useGetServicesQuery(
    { categoryId: categoryId ?? '' }, 
    { skip: !validId }
  );

  const category = categoriesQuery.data?.data?.find((item) => item._id === categoryId);
  const services = servicesQuery.data?.data ?? [];

  const isLoading = categoriesQuery.isLoading || servicesQuery.isLoading;
  const hasError = categoriesQuery.isError || servicesQuery.isError || (validId && !isLoading && !category);

  const retry = () => {
    categoriesQuery.refetch();
    if (validId) servicesQuery.refetch();
  };

  if (!validId) {
    return <Unavailable onBack={() => router.back()} message="Invalid category selection." />;
  }

  if (isLoading && !categoriesQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (hasError) {
    return <Unavailable onBack={() => router.back()} retry={retry} message="Could not load the category services." />;
  }

  const getCategoryImageSource = () => {
    if (category?.bannerImage) {
      return { uri: category.bannerImage };
    }
    if (category?.icon?.startsWith('http') || category?.icon?.startsWith('data:image')) {
      return { uri: category.icon };
    }
    const categoryClayIcon = getClayIcon(category?.slug) || getClayIcon(category?.icon) || getClayIcon(category?.name);
    if (categoryClayIcon) {
      return categoryClayIcon;
    }
    return require('../../../assets/images/hero_banner_provider.jpg');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Floating Transparent Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 12 }]}>
        <Pressable 
          onPress={() => router.back()} 
          accessibilityRole="button" 
          accessibilityLabel="Back"
          style={styles.floatingHeaderButton}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
      </View>

      <ScrollView 
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Banner Image */}
        <Image 
          source={getCategoryImageSource()} 
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* Content Section overlapping the banner */}
        <View style={[styles.contentCard, { 
          backgroundColor: colors.background,
        }]}>
          
          {/* Category Info Title & Desc */}
          <View style={styles.categoryInfoRow}>
            <Text style={[typography.h1, { color: colors.text, fontWeight: '800' }]}>
              {category?.name}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8, lineHeight: 20 }]}>
              {category?.description || 'Explore services matching this category.'}
            </Text>
          </View>

        {/* Services List Grouped by Sub-section */}
        {(() => {
          const activeServices = services.filter((item) => item.isActive);
          if (!activeServices.length) {
            return (
              <View style={styles.emptyContainer}>
                <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No services are available in this category yet.
                </Text>
              </View>
            );
          }

          // Dynamic client-side grouping function based on category slug
          const getServiceGroups = (categorySlug: string | undefined, servicesList: any[]) => {
            const groups: { [key: string]: any[] } = {};
            const normalizedSlug = categorySlug || '';
            
            if (normalizedSlug === 'appliances-repair' || normalizedSlug === 'appliances' || normalizedSlug.includes('appliance')) {
              const largeAppliances = ['ac', 'washing', 'refrigerator', 'fridge', 'television', 'tv', 'oven'];
              groups['Large appliances'] = [];
              groups['Other appliances'] = [];
              
              servicesList.forEach(service => {
                const nameLower = service.name.toLowerCase();
                const isLarge = largeAppliances.some(term => nameLower.includes(term));
                if (isLarge) {
                  groups['Large appliances'].push(service);
                } else {
                  groups['Other appliances'].push(service);
                }
              });
            } else if (normalizedSlug === 'home-services' || normalizedSlug.includes('electrician') || normalizedSlug.includes('plumber') || normalizedSlug.includes('carpenter') || normalizedSlug.includes('repair')) {
              groups['Home repairs'] = [];
              groups['Home installation'] = [];
              
              servicesList.forEach(service => {
                const nameLower = service.name.toLowerCase();
                if (nameLower.includes('install') || nameLower.includes('setup') || nameLower.includes('assembly') || nameLower.includes('fitting') || nameLower.includes('geyser service') || nameLower.includes('mount')) {
                  groups['Home installation'].push(service);
                } else {
                  groups['Home repairs'].push(service);
                }
              });
            } else {
              groups[category?.name || 'All Services'] = servicesList;
            }
            
            return Object.entries(groups)
              .filter(([_, items]) => items.length > 0)
              .map(([title, items]) => ({ title, items }));
          };

          const serviceGroups = getServiceGroups(category?.slug, activeServices);

          return (
            <View style={{ marginTop: spacing.md }}>
              {serviceGroups.map((group) => (
                <View key={group.title} style={styles.groupContainer}>
                  <Text style={[styles.groupTitle, { color: colors.text }]}>
                    {group.title}
                  </Text>
                  <View style={styles.servicesGrid}>
                    {group.items.map((service) => {
                      const serviceClayIcon = getClayIcon(service.slug) || getClayIcon(service.icon) || getClayIcon(service.name);
                      return (
                        <Pressable 
                          key={service._id} 
                          onPress={() => router.push({ pathname: '/(customer)/(tabs)/search', params: { serviceId: service._id } })} 
                          style={[styles.serviceGridCard, { 
                            backgroundColor: colors.surface,
                            borderColor: colors.border
                          }]}
                        >
                          <View style={[styles.gridImageContainer, { 
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC' 
                          }]}>
                            {(() => {
                              if (service.icon?.startsWith('http') || service.icon?.startsWith('data:image')) {
                                return <Image source={{ uri: service.icon }} style={styles.gridImage} />;
                              }
                              if (serviceClayIcon) {
                                return <Image source={serviceClayIcon} style={styles.gridImage} />;
                              }
                              return (
                                <Ionicons 
                                  name={(service.icon || 'flash') as any} 
                                  size={32} 
                                  color={isDark ? colors.secondary : '#16A34A'} 
                                />
                              );
                            })()}
                            
                            {/* Duration Overlay Badge */}
                            {service.estimatedDuration && (
                              <View style={[styles.gridTimeBadge, { 
                                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                borderColor: isDark ? colors.border : '#E4E4E7' 
                              }]}>
                                <Text style={styles.gridTimeText}>
                                  {service.estimatedDuration} mins
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          <Text numberOfLines={2} style={[styles.gridServiceName, { color: colors.text }]}>
                            {service.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          );
        })()}
        </View>
      </ScrollView>
    </View>
  );
}

function Unavailable({ onBack, retry, message }: { onBack: () => void; retry?: () => unknown; message: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12, color: colors.text }}>{message}</Text>
      {retry && (
        <Pressable onPress={retry} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Retry</Text>
        </Pressable>
      )}
      <Pressable onPress={onBack} style={styles.backLink}>
        <Text style={{ color: colors.secondary, fontWeight: '700' }}>Go Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 28 
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  floatingHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  floatingHeaderTitle: {
    color: '#0F172A',
    fontWeight: '800',
  },
  bannerImage: {
    width: '100%',
    height: 280,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  contentCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 24,
    flex: 1,
  },
  categoryInfoRow: {
    marginBottom: 20,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  },
  serviceGridCard: {
    width: '31.3%',
    marginHorizontal: '1%',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: 12,
  },
  gridTimeBadge: {
    position: 'absolute',
    bottom: 4,
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  gridTimeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#16A34A',
  },
  gridServiceName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  backLink: {
    marginTop: 14,
    padding: 8,
  }
});
