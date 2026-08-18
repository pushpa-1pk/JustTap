import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { useGetCustomerProfile } from '@/hooks/useProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClayIcon } from '@/utils/iconMapper';
import {
  ServiceItem,
  useGetCategoriesQuery,
  useGetServiceByIdQuery,
  useGetServicesQuery,
  useGetProvidersForServiceQuery,
} from '@/redux/api/serviceApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Premium Category Icon Emojis & Palette mapping for modern, Apple-inspired card designs
const CATEGORY_ICONS: Record<string, string> = {
  electrician: '⚡',
  plumber: '🚿',
  'ac repair': '❄️',
  carpenter: '🪚',
  cleaning: '🧹',
  salon: '💇',
  'pet care': '🐶',
  'tv repair': '📺',
  painting: '🎨',
  'pest control': '🐜',
  'appliance repair': '🔌',
  'cctv installation': '📹',
};

const CATEGORY_COLORS: Record<string, string> = {
  electrician: '#FFFBEB', // Light Warm Amber
  plumber: '#EFF6FF', // Light Blue
  'ac repair': '#F0F9FF', // Sky Blue
  carpenter: '#FAF8F5', // Creamy Wood
  cleaning: '#F0FDF4', // Emerald Ice
  salon: '#FDF2F8', // Rose Petal
  'pet care': '#FFF7ED', // Peach Pulp
  'tv repair': '#FEF2F2', // Soft Red
  painting: '#FAF5FF', // Lavender Mist
  'pest control': '#F1F5F9', // Steel Ice
  'appliance repair': '#F0FDFA', // Mint Mist
  'cctv installation': '#F8FAFC', // Slate Glaze
};

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
  minRating?: number;
  sortBy: string;
}

export default function CustomerSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; categoryId?: string; serviceId?: string }>();
  const { colors, typography, spacing, isDark } = useTheme();

  // Search and selection states
  const [input, setInput] = useState(params.query ?? '');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Persistence/History states (session-persisted)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Load recent searches from AsyncStorage on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem('justtap_recent_searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    };
    loadRecentSearches();
  }, []);

  const saveRecentSearches = async (newList: string[]) => {
    try {
      await AsyncStorage.setItem('justtap_recent_searches', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save recent searches:', e);
    }
  };

  // Overlay Modals
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isVoiceVisible, setIsVoiceVisible] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'distance',
  });
  
  // Staging filters inside bottom sheet
  const [tempFilters, setTempFilters] = useState<Filters>({
    sortBy: 'distance',
  });

  // Debounced input keyword search
  const debouncedKeyword = useDebounce(input.trim().replace(/\s+/g, ' '), 300);

  // Sync params query updates
  useEffect(() => {
    if (params.query !== undefined) {
      setInput(params.query);
      setActiveKeyword(params.query);
    }
  }, [params.query]);

  // Sync debounced input
  useEffect(() => {
    setActiveKeyword(debouncedKeyword);
  }, [debouncedKeyword]);

  // Backend queries
  const profileQuery = useGetCustomerProfile();
  const categoriesQuery = useGetCategoriesQuery();
  
  // Determine active categoryId context
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined;
  
  const servicesQuery = useGetServicesQuery({
    categoryId,
    keyword: categoryId ? undefined : activeKeyword || undefined,
  });

  // Fetch service if passed explicitly as serviceId
  const routeServiceId = typeof params.serviceId === 'string' ? params.serviceId : undefined;
  const serviceByIdQuery = useGetServiceByIdQuery(routeServiceId ?? '', { skip: !routeServiceId });

  // Resolve service selection automatically if routeServiceId is loaded
  useEffect(() => {
    if (routeServiceId && serviceByIdQuery.data?.data) {
      const srv = serviceByIdQuery.data.data;
      setSelectedService(srv);
      setInput(srv.name);
      router.setParams({ serviceId: undefined });
    }
  }, [routeServiceId, serviceByIdQuery.data]);

  // Resolve active primary customer location address
  const address = useMemo(() => {
    return (
      profileQuery.data?.addresses?.find((item) => item.isPrimary) ||
      profileQuery.data?.addresses?.[0]
    );
  }, [profileQuery.data]);

  // Resolve matching lists
  const categories = useMemo(() => categoriesQuery.data?.data ?? [], [categoriesQuery.data]);
  const services = useMemo(() => servicesQuery.data?.data?.filter((item) => item.isActive) ?? [], [servicesQuery.data]);

  // Load nearby providers query once service and address are active
  const providersQuery = useGetProvidersForServiceQuery(
    {
      serviceId: selectedService?._id ?? '',
      latitude: address?.latitude ?? 0,
      longitude: address?.longitude ?? 0,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minExperience: filters.minExperience,
      minRating: filters.minRating,
      sortBy: filters.sortBy,
    },
    { skip: !selectedService || !address }
  );

  const providers = useMemo(() => providersQuery.data?.data?.providers ?? [], [providersQuery.data]);

  // Animation values
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const voiceWaveAnim = React.useRef(new Animated.Value(0)).current;

  // Pulse animation loop for skeleton cards & voice waves
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isVoiceVisible || categoriesQuery.isLoading || servicesQuery.isLoading) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animLoop?.stop();
  }, [isVoiceVisible, categoriesQuery.isLoading, servicesQuery.isLoading]);

  // Voice search mock simulation wave
  useEffect(() => {
    let voiceWave: Animated.CompositeAnimation | null = null;
    if (isVoiceVisible) {
      voiceWave = Animated.loop(
        Animated.sequence([
          Animated.timing(voiceWaveAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(voiceWaveAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      voiceWave.start();
    } else {
      voiceWaveAnim.setValue(0);
    }
    return () => voiceWave?.stop();
  }, [isVoiceVisible]);

  // Refetch helper
  const handleRetry = useCallback(async () => {
    try {
      await Promise.all([
        categoriesQuery.refetch(),
        servicesQuery.refetch(),
        profileQuery.refetch(),
        providersQuery.refetch(),
      ]);
    } catch (e) {
      console.warn(e);
    }
  }, [categoriesQuery, servicesQuery, profileQuery, providersQuery]);

  // Save selection query to history
  const handleServiceSelect = (service: ServiceItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedService(service);
    setInput(service.name);
    // Add to history without duplicates
    const updated = [service.name, ...recentSearches.filter((s) => s !== service.name)].slice(0, 5);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const handleRecentSearchSelect = (queryText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput(queryText);
    setActiveKeyword(queryText);
    const matched = services.find((s) => s.name.toLowerCase() === queryText.toLowerCase());
    if (matched) {
      setSelectedService(matched);
    }
    const updated = [queryText, ...recentSearches.filter((s) => s !== queryText)].slice(0, 5);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const handleRecentSearchDelete = (queryText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = recentSearches.filter((s) => s !== queryText);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const handleClearAllRecents = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  // Trigger simulated voice search callback
  const handleVoiceSearchStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVoiceVisible(true);
    // Simulate voice listening & auto-resolve to plumber after 2.5 seconds
    setTimeout(() => {
      setIsVoiceVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInput('Plumber');
      setActiveKeyword('Plumber');
      const plumbingService = services.find((s) => s.name.toLowerCase().includes('plumb'));
      if (plumbingService) {
        setSelectedService(plumbingService);
      }
    }, 2500);
  };

  // Filter application handler
  const handleOpenFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempFilters({ ...filters });
    setIsFilterVisible(true);
  };

  const handleApplyFilters = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFilters({ ...tempFilters });
    setIsFilterVisible(false);
  };

  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const defaults = { sortBy: 'distance' };
    setFilters(defaults);
    setTempFilters(defaults);
    setIsFilterVisible(false);
  };

  const toggleFavorite = (providerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleClearSelection = () => {
    setSelectedService(null);
    setInput('');
    setActiveKeyword('');
  };



  // Resolve random premium avatars based on name hash for high aesthetic fidelity
  const getAvatarUrl = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = (hash % 12) + 1;
    const gender = hash % 2 === 0 ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
  };

  return (
    <SafeAreaViewContainer style={{ backgroundColor: colors.background, paddingTop: 4 }}>
      {/* 1. Header & Large Search Bar */}
      <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
        {/* Current Location selection row */}
        <Pressable
          onPress={() => router.push('/(customer)/addresses')}
          style={styles.locationSelector}
        >
          <Ionicons name="pin" size={16} color={colors.primary} />
          <Text style={[typography.bodyMedium, styles.locationText, { color: colors.text }]}>
            {address?.addressLine1 ? `${address.addressLine1}, ${address.city}` : 'Select Service Address'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>

        {/* Large premium input bar container */}
        <View style={styles.searchBarRow}>
          <View style={[styles.searchBarContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              value={input}
              onChangeText={(val) => {
                setInput(val);
                if (!val) {
                  setSelectedService(null);
                }
              }}
              placeholder="Search services or providers..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => {
                const trimmed = input.trim();
                if (trimmed) {
                  const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
                  setRecentSearches(updated);
                  saveRecentSearches(updated);
                  setActiveKeyword(trimmed);
                }
              }}
            />
            {input.length > 0 && (
              <Pressable onPress={handleClearSelection} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Voice Search mic button */}
          <Pressable onPress={handleVoiceSearchStart} style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="mic" size={22} color={colors.primary} />
          </Pressable>

          {/* Filter settings panel trigger */}
          <Pressable onPress={handleOpenFilters} style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="options-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Dynamic Horizontal Quick Filters Chips when a service is selected */}
        {selectedService && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            <Pressable
              onPress={handleOpenFilters}
              style={[styles.chipButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="funnel-outline" size={13} color={colors.text} />
              <Text style={[styles.chipText, { color: colors.text }]}>Filters</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilters(prev => ({ ...prev, sortBy: prev.sortBy === 'distance' ? 'rating' : 'distance' }));
              }}
              style={[
                styles.chipButton,
                {
                  borderColor: colors.border,
                  backgroundColor: filters.sortBy === 'distance' ? colors.background : '#DCFCE7',
                },
              ]}
            >
              <Text style={[styles.chipText, { color: filters.sortBy === 'distance' ? colors.text : colors.primary }]}>
                {filters.sortBy === 'distance' ? 'Sort: Distance' : 'Sort: Popularity'}
              </Text>
            </Pressable>

            {filters.minRating ? (
              <Pressable
                onPress={() => setFilters(prev => ({ ...prev, minRating: undefined }))}
                style={[styles.chipButton, { borderColor: colors.primary, backgroundColor: '#DCFCE7' }]}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>⭐ {filters.minRating}+ Rating ×</Text>
              </Pressable>
            ) : null}

            {filters.maxPrice ? (
              <Pressable
                onPress={() => setFilters(prev => ({ ...prev, maxPrice: undefined }))}
                style={[styles.chipButton, { borderColor: colors.primary, backgroundColor: '#DCFCE7' }]}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>Under ₹{filters.maxPrice} ×</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loading service details from category details redirect */}
        {routeServiceId && serviceByIdQuery.isLoading && (
          <View style={styles.feedbackContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 12 }]}>
              Loading service details...
            </Text>
          </View>
        )}

        {/* ================================================================ */}
        {/* CASE A: No Active Keyword & No Selected Service -> Show Dashboard */}
        {/* ================================================================ */}
        {!input.trim() && !selectedService && !(routeServiceId && serviceByIdQuery.isLoading) && (
          <View>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
                  <Pressable onPress={handleClearAllRecents}>
                    <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear All</Text>
                  </Pressable>
                </View>
                <View style={styles.recentSearchesList}>
                  {recentSearches.map((item, index) => (
                    <View key={`${item}-${index}`} style={[styles.recentSearchItem, { borderBottomColor: colors.border }]}>
                      <Pressable onPress={() => handleRecentSearchSelect(item)} style={styles.recentSearchInfo}>
                        <Ionicons name="time-outline" size={18} color={colors.textSecondary} style={styles.recentClock} />
                        <Text style={[typography.bodyMedium, { color: colors.text }]}>{item}</Text>
                      </Pressable>
                      <Pressable onPress={() => handleRecentSearchDelete(item)} style={styles.recentSearchRemove}>
                        <Ionicons name="close" size={16} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Searches */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Popular Searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
                {['Electrician', 'Plumber', 'AC Repair', 'Cleaning', 'Carpenter', 'Salon', 'Pet Care'].map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => handleRecentSearchSelect(tag)}
                    style={[styles.tagChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Ionicons name="flame" size={12} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Browse Categories Grid */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Browse Categories</Text>
              {categoriesQuery.isLoading ? (
                <View style={styles.gridLoader}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : categories.length ? (
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
                          onPress={() => router.push({ pathname: '/(customer)/category-details', params: { categoryId: category._id } })}
                          style={styles.categoryCard}
                        >
                          <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F5F5F7' }]}>
                            {(category.icon?.startsWith('http') || category.icon?.startsWith('data:image')) ? (
                              <Image source={{ uri: category.icon }} style={styles.categoryImage} />
                            ) : clayIcon ? (
                              <Image source={clayIcon} style={styles.categoryImage} />
                            ) : (
                              <Ionicons 
                                name={(category.icon || 'help-outline') as any} 
                                size={28} 
                                color={isDark ? colors.secondary : '#16A34A'} 
                              />
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
                <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>No categories available</Text>
              )}
            </View>

            {/* Premium Featured Offer Banner */}
            <View style={styles.offerBannerWrapper}>
              <View style={[styles.offerBanner, { backgroundColor: '#FFF9F0', borderColor: colors.border }]}>
                <View style={styles.offerLeft}>
                  <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>SPECIAL OFFER</Text>
                  </View>
                  <Text style={[styles.offerHeading, { color: colors.text }]}>Flat 20% OFF</Text>
                  <Text style={[styles.offerSubheading, { color: colors.textSecondary }]}>
                    On your first home services booking
                  </Text>
                  <View style={styles.couponCodeContainer}>
                    <Text style={styles.couponLabel}>USE CODE:</Text>
                    <Text style={styles.couponCode}>JUST20</Text>
                  </View>
                </View>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=300&auto=format&fit=crop' }}
                  style={styles.offerImage}
                />
              </View>
            </View>
          </View>
        )}

        {/* ================================================================ */}
        {/* CASE B: Keyword active but NO service selected -> Show Suggestions */}
        {/* ================================================================ */}
        {input.trim().length > 0 && !selectedService && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Suggestions</Text>
            {servicesQuery.isLoading ? (
              <View style={styles.feedbackContainer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : services.length ? (
              services.map((service) => (
                <Pressable
                  key={service._id}
                  onPress={() => handleServiceSelect(service)}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.suggestionIconWrapper, { backgroundColor: colors.background }]}>
                    <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>{service.name}</Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                      {service.estimatedDuration} mins delivery duration
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              ))
            ) : (
              <View style={styles.noResultsCompact}>
                <Ionicons name="search" size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
                <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>No matching services found</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                  Try searching for "Electrician", "AC Repair", or "Plumber".
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ================================================================ */}
        {/* CASE C: Service is selected -> Show Provider Listings */}
        {/* ================================================================ */}
        {selectedService && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                Professionals for {selectedService.name}
              </Text>
              <Text style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
                Displaying matching providers near your current location
              </Text>
            </View>

            {!address ? (
              <Pressable
                onPress={() => router.push('/(customer)/addresses')}
                style={[styles.noAddressCard, { borderColor: colors.border }]}
              >
                <Ionicons name="navigate-outline" size={24} color={colors.primary} />
                <Text style={[styles.noAddressTitle, { color: colors.text }]}>Set Service Location</Text>
                <Text style={[styles.noAddressDesc, { color: colors.textSecondary }]}>
                  Add a delivery address to lookup service professionals in your area.
                </Text>
                <View style={[styles.addAddressBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.addAddressText}>Add Address</Text>
                </View>
              </Pressable>
            ) : providersQuery.isLoading ? (
              <View style={styles.providersLoader}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Finding nearby experts...</Text>
              </View>
            ) : providersQuery.isError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
                <Text style={[typography.bodyMedium, { color: colors.text, marginTop: 8 }]}>Could not fetch providers.</Text>
                <Pressable onPress={handleRetry} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : providers.length ? (
              <View style={styles.providerCardList}>
                {providers.map((provider) => {
                  const isFav = favorites[provider.providerId] || false;
                  return (
                    <View
                      key={provider.providerServiceId}
                      style={[styles.providerPremiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      {/* Avatar Image & Online indicator */}
                      <View style={styles.providerHeaderRow}>
                        <View style={styles.avatarWrapper}>
                          <Image source={{ uri: getAvatarUrl(provider.businessName) }} style={styles.providerAvatar} />
                          <View style={styles.onlineBadge} />
                        </View>

                        {/* Title, rating, verified badge */}
                        <View style={styles.providerDetailsCol}>
                          <View style={styles.titleWithVerified}>
                            <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
                              {provider.businessName}
                            </Text>
                            <View style={styles.verifiedIconContainer}>
                              <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                            </View>
                          </View>

                          <View style={styles.providerRatingRow}>
                            <Ionicons name="star" size={14} color={colors.secondary} />
                            <Text style={[styles.ratingVal, { color: colors.text }]}>
                              {provider.rating.toFixed(1)}
                            </Text>
                            <Text style={styles.ratingCount}> (24 completed jobs)</Text>
                          </View>
                        </View>

                        {/* Favorite button toggle */}
                        <Pressable onPress={() => toggleFavorite(provider.providerId)} style={styles.favToggleBtn}>
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFav ? '#EF4444' : colors.textSecondary}
                          />
                        </Pressable>
                      </View>

                      {/* Travel Meta */}
                      <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.providerMetaRow}>
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>DISTANCE</Text>
                          <Text style={[styles.metaVal, { color: colors.text }]}>{provider.distance.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>EXPERIENCE</Text>
                          <Text style={[styles.metaVal, { color: colors.text }]}>{provider.experience} years</Text>
                        </View>
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>EST. ARRIVAL</Text>
                          <Text style={[styles.metaVal, { color: colors.text }]}>15 mins</Text>
                        </View>
                      </View>

                      <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

                      {/* Pricing and book now block */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.startingPriceLabel}>STARTING PRICE</Text>
                          <Text style={[styles.priceTag, { color: colors.primary }]}>₹{provider.price}</Text>
                        </View>

                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/(customer)/book-service',
                              params: {
                                providerId: provider.providerId,
                                providerServiceId: provider.providerServiceId,
                                businessName: provider.businessName,
                                price: String(provider.price),
                                serviceId: selectedService._id,
                                serviceName: selectedService.name,
                              },
                            })
                          }
                          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                        >
                          <Text style={styles.bookBtnText}>Book Now</Text>
                          <Ionicons name="arrow-forward" size={14} color="#FFF" style={{ marginLeft: 4 }} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noResultsCard}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noResultsHeading, { color: colors.text }]}>No providers found nearby</Text>
                <Text style={[styles.noResultsBody, { color: colors.textSecondary }]}>
                  We couldn't find any active service professionals within your local area. Try expanding your search radius.
                </Text>
                <View style={styles.noResultsBtnRow}>
                  <Pressable
                    onPress={handleOpenFilters}
                    style={[styles.resultsActionBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.resultsActionText}>Expand Filters</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClearSelection}
                    style={[styles.resultsActionBtnOutline, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.resultsActionTextOutline, { color: colors.text }]}>Try Another Service</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================================================================ */}
      {/* 2. FILTER BOTTOM SHEET PANEL */}
      {/* ================================================================ */}
      <Modal visible={isFilterVisible} animationType="slide" transparent>
        <Pressable onPress={() => setIsFilterVisible(false)} style={styles.modalOverlay}>
          <View style={[styles.bottomSheetContainer, { backgroundColor: colors.surface }]}>
            {/* Drag Handle Indicator */}
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

            {/* Title block */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter & Sort Options</Text>
              <Pressable onPress={() => setIsFilterVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {/* Filter settings scroll area */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
              {/* Sort selector */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text }]}>Sort By</Text>
                <View style={styles.sortOptionsRow}>
                  {[
                    { label: 'Nearest', value: 'distance' },
                    { label: 'Highest Rated', value: 'rating' },
                    { label: 'Lowest Price', value: 'price' },
                  ].map((option) => {
                    const isSelected = tempFilters.sortBy === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setTempFilters((prev) => ({ ...prev, sortBy: option.value }))}
                        style={[
                          styles.sortItem,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? '#DCFCE7' : colors.surface,
                          },
                        ]}
                      >
                        <Text style={[styles.sortText, { color: isSelected ? colors.primary : colors.text }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Price filter inputs */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text }]}>Price Cap (Starting Price)</Text>
                <View style={styles.priceRow}>
                  <View style={[styles.priceInputBox, { borderColor: colors.border }]}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={tempFilters.minPrice ? String(tempFilters.minPrice) : ''}
                      onChangeText={(val) =>
                        setTempFilters((prev) => ({ ...prev, minPrice: val ? Number(val) : undefined }))
                      }
                      placeholder="Min Price"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.priceTextInput, { color: colors.text }]}
                    />
                  </View>
                  <Text style={[styles.rangeToText, { color: colors.textSecondary }]}>to</Text>
                  <View style={[styles.priceInputBox, { borderColor: colors.border }]}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={tempFilters.maxPrice ? String(tempFilters.maxPrice) : ''}
                      onChangeText={(val) =>
                        setTempFilters((prev) => ({ ...prev, maxPrice: val ? Number(val) : undefined }))
                      }
                      placeholder="Max Price"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.priceTextInput, { color: colors.text }]}
                    />
                  </View>
                </View>
              </View>

              {/* Minimum rating selector */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text }]}>Minimum Rating</Text>
                <View style={styles.sortOptionsRow}>
                  {[undefined, 4.0, 4.5, 4.8].map((rating) => {
                    const isSelected = tempFilters.minRating === rating;
                    const label = rating === undefined ? 'Any' : `⭐ ${rating}+`;
                    return (
                      <Pressable
                        key={String(rating)}
                        onPress={() => setTempFilters((prev) => ({ ...prev, minRating: rating }))}
                        style={[
                          styles.sortItem,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? '#DCFCE7' : colors.surface,
                          },
                        ]}
                      >
                        <Text style={[styles.sortText, { color: isSelected ? colors.primary : colors.text }]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Experience selector */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text }]}>Minimum Experience</Text>
                <View style={styles.sortOptionsRow}>
                  {[undefined, 2, 5, 8].map((exp) => {
                    const isSelected = tempFilters.minExperience === exp;
                    const label = exp === undefined ? 'Any' : `${exp}+ years`;
                    return (
                      <Pressable
                        key={String(exp)}
                        onPress={() => setTempFilters((prev) => ({ ...prev, minExperience: exp }))}
                        style={[
                          styles.sortItem,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? '#DCFCE7' : colors.surface,
                          },
                        ]}
                      >
                        <Text style={[styles.sortText, { color: isSelected ? colors.primary : colors.text }]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Action buttons footer */}
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={handleResetFilters}
                style={[styles.sheetFooterBtnOutline, { borderColor: colors.border }]}
              >
                <Text style={[styles.sheetFooterBtnOutlineText, { color: colors.text }]}>Reset</Text>
              </Pressable>
              <Pressable onPress={handleApplyFilters} style={[styles.sheetFooterBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.sheetFooterBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ================================================================ */}
      {/* 3. VOICE SEARCH MODAL OVERLAY */}
      {/* ================================================================ */}
      <Modal visible={isVoiceVisible} transparent animationType="fade">
        <View style={styles.voiceSearchOverlay}>
          <View style={styles.voiceSearchCard}>
            <Text style={styles.voiceSearchTitle}>Listening...</Text>
            <Text style={styles.voiceSearchSubtitle}>Say a service like "Plumber" or "AC Repair"</Text>

            {/* Pulsing mic waves */}
            <View style={styles.pulseContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [
                      {
                        scale: voiceWaveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.5],
                        }),
                      },
                    ],
                    opacity: voiceWaveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseRingInner,
                  {
                    transform: [
                      {
                        scale: voiceWaveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.8],
                        }),
                      },
                    ],
                    opacity: voiceWaveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0],
                    }),
                  },
                ]}
              />
              <View style={styles.micCircle}>
                <Ionicons name="mic" size={40} color="#FFF" />
              </View>
            </View>

            <Pressable onPress={() => setIsVoiceVisible(false)} style={styles.voiceCancelBtn}>
              <Text style={styles.voiceCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaViewContainer>
  );
}

// Custom wrapper to properly handle cross-platform safe areas on tab screens
function SafeAreaViewContainer({ children, style }: { children: React.ReactNode; style?: any }) {
  if (Platform.OS === 'ios') {
    return <View style={[{ flex: 1, paddingTop: 48 }, style]}>{children}</View>;
  }
  return <View style={[{ flex: 1, paddingTop: 24 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontWeight: '600',
    marginHorizontal: 4,
    maxWidth: 240,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingBottom: 2,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 110, // Generous padding to prevent floating system bars overlaying content
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recentSearchesList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentSearchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentClock: {
    marginRight: 10,
  },
  recentSearchRemove: {
    padding: 6,
  },
  popularRow: {
    paddingVertical: 4,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridLoader: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
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
  categoryChevron: {
    position: 'absolute',
    right: 6,
    bottom: 6,
  },
  offerBannerWrapper: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  offerBanner: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
  },
  offerLeft: {
    flex: 1.3,
    justifyContent: 'center',
  },
  badgeWrapper: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  offerHeading: {
    fontSize: 22,
    fontWeight: '800',
  },
  offerSubheading: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  couponLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  couponCode: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderStyle: 'dashed',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  offerImage: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  feedbackContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  suggestionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsCompact: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  noAddressCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    marginTop: 10,
  },
  noAddressTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  noAddressDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  addAddressBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  addAddressText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  providersLoader: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
  providerCardList: {
    gap: 14,
  },
  providerPremiumCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 16,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  providerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  providerDetailsCol: {
    flex: 1,
  },
  titleWithVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  verifiedIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  favToggleBtn: {
    padding: 6,
  },
  metaDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  providerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startingPriceLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceTag: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noResultsCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#F8FAFC',
    marginTop: 10,
  },
  noResultsHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  noResultsBody: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  noResultsBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  resultsActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resultsActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsActionBtnOutline: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resultsActionTextOutline: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginTop: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  sortOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortItem: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 46,
  },
  currencySymbol: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 4,
  },
  priceTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  rangeToText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sheetFooterBtnOutline: {
    flex: 1,
    borderWidth: 1.5,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetFooterBtnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetFooterBtn: {
    flex: 1.8,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetFooterBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceSearchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceSearchCard: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  voiceSearchTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  voiceSearchSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  pulseContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16A34A',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E',
  },
  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  voiceCancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: '100%',
    alignItems: 'center',
  },
  voiceCancelText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
