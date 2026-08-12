import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useGetCategoriesQuery,
  useGetServicesQuery,
  useGetProvidersForServiceQuery
} from '@/redux/api/serviceApi';
import { useGetCustomerProfile } from '@/hooks/useProfile';
import { useSearchProvidersMatchingMutation } from '@/redux/api/matchingApi';
import Shimmer from '@/components/common/Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRID = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  radiusCard: 20,
};

const BRAND_COLORS = {
  background: '#FFFFFF',
  secondaryBg: '#FFF9F0',
  primary: '#16A34A', // Green Action / Success
  accent: '#FBBF24', // Yellow Accent
  darkText: '#0F172A',
  secondaryText: '#64748B',
  divider: '#E5E7EB',
};

// Premium press-to-scale component
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

export default function CustomerSearchScreen() {
  const { typography, colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string }>();

  // RTK Query Hooks for Backend Microservices
  const { data: profileRes } = useGetCustomerProfile();
  const { data: categoriesRes, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: servicesRes, isLoading: isServicesLoading } = useGetServicesQuery();

  const profile = profileRes?.profile;
  const addresses = profileRes?.addresses || [];
  const primaryAddress = addresses.find(a => a.isPrimary) || addresses[0];

  const dbCategories = categoriesRes?.data || [];
  const dbServices = servicesRes?.data || [];

  // Search keyword & view states
  const [keyword, setKeyword] = useState(params.query || '');
  const [devState, setDevState] = useState<'discovery' | 'results' | 'empty' | 'loading' | 'voice'>('discovery');
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Autocomplete Suggestions
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState(['Electrician', 'AC Repair', 'Plumber']);

  // Filters Modal State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price' | 'experience'>('distance');
  const [maxDistance, setMaxDistance] = useState(8); // km
  const [maxPrice, setMaxPrice] = useState(1000); // INR
  const [minRating, setMinRating] = useState<number | null>(null);
  const [minExp, setMinExp] = useState<number | null>(null);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availability, setAvailability] = useState<'ANY' | 'NOW' | 'TODAY'>('ANY');

  // Voice Search Listening Overlay Mockup
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Sync route params query to keyword state
  useEffect(() => {
    if (params.query) {
      setKeyword(params.query);
      setDevState('results');
    }
  }, [params.query]);

  // Resolve matching service in database based on search keyword
  const matchedService = useMemo(() => {
    if (!keyword.trim()) return null;
    const query = keyword.toLowerCase();
    return dbServices.find(s => 
      s.name.toLowerCase().includes(query) || 
      s.slug.toLowerCase().includes(query)
    );
  }, [keyword, dbServices]);

  // Query providers near user's GPS coords from database using selected service and active filters
  const { data: providersRes, isLoading: isProvidersLoading } = useGetProvidersForServiceQuery(
    {
      serviceId: matchedService?._id || 'demo-service-id', // Fallback ID if none matches to keep typing happy
      latitude: primaryAddress?.latitude || 19.066,
      longitude: primaryAddress?.longitude || 72.825,
      minPrice: undefined,
      maxPrice,
      minExperience: minExp || undefined,
      minRating: minRating || undefined,
      sortBy: sortBy === 'rating' ? 'rating' : sortBy === 'price' ? 'price' : sortBy === 'experience' ? 'experience' : 'distance',
      sortOrder: sortBy === 'price' ? 'asc' : 'desc'
    },
    {
      skip: !matchedService || devState === 'discovery' // Skip query if no database service matches keyword
    }
  );

  const dbProviders = providersRes?.data?.providers || [];

  // Real-time matching microservice query
  const [searchMatchingProviders, { data: matchingProvidersRes, isLoading: isMatchingLoading }] = useSearchProvidersMatchingMutation();
  const matchingProviders = matchingProvidersRes?.data?.providers || [];

  // Trigger matching microservice search whenever selected service, address, or distance radius updates
  useEffect(() => {
    if (matchedService?._id) {
      searchMatchingProviders({
        latitude: primaryAddress?.latitude || 19.066,
        longitude: primaryAddress?.longitude || 72.825,
        radius: maxDistance,
        serviceId: matchedService._id
      }).catch(err => console.error("Matching service error:", err));
    }
  }, [matchedService, primaryAddress, maxDistance]);

  // Mock Fallback Data (for visual completeness and when backend is not actively running)
  const fallbackCategories = [
    { name: 'Electrician', icon: 'flash', price: '₹199', eta: '10 mins' },
    { name: 'Plumber', icon: 'water', price: '₹249', eta: '12 mins' },
    { name: 'AC Repair', icon: 'snow', price: '₹399', eta: '15 mins' },
    { name: 'Carpenter', icon: 'hammer', price: '₹299', eta: '20 mins' },
    { name: 'Cleaning', icon: 'brush', price: '₹499', eta: '25 mins' },
    { name: 'Salon', icon: 'cut', price: '₹599', eta: '30 mins' },
    { name: 'Pet Care', icon: 'paw', price: '₹349', eta: '18 mins' },
    { name: 'TV Repair', icon: 'tv', price: '₹199', eta: '15 mins' }
  ];

  const fallbackProviders = [
    { id: 'prov-1', name: 'Ravi Sharma', service: 'Electrician', rating: 4.9, completed: 840, dist: 1.2, eta: 8, price: 199, img: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150', online: true, verified: true },
    { id: 'prov-2', name: 'Vikram Singh', service: 'AC Repair', rating: 4.8, completed: 320, dist: 2.1, eta: 10, price: 399, img: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150', online: true, verified: true },
    { id: 'prov-3', name: 'Amit Plumber', service: 'Plumber', rating: 4.75, completed: 490, dist: 1.6, eta: 12, price: 249, img: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', online: false, verified: true }
  ];

  const trendingServices = [
    { title: 'Sofa Shampooing', price: '₹799', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300', badge: '50% OFF' },
    { title: 'Kitchen Deep Cleaning', price: '₹1499', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300', badge: 'Trending' }
  ];

  // Combine database providers, matching service providers and fallback providers
  const displayProviders = useMemo(() => {
    if (devState === 'empty') return [];
    if (keyword.trim().length > 0) {
      // 1. Prioritize results returned from the real-time matching microservice
      if (matchingProviders.length > 0) {
        return matchingProviders.map(p => ({
          id: p.userId, // MatchingProviderResult uses userId
          name: p.businessName,
          service: matchedService?.name || 'Home Service',
          rating: p.rating || 4.8,
          completed: p.experience * 35 || 120,
          dist: Number(p.distance.toFixed(1)),
          eta: Math.round(p.distance * 8) || 10,
          price: p.price,
          img: fallbackProviders[Math.floor(Math.random() * fallbackProviders.length)].img,
          online: true,
          verified: true
        }));
      }

      // 2. Fall back to standard catalog providers
      if (dbProviders.length > 0) {
        return dbProviders.map(p => ({
          id: p.providerId,
          name: p.businessName,
          service: matchedService?.name || 'Home Service',
          rating: p.rating || 4.8,
          completed: Math.floor(p.rating * 100),
          dist: Number(p.distance.toFixed(1)),
          eta: Math.round(p.distance * 8),
          price: p.price,
          img: fallbackProviders[Math.floor(Math.random() * fallbackProviders.length)].img,
          online: true,
          verified: true
        }));
      }
      
      // 3. Fall back to visual mock search filters
      const query = keyword.toLowerCase();
      return fallbackProviders.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.service.toLowerCase().includes(query)
      );
    }
    return fallbackProviders;
  }, [keyword, dbProviders, matchingProviders, matchedService, devState]);

  // Autocomplete matching list
  const handleKeywordChange = (text: string) => {
    setKeyword(text);
    if (!text.trim()) {
      setSuggestions([]);
      if (devState === 'results') setDevState('discovery');
    } else {
      const query = text.toLowerCase();
      const activeList = dbServices.length > 0 ? dbServices : fallbackCategories;
      const catMatches = activeList.map(c => c.name);
      const matches = catMatches.filter(name => name.toLowerCase().includes(query));
      setSuggestions(matches.length > 0 ? matches : ['Electrician Near Me', 'AC Servicing', 'Plumbing leakage']);
    }
  };

  const handleSelectKeyword = (query: string) => {
    setKeyword(query);
    setIsFocused(false);
    setDevState('results');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save to recent searches
    if (!recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)]);
    }
  };

  const handleDeleteRecent = (searchItem: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentSearches(recentSearches.filter(s => s !== searchItem));
  };

  const handleFavoriteToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleVoiceTrigger = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsVoiceListening(true);
    setTimeout(() => {
      setIsVoiceListening(false);
      handleSelectKeyword('Electrician');
    }, 2500);
  };

  // State Switcher Layout Renderers
  if (devState === 'loading' || isCategoriesLoading || isServicesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: BRAND_COLORS.background }]}>
        <View style={styles.searchHeader}>
          <Shimmer width={'75%'} height={48} borderRadius={14} />
          <Shimmer width={48} height={48} borderRadius={14} style={{ marginLeft: 12 }} />
        </View>
        <ScrollView style={{ padding: GRID.lg }}>
          <Shimmer width={200} height={20} borderRadius={4} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} width={'48%'} height={100} borderRadius={16} />
            ))}
          </View>
        </ScrollView>
        {renderDevMenu()}
      </View>
    );
  }

  // --- Normal/Discovery/Results Screen Render ---
  return (
    <View style={{ flex: 1, backgroundColor: BRAND_COLORS.background }}>
      {/* SEARCH HEADER */}
      <View style={[styles.searchHeader, { borderBottomColor: BRAND_COLORS.divider }]}>
        <View style={[styles.searchBarContainer, { backgroundColor: '#F1F5F9' }]}>
          <Ionicons name="search" size={20} color={BRAND_COLORS.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: BRAND_COLORS.darkText }]}
            placeholder="Search services or providers..."
            placeholderTextColor={BRAND_COLORS.secondaryText}
            value={keyword}
            onFocus={() => setIsFocused(true)}
            onChangeText={handleKeywordChange}
          />
          {keyword.length > 0 && (
            <Pressable onPress={() => handleKeywordChange('')}>
              <Ionicons name="close-circle" size={20} color={BRAND_COLORS.secondaryText} style={{ marginRight: 8 }} />
            </Pressable>
          )}
        </View>
        <ScalePressable style={styles.micBtn} onPress={handleVoiceTrigger}>
          <Ionicons name="mic-outline" size={22} color={BRAND_COLORS.darkText} />
        </ScalePressable>
        <ScalePressable style={styles.filterBtn} onPress={() => setIsFilterOpen(true)}>
          <Ionicons name="options-outline" size={22} color={BRAND_COLORS.darkText} />
        </ScalePressable>
      </View>

      {/* Autocomplete Suggestions Overlay */}
      {isFocused && (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {suggestions.map((item) => (
              <Pressable
                key={item}
                style={styles.suggestionRow}
                onPress={() => handleSelectKeyword(item)}
              >
                <Ionicons name="search-outline" size={16} color={BRAND_COLORS.secondaryText} style={{ marginRight: GRID.sm }} />
                <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText }]}>{item}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeOverlayBtn} onPress={() => setIsFocused(false)}>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.primary, fontWeight: '700' }]}>Close Suggestions</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* LOCATION BAR */}
      <View style={[styles.locationBar, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
        <Ionicons name="location-sharp" size={16} color={BRAND_COLORS.primary} />
        <Text style={[typography.bodySmall, { color: BRAND_COLORS.darkText, fontWeight: '700', flex: 1, marginLeft: 6 }]} numberOfLines={1}>
          📍 Delivered to: {primaryAddress?.label?.toUpperCase() || 'HOME'} - {primaryAddress?.addressLine1 || 'Mumbai, Maharashtra'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={BRAND_COLORS.darkText} />
      </View>

      {/* VIEW CONDITIONAL: Discovery Dashboard vs Results View */}
      {devState === 'discovery' && keyword.length === 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionTitleRow}>
                <Text style={[typography.h3, { color: BRAND_COLORS.darkText }]}>Recent Searches</Text>
                <Pressable onPress={() => setRecentSearches([])}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, fontWeight: '800' }]}>Clear All</Text>
                </Pressable>
              </View>
              {recentSearches.map((item) => (
                <View key={item} style={styles.recentItem}>
                  <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => handleSelectKeyword(item)}>
                    <Ionicons name="time-outline" size={18} color={BRAND_COLORS.secondaryText} style={{ marginRight: GRID.sm }} />
                    <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText }]}>{item}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteRecent(item)}>
                    <Ionicons name="close" size={18} color={BRAND_COLORS.secondaryText} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* TRENDING SEARCH CHIPS */}
          <View style={styles.sectionContainer}>
            <Text style={[typography.h3, { color: BRAND_COLORS.darkText, marginBottom: GRID.sm }]}>Trending Searches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {['Electrician', 'AC Repair', 'Plumber', 'Cleaning', 'Salon', 'Tutor'].map((chip) => (
                <Pressable
                  key={chip}
                  style={[styles.trendingChip, { borderColor: BRAND_COLORS.divider }]}
                  onPress={() => handleSelectKeyword(chip)}
                >
                  <Ionicons name="trending-up-outline" size={14} color={BRAND_COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>{chip}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* BROWSE SERVICE CATEGORIES */}
          <View style={styles.sectionContainer}>
            <Text style={[typography.h3, { color: BRAND_COLORS.darkText, marginBottom: GRID.md }]}>Browse Categories</Text>
            <View style={styles.categoryGrid}>
              {(dbCategories.length > 0 ? dbCategories : fallbackCategories).slice(0, 8).map((cat: any) => (
                <ScalePressable
                  key={cat.name}
                  style={[styles.categoryCard, { backgroundColor: '#FFFFFF', borderColor: BRAND_COLORS.divider }]}
                  onPress={() => handleSelectKeyword(cat.name)}
                >
                  <View style={[styles.catIconCircle, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
                    <Ionicons name={(cat.icon || 'briefcase') as any} size={24} color={BRAND_COLORS.accent} />
                  </View>
                  <Text style={[typography.bodySmall, { color: BRAND_COLORS.darkText, fontWeight: '800', marginTop: GRID.sm, textAlign: 'center' }]}>
                    {cat.name}
                  </Text>
                  <Text style={[typography.caption, { color: BRAND_COLORS.primary, fontWeight: '700', marginTop: 2 }]}>
                    Starting {cat.price || '₹199'}
                  </Text>
                </ScalePressable>
              ))}
            </View>
          </View>

          {/* NEARBY PROVIDERS CAROUSEL */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText }]}>Nearby Verified Professionals</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {fallbackProviders.map((pro) => (
                <View key={pro.id} style={[styles.proCard, { borderColor: BRAND_COLORS.divider }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: pro.img }} style={styles.proAvatar} />
                    <View style={{ marginLeft: GRID.sm, flex: 1 }}>
                      <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]} numberOfLines={1}>
                        {pro.name}
                      </Text>
                      <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>
                        {pro.service} • {pro.dist} km
                      </Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={BRAND_COLORS.primary} />
                    </View>
                  </View>
                  <View style={styles.proMetaRow}>
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>★ {pro.rating}</Text>
                    <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>ETA {pro.eta} mins</Text>
                  </View>
                  <View style={styles.proFooter}>
                    <Text style={[typography.caption, { color: BRAND_COLORS.primary, fontWeight: '800' }]}>₹{pro.price} onwards</Text>
                    <ScalePressable
                      style={[styles.proBookBtn, { backgroundColor: BRAND_COLORS.accent }]}
                      onPress={() => router.push({
                        pathname: '/(customer)/provider-details',
                        params: {
                          providerId: pro.id,
                          providerServiceId: pro.id + '-service',
                          businessName: pro.name,
                          price: String(pro.price),
                          rating: String(pro.rating),
                          experience: '5',
                          distance: String(pro.dist),
                          serviceId: 'service',
                          serviceName: pro.service
                        }
                      })}
                    >
                      <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Book</Text>
                    </ScalePressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* TRENDING SERVICES COVER CARDS */}
          <View style={styles.sectionContainer}>
            <Text style={[typography.h3, { color: BRAND_COLORS.darkText, marginBottom: GRID.md }]}>Trending Offers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {trendingServices.map((offer) => (
                <View key={offer.title} style={[styles.offerCard, { borderColor: BRAND_COLORS.divider }]}>
                  <Image source={{ uri: offer.img }} style={styles.offerImg} />
                  <View style={styles.offerBadge}>
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>{offer.badge}</Text>
                  </View>
                  <View style={{ padding: GRID.sm }}>
                    <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>{offer.title}</Text>
                    <Text style={[typography.caption, { color: BRAND_COLORS.primary, fontWeight: '800', marginTop: 2 }]}>Starting {offer.price}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* RECENTLY VIEWED */}
          <View style={styles.sectionContainer}>
            <Text style={[typography.h3, { color: BRAND_COLORS.darkText, marginBottom: GRID.md }]}>Recently Viewed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {fallbackProviders.slice(1).map((pro) => (
                <View key={pro.id + '-recent'} style={[styles.recentViewedCard, { borderColor: BRAND_COLORS.divider }]}>
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
                    style={[styles.recentBookBtn, { backgroundColor: BRAND_COLORS.accent }]}
                    onPress={() => handleSelectKeyword(pro.service)}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Book Again</Text>
                  </ScalePressable>
                </View>
              ))}
            </ScrollView>
          </View>
          {renderDevMenu()}
        </ScrollView>
      ) : (
        // --- RESULTS LIST VIEW ---
        <View style={{ flex: 1 }}>
          {/* Quick Filter Tags Row */}
          <View style={styles.quickFilterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
              <Pressable
                style={[styles.filterChip, emergencyOnly && { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent }]}
                onPress={() => setEmergencyOnly(!emergencyOnly)}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                  🚨 Emergency {emergencyOnly && '✓'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, verifiedOnly && { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent }]}
                onPress={() => setVerifiedOnly(!verifiedOnly)}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                  🛡️ Verified Only {verifiedOnly && '✓'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, maxDistance <= 5 && { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent }]}
                onPress={() => setMaxDistance(maxDistance <= 5 ? 15 : 5)}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                  ⚡ Under 5km {maxDistance <= 5 && '✓'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Results List */}
          {displayProviders.length === 0 ? (
            // NO RESULTS STATE
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
                <Ionicons name="search-outline" size={48} color={BRAND_COLORS.accent} />
              </View>
              <Text style={[typography.h2, { color: BRAND_COLORS.darkText, marginTop: GRID.xl, fontWeight: '800' }]}>
                No providers found nearby
              </Text>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginTop: GRID.sm, textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 }]}>
                We couldn't locate any service providers within your current range ({maxDistance} km). Try expanding search radius.
              </Text>
              <View style={{ width: '100%', paddingHorizontal: 24, marginTop: GRID.xl, gap: 12 }}>
                <ScalePressable
                  style={[styles.emptyActionBtn, { backgroundColor: BRAND_COLORS.accent }]}
                  onPress={() => {
                    setMaxDistance(15);
                    setDevState('results');
                  }}
                >
                  <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                    Expand Radius (15 km)
                  </Text>
                </ScalePressable>
                <ScalePressable
                  style={[styles.emptySecondaryBtn, { borderColor: BRAND_COLORS.divider }]}
                  onPress={() => {
                    setKeyword('');
                    setDevState('discovery');
                  }}
                >
                  <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                    Try Another Service
                  </Text>
                </ScalePressable>
              </View>
            </View>
          ) : (
            // RESULT CARDS LIST
            <FlatList
              data={displayProviders}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: GRID.lg, paddingBottom: 100 }}
              renderItem={({ item }) => (
                <View style={[styles.resultCard, { borderColor: BRAND_COLORS.divider }]}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={{ uri: item.img }} style={styles.resultAvatar} />
                    <View style={{ flex: 1, marginLeft: GRID.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                            {item.name}
                          </Text>
                          {item.verified && (
                            <Ionicons name="checkmark-circle" size={16} color={BRAND_COLORS.primary} style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <Pressable onPress={() => handleFavoriteToggle(item.id)}>
                          <Ionicons
                            name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
                            size={22}
                            color={favorites.includes(item.id) ? '#DC2626' : BRAND_COLORS.secondaryText}
                          />
                        </Pressable>
                      </View>
                      <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]}>
                        {item.service} • {item.completed} completed jobs
                      </Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color={BRAND_COLORS.accent} />
                        <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700', marginLeft: 4 }]}>
                          {item.rating}
                        </Text>
                        <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginLeft: 8 }]}>
                          {item.dist} km away • {item.eta} mins arrival
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.resultFooter}>
                    <View>
                      <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>UPFRONT RATE</Text>
                      <Text style={[typography.h3, { color: BRAND_COLORS.primary, fontWeight: '800' }]}>
                        ₹{item.price} <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, fontWeight: '400' }]}>/ service</Text>
                      </Text>
                    </View>
                    <ScalePressable
                      style={[styles.resultBookBtn, { backgroundColor: BRAND_COLORS.accent }]}
                      onPress={() => router.push({
                        pathname: '/(customer)/provider-details',
                        params: {
                          providerId: item.id,
                          providerServiceId: item.id + '-service',
                          businessName: item.name,
                          price: String(item.price),
                          rating: String(item.rating),
                          experience: '5',
                          distance: String(item.dist),
                          serviceId: 'service',
                          serviceName: item.service
                        }
                      })}
                    >
                      <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                        Book Now
                      </Text>
                    </ScalePressable>
                  </View>
                </View>
              )}
            />
          )}
          {renderDevMenu()}
        </View>
      )}

      {/* FILTER BOTTOM SHEET */}
      <Modal visible={isFilterOpen} transparent animationType="slide">
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsFilterOpen(false)} />
          <View style={[styles.bottomSheetContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: BRAND_COLORS.darkText }]}>Filters</Text>
              <Pressable onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={24} color={BRAND_COLORS.darkText} />
              </Pressable>
            </View>

            <ScrollView style={{ padding: GRID.lg }} showsVerticalScrollIndicator={false}>
              {/* Sort Options */}
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginBottom: GRID.sm }]}>Sort By</Text>
              <View style={styles.filterChipsRow}>
                {[
                  { id: 'distance', label: 'Nearest' },
                  { id: 'rating', label: 'Highest Rated' },
                  { id: 'price', label: 'Lowest Price' },
                  { id: 'experience', label: 'Experienced' }
                ].map(opt => (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.filterChipSelect,
                      sortBy === opt.id ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                    ]}
                    onPress={() => setSortBy(opt.id as any)}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Distance slider */}
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginTop: GRID.md, marginBottom: GRID.sm }]}>
                Max Distance: {maxDistance} km
              </Text>
              <View style={styles.sliderMock}>
                <View style={styles.sliderTrack} />
                <View style={[styles.sliderTrackFill, { width: `${(maxDistance / 15) * 100}%` }]} />
                <View style={[styles.sliderThumb, { left: `${(maxDistance / 15) * 100 - 5}%` }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Pressable onPress={() => setMaxDistance(2)}><Text style={typography.caption}>2 km</Text></Pressable>
                <Pressable onPress={() => setMaxDistance(5)}><Text style={typography.caption}>5 km</Text></Pressable>
                <Pressable onPress={() => setMaxDistance(10)}><Text style={typography.caption}>10 km</Text></Pressable>
                <Pressable onPress={() => setMaxDistance(15)}><Text style={typography.caption}>15 km</Text></Pressable>
              </View>

              {/* Price budget */}
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginTop: GRID.md, marginBottom: GRID.sm }]}>
                Max Budget: ₹{maxPrice}
              </Text>
              <View style={styles.priceRow}>
                {[300, 500, 1000, 1500].map(price => (
                  <Pressable
                    key={price}
                    style={[
                      styles.filterChipSelect,
                      maxPrice === price ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                    ]}
                    onPress={() => setMaxPrice(price)}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>Under ₹{price}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Rating selection */}
              <Text style={[typography.h3, { color: BRAND_COLORS.darkText, fontSize: 16, marginTop: GRID.md, marginBottom: GRID.sm }]}>Minimum Rating</Text>
              <View style={styles.filterChipsRow}>
                {[4.5, 4.8, 4.9].map(rating => (
                  <Pressable
                    key={rating}
                    style={[
                      styles.filterChipSelect,
                      minRating === rating ? { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent } : { borderColor: BRAND_COLORS.divider }
                    ]}
                    onPress={() => setMinRating(minRating === rating ? null : rating)}
                  >
                    <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>★ {rating}+</Text>
                  </Pressable>
                ))}
              </View>

              {/* Toggle features */}
              <View style={{ marginVertical: GRID.md, gap: 12 }}>
                <View style={styles.switchRow}>
                  <Text style={typography.bodyMedium}>Verified Professionals Only</Text>
                  <Pressable
                    style={[styles.switchTrack, verifiedOnly ? { backgroundColor: BRAND_COLORS.primary } : { backgroundColor: '#CBD5E1' }]}
                    onPress={() => setVerifiedOnly(!verifiedOnly)}
                  >
                    <View style={[styles.switchThumb, verifiedOnly ? { left: 22 } : { left: 2 }]} />
                  </Pressable>
                </View>
                <View style={styles.switchRow}>
                  <Text style={typography.bodyMedium}>Emergency Services Available</Text>
                  <Pressable
                    style={[styles.switchTrack, emergencyOnly ? { backgroundColor: BRAND_COLORS.primary } : { backgroundColor: '#CBD5E1' }]}
                    onPress={() => setEmergencyOnly(!emergencyOnly)}
                  >
                    <View style={[styles.switchThumb, emergencyOnly ? { left: 22 } : { left: 2 }]} />
                  </Pressable>
                </View>
              </View>

              <ScalePressable
                style={[styles.applyFilterBtn, { backgroundColor: BRAND_COLORS.accent }]}
                onPress={() => setIsFilterOpen(false)}
              >
                <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                  Apply Filter Preferences
                </Text>
              </ScalePressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* VOICE LISTENING MODAL */}
      <Modal visible={isVoiceListening} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.voiceContainer, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[typography.h2, { color: BRAND_COLORS.darkText }]}>Listening...</Text>
            <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginTop: 8 }]}>
              Say "Leakage repair" or "Cleaning service"
            </Text>
            <View style={styles.wavesContainer}>
              <View style={[styles.pulseWave, { width: 100, height: 100, borderRadius: 50, opacity: 0.1, backgroundColor: BRAND_COLORS.primary }]} />
              <View style={[styles.pulseWave, { width: 80, height: 80, borderRadius: 40, opacity: 0.25, backgroundColor: BRAND_COLORS.primary, position: 'absolute' }]} />
              <View style={[styles.micActiveCircle, { backgroundColor: BRAND_COLORS.primary }]}>
                <Ionicons name="mic" size={32} color="#FFFFFF" />
              </View>
            </View>
            <Pressable style={styles.closeVoiceBtn} onPress={() => setIsVoiceListening(false)}>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Sandboxed developer control toggles
  function renderDevMenu() {
    return (
      <View style={styles.devMenu}>
        <Pressable onPress={() => setIsDevMenuOpen(!isDevMenuOpen)} style={styles.devMenuHeader}>
          <Text style={[typography.bodySmall, { color: BRAND_COLORS.secondaryText, fontWeight: '800' }]}>
            🛠️ Dev Search Sandbox ({devState.toUpperCase()})
          </Text>
          <Ionicons name={isDevMenuOpen ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND_COLORS.secondaryText} />
        </Pressable>
        {isDevMenuOpen && (
          <View style={styles.devMenuButtons}>
            {[
              { id: 'discovery', label: 'Discovery Home' },
              { id: 'results', label: 'Search Results' },
              { id: 'empty', label: 'No Results' },
              { id: 'loading', label: 'Shimmers' }
            ].map(stateItem => (
              <Pressable
                key={stateItem.id}
                style={[
                  styles.devChip,
                  {
                    backgroundColor: devState === stateItem.id ? BRAND_COLORS.accent : '#F1F5F9',
                    borderColor: devState === stateItem.id ? BRAND_COLORS.accent : BRAND_COLORS.divider,
                  }
                ]}
                onPress={() => {
                  setDevState(stateItem.id as any);
                  setIsDevMenuOpen(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (stateItem.id === 'discovery') setKeyword('');
                  if (stateItem.id === 'results') setKeyword('Electrician');
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: GRID.md,
    borderBottomWidth: 1,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingLeft: GRID.sm,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F1F5F9',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F1F5F9',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 24,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 84,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    padding: GRID.lg,
    maxHeight: 280,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_COLORS.divider,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GRID.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeOverlayBtn: {
    paddingVertical: GRID.lg,
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: GRID.lg,
    paddingHorizontal: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GRID.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: GRID.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '23%',
    minHeight: 90,
    borderRadius: GRID.radiusCard,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proCard: {
    width: 240,
    borderRadius: GRID.radiusCard,
    borderWidth: 1,
    padding: GRID.md,
    backgroundColor: '#FFFFFF',
  },
  proAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
  },
  proMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: GRID.sm,
  },
  proFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  offerCard: {
    width: 160,
    borderRadius: GRID.radiusCard,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  offerImg: {
    width: '100%',
    height: 100,
  },
  offerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recentViewedCard: {
    width: 240,
    borderRadius: 16,
    borderWidth: 1,
    padding: GRID.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  recentViewedImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  recentBookBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickFilterBar: {
    paddingVertical: GRID.sm,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.divider,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
  },
  resultCard: {
    borderRadius: GRID.radiusCard,
    borderWidth: 1.5,
    padding: GRID.md,
    marginBottom: GRID.md,
    backgroundColor: '#FFFFFF',
  },
  resultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.divider,
    paddingTop: GRID.md,
    marginTop: GRID.md,
  },
  resultBookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: GRID.xl,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySecondaryBtn: {
    width: '100%',
    height: 50,
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
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.divider,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: GRID.md,
  },
  filterChipSelect: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: GRID.md,
  },
  sliderMock: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 10,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: BRAND_COLORS.divider,
    borderRadius: 2,
  },
  sliderTrackFill: {
    height: 4,
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 2,
    position: 'absolute',
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND_COLORS.primary,
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    position: 'relative',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 2,
  },
  applyFilterBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.lg,
    marginBottom: GRID.xxl,
  },
  devMenu: {
    margin: GRID.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    borderRadius: 12,
    overflow: 'hidden',
  },
  devMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.sm,
    backgroundColor: '#FFFFFF',
  },
  devMenuButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: GRID.sm,
    backgroundColor: '#F8F8F6',
  },
  devChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: GRID.xl,
  },
  voiceContainer: {
    width: '90%',
    borderRadius: 28,
    padding: GRID.xl,
    alignItems: 'center',
  },
  wavesContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: GRID.xxl,
  },
  pulseWave: {
    position: 'absolute',
  },
  micActiveCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeVoiceBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
