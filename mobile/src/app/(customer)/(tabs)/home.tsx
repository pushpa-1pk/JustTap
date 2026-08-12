import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Share,
  Clipboard,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGetCustomerProfile } from '@/hooks/useProfile';
import { useGetCustomerBookingsQuery, useCancelBookingMutation } from '@/redux/api/bookingApi';
import { useGetCategoriesQuery, useGetServicesQuery } from '@/redux/api/serviceApi';
import SvgIcon from '@/components/common/SvgIcon';
import Shimmer from '@/components/common/Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spacing System (8pt Grid override/extension)
const GRID = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  radiusCard: 22,
};

// Premium Colors based on specs
const BRAND_COLORS = {
  primary: '#FFFFFF',
  secondary: '#FFF9F0',
  sectionBg: '#F8F8F6',
  greenAction: '#16A34A',
  yellowAccent: '#FBBF24',
  darkText: '#0F172A',
  secondaryText: '#64748B',
  divider: '#E5E7EB',
};

// Custom Scale Pressable for Apple-like tap micro-interactions
const ScalePressable = ({ onPress, style, children, disabled }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress();
      }}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function CustomerHomeScreen() {
  const { colors, typography, border } = useTheme();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  // React Query Hooks
  const { data: profileRes, isLoading: isProfileLoading, refetch: refetchProfile } = useGetCustomerProfile();
  const { data: bookingsRes, isLoading: isBookingsLoading, refetch: refetchBookings } = useGetCustomerBookingsQuery();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const { data: categoriesRes, isLoading: isCategoriesLoading, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: servicesRes, isLoading: isServicesLoading, refetch: refetchServices } = useGetServicesQuery();

  const dbCategories = categoriesRes?.data || [];
  const dbServices = servicesRes?.data || [];

  const profile = profileRes?.profile;
  const addresses = profileRes?.addresses || [];
  const bookings = bookingsRes?.data || [];

  // Filter for active (ongoing) bookings
  const activeBookings = bookings.filter(
    (b) => !['COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED'].includes(b.status)
  );
  const ongoingBooking = activeBookings[0]; // Take the first active one

  // Screen UI State Control
  const [refreshing, setRefreshing] = useState(false);
  const [devState, setDevState] = useState<'normal' | 'loading' | 'no-internet' | 'no-providers' | 'no-bookings' | 'no-notifications'>('normal');
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  // Search Flow States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Plumber', 'AC Repair', 'Deep Cleaning']);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Dialog States
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyCategory, setEmergencyCategory] = useState<'electrical' | 'plumbing' | 'appliance' | null>(null);
  const [isEmergencyBookingInProgress, setIsEmergencyBookingInProgress] = useState(false);

  // Category Grid Expand/Collapse State
  const [isGridExpanded, setIsGridExpanded] = useState(false);

  // Auto Banner Carousel Page State
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);

  // Coupon Expiry Timer Mock (10 minutes)
  const [couponTimeLeft, setCouponTimeLeft] = useState('09:59');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Promise.all([refetchProfile(), refetchBookings(), refetchCategories(), refetchServices()]);
    setRefreshing(false);
  }, [refetchProfile, refetchBookings, refetchCategories, refetchServices]);

  // Countdown timer effect
  useEffect(() => {
    let totalSeconds = 599; // 9 min 59 sec
    const timer = setInterval(() => {
      if (totalSeconds <= 0) {
        clearInterval(timer);
        return;
      }
      totalSeconds--;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setCouponTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Banner Auto Scroll Timer
  useEffect(() => {
    if (devState !== 'normal') return;
    const bannerTimer = setInterval(() => {
      let nextIndex = (activeBannerIndex + 1) % 3;
      setActiveBannerIndex(nextIndex);
      bannerFlatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 4000);
    return () => clearInterval(bannerTimer);
  }, [activeBannerIndex, devState]);

  // Mock Data Definitions
  const categoriesList = [
    { name: 'Electrician', icon: 'flash', price: '₹199', eta: '10 mins', rating: '★ 4.9' },
    { name: 'Plumber', icon: 'water', price: '₹249', eta: '12 mins', rating: '★ 4.8' },
    { name: 'AC Repair', icon: 'snow', price: '₹399', eta: '15 mins', rating: '★ 4.9' },
    { name: 'Carpenter', icon: 'hammer', price: '₹299', eta: '20 mins', rating: '★ 4.7' },
    { name: 'Home Cleaning', icon: 'brush', price: '₹499', eta: '25 mins', rating: '★ 4.8' },
    { name: 'Salon at Home', icon: 'cut', price: '₹599', eta: '30 mins', rating: '★ 4.9' },
    { name: 'Pet Care', icon: 'paw', price: '₹349', eta: '18 mins', rating: '★ 4.8' },
    { name: 'TV Repair', icon: 'tv', price: '₹199', eta: '15 mins', rating: '★ 4.7' },
    // Expanded categories
    { name: 'RO Service', icon: 'beer', price: '₹299', eta: '15 mins', rating: '★ 4.8' },
    { name: 'Pest Control', icon: 'bug', price: '₹699', eta: '35 mins', rating: '★ 4.9' },
    { name: 'Laptop Repair', icon: 'desktop', price: '₹499', eta: '30 mins', rating: '★ 4.8' },
    { name: 'Car Wash', icon: 'car', price: '₹299', eta: '20 mins', rating: '★ 4.7' },
    { name: 'Bike Repair', icon: 'bicycle', price: '₹249', eta: '18 mins', rating: '★ 4.8' },
    { name: 'Tutor at Home', icon: 'book', price: '₹499', eta: '45 mins', rating: '★ 4.9' },
  ];

  const quickActions = [
    { title: 'Book Again', icon: 'refresh', action: () => router.push('/search') },
    { title: 'Emergency', icon: 'alert-circle', color: '#DC2626', action: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setIsEmergencyModalOpen(true); } },
    { title: 'Track Active', icon: 'locate', action: () => router.push('/bookings') },
    { title: 'Offers', icon: 'gift', action: () => router.push('/coupons') },
    { title: 'Wallet', icon: 'wallet', action: () => router.push('/wallet') },
    { title: 'Refer Friend', icon: 'people', action: () => router.push('/referrals') },
  ];

  const bannerOffers = [
    { id: 1, title: '20% OFF Home Cleaning', desc: 'Monsoon Special Sparkle Upgrade', code: 'CLEAN20', color: '#FFF9F0', textCol: '#0F172A' },
    { id: 2, title: 'Instant AC Servicing @ ₹399', desc: 'Verified specialists at your doorstep', code: 'ACCOOL', color: '#E0F2FE', textCol: '#0369A1' },
    { id: 3, title: 'First Booking Flat ₹100 Off', desc: 'Tap and experience premium home care', code: 'JUST100', color: '#F0FDF4', textCol: '#16A34A' }
  ];

  const nearbyPros = [
    { id: 'prov-1', name: 'Vikram Singh', service: 'AC Repair', rating: '4.9', completed: '240', dist: '1.2 km', eta: '8 mins', price: '399', img: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120', online: true },
    { id: 'prov-2', name: 'Ramesh Kumar', service: 'Electrician', rating: '4.8', completed: '1,120', dist: '1.8 km', eta: '11 mins', price: '199', img: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=120', online: true },
    { id: 'prov-3', name: 'Sunita Sharma', service: 'Salon at Home', rating: '4.95', completed: '480', dist: '2.5 km', eta: '15 mins', price: '599', img: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?w=120', online: true },
  ];

  const popularServices = [
    { title: 'Sofa Deep Cleaning', price: '₹799', bookings: '1.2k booked this week', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150' },
    { title: 'Bathroom Scrubbing', price: '₹299', bookings: '920 booked today', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150' },
    { title: 'Switchboard Fixing', price: '₹149', bookings: '1.5k booked this week', img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=150' }
  ];

  const featuredAgencies = [
    { title: 'Super Clean Corp', rating: '4.9', exp: '8 Yrs Experience', spec: 'Deep Sanitization Experts', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500', verified: true }
  ];

  const testimonials = [
    { name: 'Ananya Gupta', quote: '"Vikram fixed my AC in just 10 mins. Absolutely stunning service!"', rating: 5, service: 'AC Repair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { name: 'Rahul Malhotra', quote: '"The plumber arrived so fast, I was shocked. Booking on JustTap is too easy!"', rating: 5, service: 'Plumber', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
  ];

  const couponsList = [
    { code: 'TAPGOLD', discount: 'Flat ₹150 Off', terms: 'Min Booking value ₹499' },
    { code: 'SAFETYFIRST', discount: 'Free Sanitization', terms: 'Applicable on Home Cleaning' }
  ];

  // handle suggestions trigger
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setSearchSuggestions(['AC Gas Refill', 'Bathroom Cleaning', 'Emergency Plumber', 'Full House Painting']);
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    const activeList = dbServices.length > 0 ? dbServices : categoriesList;
    if (!text) {
      setSearchSuggestions(['AC Gas Refill', 'Bathroom Cleaning', 'Emergency Plumber', 'Full House Painting']);
    } else {
      const filtered = activeList
        .map(c => c.name)
        .filter(name => name.toLowerCase().includes(text.toLowerCase()));
      setSearchSuggestions(filtered);
    }
  };

  const handleApplySuggestion = (query: string) => {
    setSearchQuery(query);
    setIsSearchFocused(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to search screen with params
    router.push({
      pathname: '/(customer)/(tabs)/search',
      params: { query }
    });
  };

  const handleCopyCoupon = (code: string) => {
    Clipboard.setString(code);
    setCopiedCoupon(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  const handleCancelBooking = (bookingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    cancelBooking({
      id: bookingId,
      reasonCode: 'CUSTOMER_CANCELLED',
      customExplanation: 'Cancelled from home screen quick action',
    })
      .unwrap()
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refetchBookings();
      })
      .catch((err) => {
        console.error('Cancel booking failed:', err);
      });
  };

  // Emergency Booking dispatch simulation
  const handleTriggerEmergencyBooking = () => {
    if (!emergencyCategory) return;
    setIsEmergencyBookingInProgress(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsEmergencyBookingInProgress(false);
      setIsEmergencyModalOpen(false);
      setEmergencyCategory(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetchBookings(); // Pull new active booking dispatch
      router.push('/bookings');
    }, 2000);
  };

  // State Switcher Layout Renderers
  if (devState === 'loading' || isProfileLoading || isBookingsLoading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: BRAND_COLORS.primary }]} showsVerticalScrollIndicator={false}>
        {/* Shimmer header */}
        <View style={styles.header}>
          <View>
            <Shimmer width={150} height={26} borderRadius={4} />
            <Shimmer width={180} height={18} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
          <Shimmer width={44} height={44} borderRadius={14} />
        </View>

        <Shimmer width={'100%'} height={60} borderRadius={18} style={{ marginTop: GRID.lg }} />
        <Shimmer width={'100%'} height={52} borderRadius={14} style={{ marginTop: GRID.lg }} />
        
        {/* Shimmer carousel */}
        <Shimmer width={'100%'} height={150} borderRadius={GRID.radiusCard} style={{ marginTop: GRID.xl }} />

        {/* Shimmer Grid */}
        <Text style={[typography.h3, { color: BRAND_COLORS.darkText, marginTop: GRID.xl, marginBottom: GRID.md }]}>Services</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ width: '48%', height: 110, borderRadius: 20, backgroundColor: '#F8F8F6', padding: 12 }}>
              <Shimmer width={40} height={40} borderRadius={8} />
              <Shimmer width={'80%'} height={14} borderRadius={4} style={{ marginTop: 12 }} />
              <Shimmer width={'50%'} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
        <Shimmer width={120} height={36} borderRadius={18} style={{ alignSelf: 'center', marginTop: GRID.lg }} />
        {renderDevMenu()}
      </ScrollView>
    );
  }

  if (devState === 'no-internet') {
    return renderEmptyState(
      'cloud-offline-outline',
      'No Internet Connection',
      'Operating in disconnected mode. Please check your cellular data or Wi-Fi settings.',
      'Retry Connection',
      () => {
        setDevState('normal');
        onRefresh();
      }
    );
  }

  if (devState === 'no-providers') {
    return renderEmptyState(
      'people-outline',
      'No Providers Available',
      'All local service professionals in your area are currently booked out. We are expanding rapidly!',
      'Notify Me When Free',
      () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDevState('normal');
      }
    );
  }

  if (devState === 'no-bookings') {
    return renderEmptyState(
      'calendar-outline',
      'No Active Bookings',
      'You do not have any pending or ongoing jobs scheduled. Tap below to find the nearest provider.',
      'Book a Service Now',
      () => setDevState('normal')
    );
  }

  if (devState === 'no-notifications') {
    return renderEmptyState(
      'notifications-off-outline',
      'No New Notifications',
      'You are all caught up! Updates about your bookings and exclusive discounts will show up here.',
      'Go Back Home',
      () => setDevState('normal')
    );
  }

  // --- Normal Dashboard Render ---
  return (
    <View style={{ flex: 1, backgroundColor: BRAND_COLORS.primary }}>
      {/* Search Focused Suggestions Overlay */}
      {isSearchFocused && (
        <View style={styles.searchOverlayContainer}>
          <View style={[styles.searchHeader, { borderBottomColor: BRAND_COLORS.divider }]}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color={BRAND_COLORS.secondaryText} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: BRAND_COLORS.darkText }]}
                placeholder="Search services..."
                placeholderTextColor={BRAND_COLORS.secondaryText}
                autoFocus
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => handleSearchQueryChange('')}>
                  <Ionicons name="close-circle" size={20} color={BRAND_COLORS.secondaryText} style={{ marginRight: 8 }} />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => {
                setIsSearchFocused(false);
                setSearchQuery('');
              }}
              style={styles.cancelSearchText}
            >
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.greenAction, fontWeight: '700' }]}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1, padding: GRID.lg }}>
            {recentSearches.length > 0 && searchQuery.length === 0 && (
              <View style={{ marginBottom: GRID.xl }}>
                <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>Recent Searches</Text>
                {recentSearches.map((item) => (
                  <View key={item} style={styles.suggestionRow}>
                    <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => handleApplySuggestion(item)}>
                      <Ionicons name="time-outline" size={18} color={BRAND_COLORS.secondaryText} style={{ marginRight: GRID.sm }} />
                      <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText }]}>{item}</Text>
                    </Pressable>
                    <Pressable onPress={() => setRecentSearches(recentSearches.filter(s => s !== item))}>
                      <Ionicons name="close" size={18} color={BRAND_COLORS.secondaryText} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>
              {searchQuery.length > 0 ? 'Suggested Matches' : 'Popular Services'}
            </Text>
            {searchSuggestions.map((item) => (
              <Pressable key={item} style={styles.suggestionRow} onPress={() => handleApplySuggestion(item)}>
                <Ionicons name="trending-up-outline" size={18} color={BRAND_COLORS.greenAction} style={{ marginRight: GRID.sm }} />
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '500' }]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={[styles.container, { backgroundColor: BRAND_COLORS.primary }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLORS.greenAction} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky Ongoing Booking Card */}
        {ongoingBooking && (
          <View style={[styles.stickyBookingCard, { backgroundColor: BRAND_COLORS.darkText }]}>
            <View style={styles.stickyBookingHeader}>
              <View style={styles.stickyBookingProfile}>
                <Ionicons name="construct" size={16} color={BRAND_COLORS.yellowAccent} />
                <Text style={[typography.bodySmall, { color: '#FFFFFF', fontWeight: '800', marginLeft: 6 }]}>
                  {ongoingBooking.providerSnapshot?.businessName || 'Assigned Provider'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: BRAND_COLORS.greenAction }]}>
                <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '800' }]}>
                  {ongoingBooking.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.stickyBookingBody}>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, fontSize: 13 }]}>
                Booking BK-{(ongoingBooking._id || '').slice(-5).toUpperCase()} • Instantly Dispatching
              </Text>
              <Text style={[typography.bodyLarge, { color: '#FFFFFF', fontWeight: '800', marginTop: 4 }]}>
                Arriving in 12 mins • ETA confirmed
              </Text>
            </View>

            <View style={styles.stickyBookingActions}>
              <ScalePressable
                onPress={() => router.push({ pathname: '/(customer)/booking-details', params: { bookingId: ongoingBooking._id } })}
                style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              >
                <Text style={[typography.bodySmall, { color: '#FFFFFF', fontWeight: '700' }]}>Track Live</Text>
              </ScalePressable>
              
              {ongoingBooking.providerSnapshot?.phone && (
                <ScalePressable
                  onPress={() => {}} // Call trigger
                  style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                >
                  <Text style={[typography.bodySmall, { color: '#FFFFFF', fontWeight: '700' }]}>Call</Text>
                </ScalePressable>
              )}

              <ScalePressable
                onPress={() => handleCancelBooking(ongoingBooking._id)}
                style={[styles.actionBtn, { backgroundColor: 'rgba(220,38,38,0.2)' }]}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={[typography.bodySmall, { color: '#EF4444', fontWeight: '700' }]}>Cancel</Text>
                )}
              </ScalePressable>
            </View>
          </View>
        )}

        {/* TOP APP BAR */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, fontWeight: '600' }]}>Good Morning 👋</Text>
            <Text style={[typography.h1, { color: BRAND_COLORS.darkText, fontSize: 26, fontWeight: '800', marginTop: 2 }]}>
              {profile?.fullName || user?.phone || 'Guest'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <ScalePressable style={styles.headerIconButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={BRAND_COLORS.darkText} />
              <View style={styles.notificationBadge} />
            </ScalePressable>
            <ScalePressable style={styles.headerIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: profile?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                style={styles.profilePic}
              />
            </ScalePressable>
          </View>
        </View>

        {/* LOCATION SECTION */}
        <View style={[styles.locationCard, { backgroundColor: BRAND_COLORS.sectionBg }]}>
          <View style={styles.locationInfo}>
            <View style={styles.locationPin}>
              <Ionicons name="location-sharp" size={20} color={BRAND_COLORS.greenAction} />
            </View>
            <View style={{ flex: 1, marginLeft: GRID.sm }}>
              <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, fontWeight: '800', letterSpacing: 0.5 }]}>
                📍 CURRENT LOCATION
              </Text>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700', marginTop: 2 }]} numberOfLines={1}>
                {addresses.find(a => a.isPrimary)?.addressLine1 || 'Mumbai, Maharashtra, India'}
              </Text>
              <Text style={[typography.caption, { color: BRAND_COLORS.greenAction, fontWeight: '700', marginTop: 1 }]}>
                Nearest provider: 8 mins away
              </Text>
            </View>
          </View>
          <ScalePressable style={[styles.changeLocBtn, { backgroundColor: '#FFFFFF' }]} onPress={() => router.push('/addresses')}>
            <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Change</Text>
          </ScalePressable>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchOuterBar}>
          <Pressable style={styles.searchBarInner} onPress={handleSearchFocus}>
            <Ionicons name="search" size={20} color={BRAND_COLORS.darkText} />
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginLeft: GRID.sm, flex: 1 }]}>
              Search services...
            </Text>
            <ScalePressable style={styles.searchActionBtn} onPress={() => setIsVoiceSearchOpen(true)}>
              <Ionicons name="mic-outline" size={20} color={BRAND_COLORS.darkText} />
            </ScalePressable>
            <View style={styles.searchBarDivider} />
            <ScalePressable style={styles.searchActionBtn} onPress={() => setIsFilterModalOpen(true)}>
              <Ionicons name="options-outline" size={20} color={BRAND_COLORS.darkText} />
            </ScalePressable>
          </Pressable>
        </View>

        {/* PROMOTIONAL BANNER CAROUSEL */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={bannerFlatListRef}
            data={bannerOffers}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveBannerIndex(newIndex);
            }}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[styles.carouselSlide, { backgroundColor: item.color, width: SCREEN_WIDTH - 48 }]}>
                <View style={{ flex: 1, paddingRight: 60 }}>
                  <Text style={[typography.h2, { color: item.textCol, fontSize: 18, fontWeight: '800' }]}>
                    {item.title}
                  </Text>
                  <Text style={[typography.bodySmall, { color: BRAND_COLORS.secondaryText, marginTop: 4 }]}>
                    {item.desc}
                  </Text>
                  <View style={[styles.promoCodeBadge, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[typography.caption, { color: item.textCol, fontWeight: '800' }]}>
                      Code: {item.code}
                    </Text>
                  </View>
                </View>
                <ScalePressable
                  style={[styles.carouselCta, { backgroundColor: BRAND_COLORS.yellowAccent }]}
                  onPress={() => router.push('/search')}
                >
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    Book Now
                  </Text>
                </ScalePressable>
              </View>
            )}
          />
          <View style={styles.carouselIndicators}>
            {bannerOffers.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.carouselDot,
                  { backgroundColor: i === activeBannerIndex ? BRAND_COLORS.greenAction : BRAND_COLORS.divider }
                ]}
              />
            ))}
          </View>
        </View>

        {/* SERVICE GRID */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Services Grid</Text>
        </View>
        <View style={styles.serviceGrid}>
          {(dbServices.length > 0 ? dbServices : categoriesList).slice(0, isGridExpanded ? (dbServices.length > 0 ? dbServices.length : categoriesList.length) : 8).map((cat: any) => {
            const isDbItem = !!cat._id;
            const priceStr = isDbItem ? `₹${cat.pricing?.basePrice || 199}` : cat.price;
            const iconName = isDbItem ? (cat.icon || 'briefcase') : cat.icon;
            const etaStr = isDbItem ? '10 mins' : cat.eta;
            const ratingStr = isDbItem ? '★ 4.8' : cat.rating;

            return (
              <ScalePressable
                key={cat._id || cat.name}
                style={[styles.serviceCard, { backgroundColor: '#FFFFFF', borderColor: BRAND_COLORS.divider }]}
                onPress={() => handleApplySuggestion(cat.name)}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: BRAND_COLORS.secondary }]}>
                  <Ionicons name={iconName as any} size={28} color={BRAND_COLORS.yellowAccent} />
                </View>
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: 8 }]} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={[typography.caption, { color: BRAND_COLORS.greenAction, fontWeight: '700', marginTop: 2 }]}>
                  Starting {priceStr}
                </Text>
                <View style={styles.serviceCardFooter}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>{etaStr}</Text>
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>{ratingStr}</Text>
                </View>
              </ScalePressable>
            );
          })}
        </View>
        <ScalePressable
          style={[styles.showMoreBtn, { borderColor: BRAND_COLORS.divider }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsGridExpanded(!isGridExpanded);
          }}
        >
          <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700', marginRight: 4 }]}>
            {isGridExpanded ? 'Show Less' : 'Show More'}
          </Text>
          <Ionicons name={isGridExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={BRAND_COLORS.darkText} />
        </ScalePressable>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Quick Actions</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
          {quickActions.map((action) => (
            <ScalePressable
              key={action.title}
              style={[styles.quickActionCard, { backgroundColor: action.color ? action.color + '15' : '#FFFFFF', borderColor: action.color || BRAND_COLORS.divider }]}
              onPress={action.action}
            >
              <Ionicons name={action.icon as any} size={24} color={action.color || BRAND_COLORS.darkText} />
              <Text style={[typography.bodySmall, { color: action.color || BRAND_COLORS.darkText, fontWeight: '700', marginTop: 6 }]}>
                {action.title}
              </Text>
            </ScalePressable>
          ))}
        </ScrollView>

        {/* NEARBY PROFESSIONALS */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Nearby Professionals</Text>
          <Pressable onPress={() => router.push('/search')}>
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.greenAction, fontWeight: '700' }]}>See all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
          {nearbyPros.map((pro) => (
            <View key={pro.id} style={[styles.nearbyProCard, { backgroundColor: '#FFFFFF', borderColor: BRAND_COLORS.divider }]}>
              <View style={styles.proAvatarRow}>
                <Image source={{ uri: pro.img }} style={styles.proAvatar} />
                {pro.online && <View style={[styles.onlineDot, { backgroundColor: BRAND_COLORS.greenAction }]} />}
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={BRAND_COLORS.greenAction} />
                </View>
              </View>

              <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: GRID.sm }]} numberOfLines={1}>
                {pro.name}
              </Text>
              <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]} numberOfLines={1}>
                ★ {pro.rating} ({pro.completed} Jobs)
              </Text>

              <View style={styles.proCardFooter}>
                <View>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>
                    {pro.dist} • {pro.eta}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: BRAND_COLORS.greenAction, fontWeight: '800', marginTop: 2 }]}>
                    From ₹{pro.price}
                  </Text>
                </View>
                <ScalePressable
                  style={[styles.proBookBtn, { backgroundColor: BRAND_COLORS.yellowAccent }]}
                  onPress={() => router.push({
                    pathname: '/(customer)/provider-details',
                    params: {
                      providerId: pro.id,
                      providerServiceId: pro.id + '-service',
                      businessName: pro.name,
                      price: pro.price,
                      rating: pro.rating,
                      experience: '6',
                      distance: '1.2',
                      serviceId: 'cleaning',
                      serviceName: pro.service
                    }
                  })}
                >
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    Book
                  </Text>
                </ScalePressable>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* POPULAR SERVICES */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Popular Services</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
          {popularServices.map((service) => (
            <View key={service.title} style={[styles.popularCard, { backgroundColor: '#FFFFFF', borderColor: BRAND_COLORS.divider }]}>
              <Image source={{ uri: service.img }} style={styles.popularImg} />
              <View style={{ padding: GRID.sm }}>
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]} numberOfLines={1}>
                  {service.title}
                </Text>
                <Text style={[typography.caption, { color: BRAND_COLORS.greenAction, fontWeight: '800', marginTop: 2 }]}>
                  Starting {service.price}
                </Text>
                <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 1 }]}>
                  {service.bookings}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* FEATURED PROVIDERS */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Featured Provider</Text>
        </View>
        {featuredAgencies.map((agency) => (
          <View key={agency.title} style={[styles.featuredCard, { backgroundColor: '#FFFFFF', borderColor: BRAND_COLORS.divider }]}>
            <Image source={{ uri: agency.img }} style={styles.featuredImg} />
            <View style={styles.featuredBadge}>
              <Ionicons name="ribbon" size={16} color={BRAND_COLORS.yellowAccent} />
              <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800', marginLeft: 4 }]}>FEATURED</Text>
            </View>
            <View style={styles.featuredContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>{agency.title}</Text>
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>★ {agency.rating}</Text>
              </View>
              <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]}>
                {agency.exp} • {agency.spec}
              </Text>
              <ScalePressable
                style={[styles.featuredBtn, { backgroundColor: BRAND_COLORS.darkText }]}
                onPress={() => router.push('/search')}
              >
                <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '800' }]}>View Profile</Text>
              </ScalePressable>
            </View>
          </View>
        ))}

        {/* CUSTOMER REVIEWS */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Customer Reviews</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
          {testimonials.map((test) => (
            <View key={test.name} style={[styles.testimonialCard, { backgroundColor: BRAND_COLORS.sectionBg, borderColor: BRAND_COLORS.divider }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: test.avatar }} style={styles.testimonialAvatar} />
                <View style={{ marginLeft: GRID.sm }}>
                  <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>{test.name}</Text>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>Booked {test.service}</Text>
                </View>
              </View>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontStyle: 'italic', marginTop: GRID.sm }]}>
                {test.quote}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: GRID.sm }}>
                {Array.from({ length: test.rating }).map((_, i) => (
                  <Ionicons key={i} name="star" size={16} color={BRAND_COLORS.yellowAccent} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* WHY JUSTTAP */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Why JustTap</Text>
        </View>
        <View style={styles.whyJustTapGrid}>
          <View style={[styles.whyCard, { backgroundColor: BRAND_COLORS.sectionBg }]}>
            <Ionicons name="shield-checkmark" size={28} color={BRAND_COLORS.greenAction} />
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: 8 }]}>Verified Pros</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2, textAlign: 'center' }]}>100% background checked</Text>
          </View>
          <View style={[styles.whyCard, { backgroundColor: BRAND_COLORS.sectionBg }]}>
            <Ionicons name="card" size={28} color={BRAND_COLORS.greenAction} />
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: 8 }]}>Secure Payments</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2, textAlign: 'center' }]}>Escrow safety protections</Text>
          </View>
          <View style={[styles.whyCard, { backgroundColor: BRAND_COLORS.sectionBg }]}>
            <Ionicons name="time" size={28} color={BRAND_COLORS.greenAction} />
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: 8 }]}>Fast Arrival</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2, textAlign: 'center' }]}>Under 15 mins dispatch</Text>
          </View>
          <View style={[styles.whyCard, { backgroundColor: BRAND_COLORS.sectionBg }]}>
            <Ionicons name="headset" size={28} color={BRAND_COLORS.greenAction} />
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: 8 }]}>24x7 Support</Text>
            <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2, textAlign: 'center' }]}>Support whenever needed</Text>
          </View>
        </View>

        {/* OFFERS & COUPONS */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Offers & Coupons</Text>
          <Text style={[typography.caption, { color: BRAND_COLORS.yellowAccent, fontWeight: '800' }]}>
            ⚡ EXPIRES IN {couponTimeLeft}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
          {couponsList.map((coupon) => (
            <View key={coupon.code} style={[styles.couponCard, { backgroundColor: BRAND_COLORS.secondary, borderColor: BRAND_COLORS.yellowAccent }]}>
              <View style={styles.couponHeader}>
                <Ionicons name="ticket" size={20} color={BRAND_COLORS.yellowAccent} />
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginLeft: GRID.sm }]}>
                  {coupon.discount}
                </Text>
              </View>
              <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 4 }]}>
                {coupon.terms}
              </Text>
              <View style={styles.couponFooter}>
                <View style={styles.couponTag}>
                  <Text style={[typography.bodySmall, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    {coupon.code}
                  </Text>
                </View>
                <ScalePressable
                  style={[styles.copyCouponBtn, { backgroundColor: BRAND_COLORS.darkText }]}
                  onPress={() => handleCopyCoupon(coupon.code)}
                >
                  <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '800' }]}>
                    {copiedCoupon === coupon.code ? 'COPIED!' : 'COPY'}
                  </Text>
                </ScalePressable>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* RECENTLY VIEWED */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, fontSize: 20 }]}>Recently Viewed</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
          {nearbyPros.slice(1).map((pro) => (
            <View key={pro.id + '-recent'} style={[styles.recentViewedCard, { backgroundColor: '#FFFFFF', borderColor: BRAND_COLORS.divider }]}>
              <Image source={{ uri: pro.img }} style={styles.recentViewedImg} />
              <View style={{ flex: 1, marginLeft: GRID.sm }}>
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]} numberOfLines={1}>
                  {pro.name}
                </Text>
                <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>
                  {pro.service} • ★{pro.rating}
                </Text>
              </View>
              <ScalePressable
                style={[styles.recentBookBtn, { backgroundColor: BRAND_COLORS.yellowAccent }]}
                onPress={() => router.push('/search')}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Book</Text>
              </ScalePressable>
            </View>
          ))}
        </ScrollView>

        {/* Developer States Control */}
        {renderDevMenu()}
      </ScrollView>

      {/* EMERGENCY FLOATING ACTION BUTTON */}
      <Pressable
        style={({ pressed }) => [
          styles.emergencyFAB,
          {
            backgroundColor: BRAND_COLORS.yellowAccent,
            transform: [{ scale: pressed ? 0.9 : 1 }],
            elevation: pressed ? 4 : 8,
          }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setIsEmergencyModalOpen(true);
        }}
      >
        <Ionicons name="alert-circle" size={24} color={BRAND_COLORS.darkText} />
        <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800', marginLeft: 6 }]}>
          Emergency
        </Text>
      </Pressable>

      {/* VOICE SEARCH MODAL MOCKUP */}
      <Modal visible={isVoiceSearchOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.voiceModalContainer, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[typography.h2, { color: BRAND_COLORS.darkText, textAlign: 'center' }]}>Listening...</Text>
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginTop: 8, textAlign: 'center' }]}>
              Try saying "Plumber near me" or "AC servicing"
            </Text>
            
            {/* Pulsing wave animations simulation */}
            <View style={styles.pulsingWavesContainer}>
              <View style={[styles.pulseWave, { width: 100, height: 100, borderRadius: 50, opacity: 0.1, backgroundColor: BRAND_COLORS.yellowAccent }]} />
              <View style={[styles.pulseWave, { width: 80, height: 80, borderRadius: 40, opacity: 0.2, backgroundColor: BRAND_COLORS.yellowAccent, position: 'absolute' }]} />
              <View style={[styles.voiceMicBtn, { backgroundColor: BRAND_COLORS.yellowAccent }]}>
                <Ionicons name="mic" size={32} color={BRAND_COLORS.darkText} />
              </View>
            </View>

            <ScalePressable
              style={[styles.closeModalBtn, { borderColor: BRAND_COLORS.divider }]}
              onPress={() => setIsVoiceSearchOpen(false)}
            >
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>Cancel</Text>
            </ScalePressable>
          </View>
        </View>
      </Modal>

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsFilterModalOpen(false)} />
          <View style={[styles.bottomSheetContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: BRAND_COLORS.darkText }]}>Filters</Text>
              <Pressable onPress={() => setIsFilterModalOpen(false)}>
                <Ionicons name="close" size={24} color={BRAND_COLORS.darkText} />
              </Pressable>
            </View>

            <View style={{ padding: GRID.lg }}>
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>Sort By</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: GRID.lg }}>
                {['Rating', 'ETA', 'Price'].map(item => (
                  <View key={item} style={[styles.filterChipActive, { backgroundColor: BRAND_COLORS.secondary, borderColor: BRAND_COLORS.yellowAccent }]}>
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>Ratings</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: GRID.lg }}>
                {['★ 4.5+', '★ 4.8+', '★ 4.9+'].map(item => (
                  <View key={item} style={[styles.filterChipInactive, { borderColor: BRAND_COLORS.divider }]}>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <ScalePressable
                style={[styles.applyFilterBtn, { backgroundColor: BRAND_COLORS.yellowAccent }]}
                onPress={() => setIsFilterModalOpen(false)}
              >
                <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                  Apply Filters
                </Text>
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EMERGENCY SERVICE CONFIRMATION MODAL */}
      <Modal visible={isEmergencyModalOpen} transparent animationType="slide">
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsEmergencyModalOpen(false)} />
          <View style={[styles.bottomSheetContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
                <Text style={[typography.h2, { color: BRAND_COLORS.darkText, marginLeft: 8 }]}>Emergency Booking</Text>
              </View>
              <Pressable onPress={() => setIsEmergencyModalOpen(false)}>
                <Ionicons name="close" size={24} color={BRAND_COLORS.darkText} />
              </Pressable>
            </View>

            <View style={{ padding: GRID.lg }}>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginBottom: GRID.md }]}>
                Select category. We will dispatch the closest verified provider within 60 seconds. Flat platform travel charges may apply.
              </Text>

              <View style={styles.emergencyOptions}>
                {[
                  { id: 'electrical', label: '⚡ Electrical Fire/Spark', icon: 'flash' },
                  { id: 'plumbing', label: '🚿 Major Pipe Burst', icon: 'water' },
                  { id: 'appliance', label: '📺 Appliance Hazard', icon: 'power' },
                ].map(opt => (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.emergencyOptBtn,
                      {
                        borderColor: emergencyCategory === opt.id ? BRAND_COLORS.yellowAccent : BRAND_COLORS.divider,
                        backgroundColor: emergencyCategory === opt.id ? BRAND_COLORS.secondary : '#FFFFFF',
                      }
                    ]}
                    onPress={() => setEmergencyCategory(opt.id as any)}
                  >
                    <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                      {opt.label}
                    </Text>
                    {emergencyCategory === opt.id && (
                      <Ionicons name="checkmark-circle" size={20} color={BRAND_COLORS.greenAction} />
                    )}
                  </Pressable>
                ))}
              </View>

              <ScalePressable
                disabled={!emergencyCategory || isEmergencyBookingInProgress}
                style={[
                  styles.confirmEmergencyBtn,
                  {
                    backgroundColor: emergencyCategory ? '#DC2626' : BRAND_COLORS.divider,
                  }
                ]}
                onPress={handleTriggerEmergencyBooking}
              >
                {isEmergencyBookingInProgress ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[typography.bodyLarge, { color: '#FFFFFF', fontWeight: '800' }]}>
                    CONFIRM EMERGENCY DISPATCH
                  </Text>
                )}
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Helper renderers
  function renderDevMenu() {
    return (
      <View style={[styles.devMenu, { borderColor: BRAND_COLORS.divider }]}>
        <Pressable onPress={() => setIsDevMenuOpen(!isDevMenuOpen)} style={styles.devMenuHeader}>
          <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, fontWeight: '800' }]}>
            🛠️ Dev State Toggles ({devState.toUpperCase()})
          </Text>
          <Ionicons name={isDevMenuOpen ? 'chevron-up' : 'chevron-down'} size={18} color={BRAND_COLORS.secondaryText} />
        </Pressable>

        {isDevMenuOpen && (
          <View style={styles.devMenuButtons}>
            {[
              { id: 'normal', label: 'Normal View' },
              { id: 'loading', label: 'Shimmer Loading' },
              { id: 'no-internet', label: 'Empty: Offline' },
              { id: 'no-providers', label: 'Empty: No Pros' },
              { id: 'no-bookings', label: 'Empty: No Bookings' },
              { id: 'no-notifications', label: 'Empty: No Alerts' }
            ].map(stateItem => (
              <Pressable
                key={stateItem.id}
                style={[
                  styles.devChip,
                  {
                    backgroundColor: devState === stateItem.id ? BRAND_COLORS.yellowAccent : BRAND_COLORS.sectionBg,
                    borderColor: devState === stateItem.id ? BRAND_COLORS.yellowAccent : BRAND_COLORS.divider,
                  }
                ]}
                onPress={() => {
                  setDevState(stateItem.id as any);
                  setIsDevMenuOpen(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                  {stateItem.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderEmptyState(icon: string, title: string, desc: string, btnText: string, onBtnPress: () => void) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: BRAND_COLORS.primary }]}>
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconCircle, { backgroundColor: BRAND_COLORS.secondary }]}>
            <Ionicons name={icon as any} size={48} color={BRAND_COLORS.yellowAccent} />
          </View>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, marginTop: GRID.xl, textAlign: 'center', fontWeight: '800' }]}>
            {title}
          </Text>
          <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginTop: GRID.sm, textAlign: 'center', lineHeight: 22 }]}>
            {desc}
          </Text>
          
          <ScalePressable
            style={[styles.emptyActionBtn, { backgroundColor: BRAND_COLORS.yellowAccent }]}
            onPress={onBtnPress}
          >
            <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
              {btnText}
            </Text>
          </ScalePressable>
        </View>
        {renderDevMenu()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GRID.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  stickyBookingCard: {
    borderRadius: GRID.radiusCard,
    padding: GRID.lg,
    marginBottom: GRID.lg,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  stickyBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickyBookingProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stickyBookingBody: {
    marginTop: GRID.sm,
  },
  stickyBookingActions: {
    flexDirection: 'row',
    marginTop: GRID.md,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: GRID.radiusCard,
    padding: GRID.lg,
    marginBottom: GRID.lg,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationPin: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  changeLocBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchOuterBar: {
    marginBottom: GRID.lg,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.divider,
    paddingHorizontal: GRID.md,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  searchActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: BRAND_COLORS.divider,
    marginHorizontal: GRID.xs,
  },
  carouselContainer: {
    marginBottom: GRID.xl,
  },
  carouselSlide: {
    borderRadius: GRID.radiusCard,
    padding: GRID.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 150,
  },
  promoCodeBadge: {
    marginTop: GRID.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  carouselCta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    position: 'absolute',
    bottom: GRID.lg,
    right: GRID.lg,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: GRID.sm,
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: GRID.lg,
    marginBottom: GRID.md,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: GRID.md,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: GRID.md,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.divider,
    paddingTop: GRID.sm,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: GRID.lg,
    marginBottom: GRID.lg,
  },
  horizontalScrollContainer: {
    paddingRight: 24,
    gap: 12,
    paddingBottom: 4,
  },
  quickActionCard: {
    width: 100,
    height: 80,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  nearbyProCard: {
    width: 220,
    borderRadius: 20,
    borderWidth: 1,
    padding: GRID.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  proAvatarRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  proAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    left: 42,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    left: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  proCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: GRID.md,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.divider,
    paddingTop: GRID.sm,
  },
  proBookBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  popularCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  popularImg: {
    width: '100%',
    height: 90,
  },
  featuredCard: {
    borderRadius: GRID.radiusCard,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: GRID.lg,
    position: 'relative',
  },
  featuredImg: {
    width: '100%',
    height: 180,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredContent: {
    padding: GRID.lg,
  },
  featuredBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.md,
  },
  testimonialCard: {
    width: 280,
    borderRadius: 20,
    borderWidth: 1,
    padding: GRID.lg,
  },
  testimonialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  whyJustTapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: GRID.lg,
  },
  whyCard: {
    width: '48%',
    borderRadius: 16,
    padding: GRID.md,
    alignItems: 'center',
  },
  couponCard: {
    width: 220,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: GRID.md,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: GRID.md,
  },
  couponTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  copyCouponBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentViewedCard: {
    width: 240,
    borderRadius: 18,
    borderWidth: 1,
    padding: GRID.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentViewedImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  recentBookBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emergencyFAB: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 80,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: GRID.lg,
    borderRadius: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  devMenu: {
    marginTop: GRID.xxl,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  devMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.md,
    backgroundColor: '#FFFFFF',
  },
  devMenuButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: GRID.md,
    backgroundColor: '#F8F8F6',
  },
  devChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: GRID.xl,
  },
  voiceModalContainer: {
    width: '90%',
    borderRadius: 28,
    padding: GRID.xl,
    alignItems: 'center',
    elevation: 10,
  },
  pulsingWavesContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: GRID.xxl,
  },
  pulseWave: {
    position: 'absolute',
  },
  voiceMicBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  closeModalBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.divider,
  },
  filterChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterChipInactive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  applyFilterBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.lg,
  },
  emergencyOptions: {
    marginVertical: GRID.lg,
    gap: GRID.md,
  },
  emergencyOptBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 54,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: GRID.md,
  },
  confirmEmergencyBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: GRID.xl,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: GRID.lg,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.xl,
  },
  searchOverlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID.lg,
    paddingBottom: GRID.sm,
    borderBottomWidth: 1,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: GRID.sm,
  },
  cancelSearchText: {
    marginLeft: GRID.lg,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: GRID.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
});
