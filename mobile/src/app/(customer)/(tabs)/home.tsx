import React from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useGetCustomerProfile } from '@/hooks/useProfile';
import { useGetCustomerBookingsQuery } from '@/redux/api/bookingApi';
import { useGetCategoriesQuery, useGetServicesQuery } from '@/redux/api/serviceApi';
import { useGetNotificationsQuery } from '@/redux/api/notificationApi';
import { getClayIcon } from '@/utils/iconMapper';

const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED'];

const MOCK_BOOKING_COUNTS: Record<string, number> = {
  'deep-cleaning': 248,
  'ac-repair': 195,
  'electrician': 182,
  'plumber': 165,
  'home-cleaning': 142,
  'salon-at-home': 118,
  'car-wash': 95,
  'tv-repair': 74,
  'ro-service': 62,
  'carpenter': 58,
  'laptop-repair': 45,
  'bike-repair': 38,
  'bathroom-cleaning': 34,
  'pet-care': 25,
  'painter': 18,
};

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();
  const [query, setQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [showAllCategories, setShowAllCategories] = React.useState(false);
  const profileQuery = useGetCustomerProfile();
  const bookingsQuery = useGetCustomerBookingsQuery();
  const categoriesQuery = useGetCategoriesQuery();
  const servicesQuery = useGetServicesQuery(); // Fetch all services to filter & sort by booking counts
  const notificationsQuery = useGetNotificationsQuery();

  const profile = profileQuery.data?.profile;
  const address = profileQuery.data?.addresses?.find((item) => item.isPrimary) || profileQuery.data?.addresses?.[0];
  const activeBooking = bookingsQuery.data?.data?.find((item) => !CLOSED_STATUSES.includes(item.status));
  const categories = categoriesQuery.data?.data ?? [];
  const allServices = servicesQuery.data?.data ?? [];
  const unreadNotificationsCount = notificationsQuery.data?.data?.filter((n) => !n.isRead).length || 0;

  // Sort and filter the top 6 most popular services based on mock booking counts
  const popularServices = React.useMemo(() => {
    return [...allServices]
      .filter((service) => service.isActive)
      .sort((a, b) => {
        const countA = MOCK_BOOKING_COUNTS[a.slug] || 0;
        const countB = MOCK_BOOKING_COUNTS[b.slug] || 0;
        return countB - countA;
      })
      .slice(0, 6);
  }, [allServices]);

  const isLoading = profileQuery.isLoading || bookingsQuery.isLoading || categoriesQuery.isLoading || servicesQuery.isLoading;
  const hasError = profileQuery.isError || bookingsQuery.isError || categoriesQuery.isError || servicesQuery.isError;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([profileQuery.refetch(), bookingsQuery.refetch(), categoriesQuery.refetch(), servicesQuery.refetch(), notificationsQuery.refetch()]);
    setRefreshing(false);
  };

  const search = (value = query) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push({ pathname: '/(customer)/(tabs)/search', params: { query: trimmed } });
  };

  const openCategory = (categoryId: string) => router.push({ pathname: '/(customer)/category-details', params: { categoryId } });

  if (isLoading && !profileQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      {/* 1. Curved Yellow Header Container */}
      <View style={[styles.yellowHeader, { backgroundColor: colors.primary }]}>
        {/* Row 1: Username & Actions (Menu, Logo, Notification Bell, Profile) */}
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 6 }}>
            <View>
              <Text style={[typography.caption, { color: '#64748B', fontWeight: '600' }]}>Welcome back,</Text>
              <Text numberOfLines={1} style={[typography.bodyLarge, { color: '#0F172A', fontWeight: '700' }]}>
                {profile?.fullName || 'Customer'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Pressable 
              accessibilityRole="button" 
              accessibilityLabel="Notifications" 
              onPress={() => router.push('/notifications')}
              style={styles.notificationBtn}
            >
              <Ionicons name="notifications-outline" size={22} color="#0F172A" />
              {unreadNotificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable 
              accessibilityRole="button" 
              accessibilityLabel="Profile" 
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person-circle-outline" size={26} color="#0F172A" />
            </Pressable>
          </View>
        </View>

        {/* Row 2: Location Selector */}
        <Pressable 
          onPress={() => router.push('/addresses')} 
          style={[styles.locationBtn, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}
        >
          <Ionicons name="location-sharp" size={16} color="#16A34A" />
          <Text numberOfLines={1} style={[typography.bodySmall, { color: '#0F172A', flex: 1, fontWeight: '600', marginLeft: 6 }]}>
            {address ? `${address.addressLine1}, ${address.city}` : 'Add a service address'}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </Pressable>

        {/* Row 3: Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: '#FFFFFF' }]}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput 
            value={query} 
            onChangeText={setQuery} 
            onSubmitEditing={() => search()} 
            placeholder="Search for services..." 
            placeholderTextColor="#94A3B8" 
            style={styles.searchInput} 
            returnKeyType="search" 
          />
          <Pressable 
            onPress={() => search()} 
            style={[styles.searchSubmitBtn, { backgroundColor: '#16A34A' }]}
            accessibilityRole="button" 
            accessibilityLabel="Search services"
          >
            <Text style={styles.searchSubmitText}>Search</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        {hasError && (
          <View style={[styles.notice, { backgroundColor: colors.danger + '15' }]}>
            <Text style={{ color: colors.danger }}>Could not load the latest information.</Text>
            <Pressable onPress={refresh}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* 2. Hero Promo Banner */}
        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitlePre}>Book Trusted</Text>
            <Text style={styles.promoTitle}>
              Experts <Text style={{ color: '#16A34A' }}>Near You</Text>
            </Text>
            <Text style={styles.promoSubtitle}>Quick. Reliable. Just a Tap Away!</Text>
            <Pressable style={styles.promoButton} onPress={() => search()}>
              <Text style={styles.promoButtonText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.promoRight}>
            <Image 
              source={require('../../../../assets/images/hero_banner_provider.jpg')} 
              style={styles.promoImage} 
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Active Bookings Tracker */}
        {activeBooking && (
          <Pressable 
            onPress={() => router.push({ pathname: '/(customer)/booking-details', params: { bookingId: activeBooking._id } })} 
            style={[styles.card, { backgroundColor: colors.surface, borderColor: '#FBC02D' }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[typography.h3, { color: '#0F172A' }]}>Active booking</Text>
                <Text style={[typography.bodyMedium, { color: '#0F172A', marginTop: 4, fontWeight: '600' }]}>
                  {activeBooking.serviceDetails?.name || activeBooking._id}
                </Text>
                <Text style={[typography.bodySmall, { color: '#64748B', marginTop: 2 }]}>
                  {activeBooking.status.replaceAll('_', ' ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </View>
          </Pressable>
        )}

        {/* 3. Browse Services Grid */}
        <View>
          <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700', marginBottom: 12 }]}>
            Browse Services
          </Text>
          {categories.filter((item) => item.isActive).length ? (
            <View style={styles.categoryGrid}>
              {(() => {
                const activeCats = categories.filter((item) => item.isActive);
                const needsLimit = activeCats.length > 6;
                const visibleCats = needsLimit && !showAllCategories 
                  ? activeCats.slice(0, 5) 
                  : activeCats;
                
                const rendered = visibleCats.map((category) => {
                  const clayIcon = getClayIcon(category.slug) || getClayIcon(category.icon) || getClayIcon(category.name);
                  return (
                    <Pressable 
                      key={category._id} 
                      disabled={categoriesQuery.isLoading} 
                      onPress={() => openCategory(category._id)} 
                      style={styles.categoryCard}
                    >
                      <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F5F5F7' }]}>
                        {(category.icon?.startsWith('http') || category.icon?.startsWith('data:image')) ? (
                          <Image source={{ uri: category.icon }} style={styles.categoryImage} />
                        ) : clayIcon ? (
                          <Image source={clayIcon} style={styles.categoryImage} />
                        ) : (
                          <Ionicons name={(category.icon || 'help-outline') as any} size={28} color="#16A34A" />
                        )}
                      </View>
                      <Text numberOfLines={2} style={[styles.categoryText, { color: colors.text }]}>{category.name}</Text>
                    </Pressable>
                  );
                });

                if (needsLimit) {
                  if (!showAllCategories) {
                    rendered.push(
                      <Pressable 
                        key="more-categories" 
                        onPress={() => setShowAllCategories(true)} 
                        style={styles.categoryCard}
                      >
                        <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F5F5F7' }]}>
                          <Ionicons name="apps-outline" size={28} color={isDark ? colors.secondary : '#16A34A'} />
                        </View>
                        <Text numberOfLines={1} style={[styles.categoryText, { color: isDark ? colors.secondary : '#16A34A' }]}>More</Text>
                      </Pressable>
                    );
                  } else {
                    rendered.push(
                      <Pressable 
                        key="less-categories" 
                        onPress={() => setShowAllCategories(false)} 
                        style={styles.categoryCard}
                      >
                        <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F5F5F7' }]}>
                          <Ionicons name="chevron-up-outline" size={28} color={isDark ? colors.secondary : '#16A34A'} />
                        </View>
                        <Text numberOfLines={1} style={[styles.categoryText, { color: isDark ? colors.secondary : '#16A34A' }]}>Less</Text>
                      </Pressable>
                    );
                  }
                }

                return rendered;
              })()}
            </View>
          ) : (
            <Empty text="No service categories are available in your area yet." />
          )}
        </View>

        {/* 4. Popular Services Grid */}
        <View>
          <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700', marginBottom: 12 }]}>
            Popular Services
          </Text>
          {popularServices.length ? (
            <View style={styles.categoryGrid}>
              {popularServices.map((service) => {
                const bookingCount = MOCK_BOOKING_COUNTS[service.slug] || 0;
                const clayIcon = getClayIcon(service.slug) || getClayIcon(service.icon) || getClayIcon(service.name);
                return (
                  <Pressable 
                    key={service._id} 
                    onPress={() => search(service.name)} 
                    style={styles.categoryCard}
                  >
                    <View style={styles.categoryIconContainer}>
                      {(service.icon?.startsWith('http') || service.icon?.startsWith('data:image')) ? (
                        <Image source={{ uri: service.icon }} style={styles.categoryImage} />
                      ) : clayIcon ? (
                        <Image source={clayIcon} style={styles.categoryImage} />
                      ) : (
                        <Ionicons name={(service.icon || 'flash-outline') as any} size={24} color="#16A34A" />
                      )}
                    </View>
                    <Text numberOfLines={1} style={styles.categoryText}>{service.name}</Text>
                    <Text style={styles.bookingCountText}>{bookingCount} booked</Text>
                    <Ionicons name="chevron-forward" size={10} color="#94A3B8" style={styles.categoryChevron} />
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Empty text="No popular services are available yet." />
          )}
        </View>

        {/* 5. Value Propositions / Highlights */}
        <View style={styles.propsRow}>
          <View style={[styles.propCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
            <View style={[styles.propIconContainer, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            </View>
            <Text style={styles.propTitle}>Verified Professionals</Text>
            <Text style={styles.propDesc}>Background checked & trusted experts</Text>
          </View>
          
          <View style={[styles.propCard, { backgroundColor: '#FFFDF0', borderColor: '#FEF08A' }]}>
            <View style={[styles.propIconContainer, { backgroundColor: 'rgba(251, 192, 45, 0.15)' }]}>
              <Ionicons name="pricetag" size={18} color="#16A34A" />
            </View>
            <Text style={styles.propTitle}>Affordable Pricing</Text>
            <Text style={styles.propDesc}>Best prices with no hidden charges</Text>
          </View>

          <View style={[styles.propCard, { backgroundColor: '#FFFDF0', borderColor: '#FEF08A' }]}>
            <View style={[styles.propIconContainer, { backgroundColor: 'rgba(251, 192, 45, 0.15)' }]}>
              <Ionicons name="headset" size={18} color="#16A34A" />
            </View>
            <Text style={styles.propTitle}>24/7 Support</Text>
            <Text style={styles.propDesc}>We're here to help you anytime</Text>
          </View>
        </View>

        {/* Quick Actions (Bottom Links) */}
        <View style={styles.actions}>
          <Action label="Bookings" icon="calendar-outline" onPress={() => router.push('/bookings')} />
          <Action label="Wallet" icon="wallet-outline" onPress={() => router.push('/wallet')} />
          <Action label="Support" icon="help-circle-outline" onPress={() => router.push('/support')} />
        </View>
      </View>
    </ScrollView>
  );
}

function Empty({ text }: { text: string }) { 
  return <Text style={{ color: '#64748B', marginTop: 4, fontSize: 13 }}>{text}</Text>; 
}

function Action({ label, icon, onPress }: { label: string; icon: any; onPress: () => void }) { 
  return (
    <Pressable onPress={onPress} style={styles.action}>
      <View style={styles.actionIconContainer}>
        <Ionicons name={icon} size={22} color="#16A34A" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  ); 
}

const styles = StyleSheet.create({ 
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  }, 
  content: { 
    paddingBottom: 48 
  }, 
  yellowHeader: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16
  }, 
  headerActions: { 
    flexDirection: 'row', 
    gap: 14, 
    alignItems: 'center' 
  }, 
  notificationBtn: {
    position: 'relative',
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FBC02D',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  locationBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 14, 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  }, 
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 16, 
    paddingLeft: 12, 
    paddingRight: 6,
    height: 52,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  }, 
  searchInput: { 
    flex: 1, 
    height: '100%',
    color: '#0F172A',
    marginLeft: 8,
    fontSize: 14,
  }, 
  searchSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  notice: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 12, 
    borderRadius: 12,
  }, 
  promoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 18,
    overflow: 'hidden',
    height: 140,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  promoLeft: {
    flex: 1.1,
    padding: 16,
    justifyContent: 'center',
  },
  promoRight: {
    flex: 0.9,
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  promoTitlePre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 10,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  card: { 
    padding: 16, 
    borderWidth: 1, 
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  }, 
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  }, 
  categoryCard: { 
    width: '31.3%', 
    marginHorizontal: '1%',
    marginBottom: 16,
    alignItems: 'center', 
    justifyContent: 'flex-start',
  }, 
  categoryIconContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: { 
    width: '80%', 
    height: '80%', 
    resizeMode: 'contain',
    borderRadius: 12,
  }, 
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  bookingCountText: {
    fontSize: 8,
    color: '#16A34A',
    marginTop: 2,
    fontWeight: '700',
  },
  categoryChevron: {
    position: 'absolute',
    right: 6,
    bottom: 6,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    borderBottomWidth: StyleSheet.hairlineWidth 
  }, 
  propsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  propCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  propIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  propTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  propDesc: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 10,
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
  }, 
  action: { 
    alignItems: 'center', 
    gap: 4 
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  }
});
