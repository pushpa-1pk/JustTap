import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useGetCustomerReviews } from '@/hooks/useReviews';
import { useTheme } from '@/hooks/useTheme';

export default function ReviewsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const { data: reviewsData, isLoading } = useGetCustomerReviews(page, 20);

  const reviews = reviewsData?.docs || [];

  if (isLoading && page === 1) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView style={[styles.container]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
          <Text style={[typography.bodyLarge, { color: colors.textSecondary, marginTop: 12 }]}>
            You haven't written any reviews yet.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reviews.map((rev) => (
            <View key={rev._id} style={[styles.reviewCard, { borderColor: colors.border }]}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < rev.rating ? 'star' : 'star-outline'}
                      size={16}
                      color={i < rev.rating ? '#FBC02D' : colors.textSecondary}
                    />
                  ))}
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(rev.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {/* Title & Comment */}
              {rev.title ? (
                <Text style={[styles.reviewTitle, { color: colors.text }]}>{rev.title}</Text>
              ) : null}
              {rev.comment ? (
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                  {rev.comment}
                </Text>
              ) : null}

              {/* Booking Reference */}
              <View style={[styles.bookingRef, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="receipt-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.bookingRefText, { color: colors.textSecondary }]}>
                  Booking Ref: #{rev.bookingId.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: { padding: 4 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  list: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 12,
  },
  bookingRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookingRefText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
