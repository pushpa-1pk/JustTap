import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSearchProvidersMatchingMutation } from '@/redux/api/matchingApi';
import useDebounce from '@/hooks/useDebounce';
import Shimmer from '@/components/common/Shimmer';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function CustomerSearchScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    categoryId?: string; 
    categoryName?: string;
    serviceId?: string;
    serviceName?: string;
  }>();

  // Search keyword state
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 500);

  // Filters State
  const [selectedSort, setSelectedSort] = useState<'distance' | 'rating' | 'price'>('distance');
  const [minExperience, setMinExperience] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Matching Service API Mutation
  const [searchProviders, { data: searchResults, isLoading, isError }] = useSearchProvidersMatchingMutation();
  const providers = searchResults?.data?.providers || [];

  // Triggers API search when inputs/filters change
  useEffect(() => {
    const performSearch = async () => {
      try {
        await searchProviders({
          latitude: 19.0760, // Default coordinates for Mumbai Center
          longitude: 72.8777,
          categoryId: params.categoryId || undefined,
          serviceId: params.serviceId || undefined,
          keyword: debouncedKeyword || undefined,
          maxPrice,
          minExperience,
          sortBy: selectedSort,
          sortOrder: selectedSort === 'price' ? 'asc' : 'desc',
          limit: 20,
        }).unwrap();
      } catch (err) {
        console.error('Matching service search failed:', err);
      }
    };

    performSearch();
  }, [debouncedKeyword, params.categoryId, params.serviceId, selectedSort, minExperience, maxPrice, searchProviders]);

  const handleBookNow = (provider: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/(customer)/bookings', // We will route to a book request view in future stack, but go to bookings for redirection check
      params: { 
        providerId: provider.userId,
        providerServiceId: provider.providerServiceId,
        businessName: provider.businessName,
        price: provider.price,
        serviceId: params.serviceId || ''
      }
    });
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMinExperience(undefined);
    setMaxPrice(undefined);
    setSelectedSort('distance');
    setKeyword('');
    setShowFilterModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input Header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.inputBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <SvgIcon name="briefcase" color={colors.textSecondary} size={18} />
          <TextInput
            style={[styles.input, typography.bodyLarge, { color: colors.text }]}
            placeholder={params.serviceName ? `Searching ${params.serviceName}...` : "Search for electrician, cleaner..."}
            placeholderTextColor={colors.textSecondary}
            value={keyword}
            onChangeText={setKeyword}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filter Toggle Button */}
        <Pressable 
          style={[styles.filterBtn, { borderColor: colors.border }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilterModal(!showFilterModal);
          }}
        >
          <SvgIcon name="briefcase" color={colors.text} size={20} />
        </Pressable>
      </View>

      {/* Dynamic Filters panel */}
      {showFilterModal && (
        <View style={[styles.filterPanel, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: '700', marginBottom: spacing.xs }]}>
            SORT BY
          </Text>
          <View style={styles.filterRow}>
            {['distance', 'rating', 'price'].map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.pillBtn,
                  { 
                    backgroundColor: selectedSort === option ? colors.primary : colors.surfaceVariant,
                    borderColor: selectedSort === option ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setSelectedSort(option as any)}
              >
                <Text style={[typography.caption, { color: selectedSort === option ? colors.onPrimary : colors.text, textTransform: 'capitalize' }]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[typography.bodySmall, { color: colors.textSecondary, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs }]}>
            EXPERIENCE FILTER
          </Text>
          <View style={styles.filterRow}>
            {[2, 5, 8].map((exp) => (
              <Pressable
                key={exp}
                style={[
                  styles.pillBtn,
                  { 
                    backgroundColor: minExperience === exp ? colors.primary : colors.surfaceVariant,
                    borderColor: minExperience === exp ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setMinExperience(minExperience === exp ? undefined : exp)}
              >
                <Text style={[typography.caption, { color: minExperience === exp ? colors.onPrimary : colors.text }]}>
                  {exp}+ Years
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.clearBtn, { marginTop: spacing.md }]} onPress={clearFilters}>
            <Text style={[typography.bodySmall, { color: colors.danger, fontWeight: '700' }]}>Reset All Filters</Text>
          </Pressable>
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsSummary}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, fontWeight: '600' }]}>
          {isLoading ? 'Searching...' : `${providers.length} providers found near you`}
        </Text>
      </View>

      {/* Providers List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {[1, 2, 3].map(k => (
            <View key={k} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Shimmer width={180} height={20} />
                <Shimmer width={50} height={20} />
              </View>
              <Shimmer width={120} height={14} style={{ marginTop: 12 }} />
              <Shimmer width={'100%'} height={40} style={{ marginTop: 16 }} />
            </View>
          ))}
        </ScrollView>
      ) : isError ? (
        <View style={styles.emptyContainer}>
          <Text style={[typography.bodyLarge, { color: colors.danger }]}>Network connection error.</Text>
        </View>
      ) : providers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[typography.h3, { color: colors.text }]}>No Providers Nearby</Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Try widening your experience filters or typing a different service.
          </Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.text, fontWeight: '700' }]}>{item.businessName}</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    📍 {item.distance.toFixed(1)} km away • {item.experience} years experience
                  </Text>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '800' }]}>★ {item.rating || '4.5'}</Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
                <View>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>ESTIMATED PRICE</Text>
                  <Text style={[typography.h2, { color: colors.secondary, fontWeight: '800' }]}>₹{item.price}</Text>
                </View>

                <Pressable
                  style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleBookNow(item)}
                >
                  <Text style={[typography.buttonText, { color: colors.onPrimary, fontSize: 14 }]}>Book Instant</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    padding: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  filterPanel: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  resultsSummary: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  bookBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
