import React from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useGetProviderProfile, useGetProviderReviews, useGetProviderReviewSummary } from '@/hooks/useProviderProfile';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerReviewsScreen() {
  const { colors, typography, spacing } = useTheme();

  // Queries
  const { data: profile, isLoading: isProfileLoading } = useGetProviderProfile();
  
  const providerId = profile?.userId || '';
  const { data: summary, isLoading: isSummaryLoading } = useGetProviderReviewSummary(providerId);
  const { data: reviews, isLoading: isReviewsLoading } = useGetProviderReviews(providerId);

  const isLoading = isProfileLoading || isSummaryLoading || isReviewsLoading;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const ratingSummary = summary || {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };

  const totalBreakdown = (Object.values(ratingSummary.ratingBreakdown) as number[]).reduce((a, b) => a + b, 0) || 1;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Overall Score Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.scoreCol}>
            <Text style={styles.averageScoreText}>{ratingSummary.averageRating.toFixed(1)}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <Ionicons 
                  key={i} 
                  name={i <= Math.round(ratingSummary.averageRating) ? 'star' : 'star-outline'} 
                  size={16} 
                  color={colors.primary} 
                />
              ))}
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {ratingSummary.totalReviews} Reviews
            </Text>
          </View>

          {/* Breakdown sliders */}
          <View style={styles.breakdownCol}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingSummary.ratingBreakdown[stars as 5|4|3|2|1] || 0;
              const percent = (count / totalBreakdown) * 100;
              return (
                <View key={stars} style={styles.breakdownLine}>
                  <Text style={[typography.caption, { color: colors.textSecondary, width: 12 }]}>{stars}</Text>
                  <Ionicons name="star" size={10} color={colors.primary} style={{ marginHorizontal: 4 }} />
                  <View style={[styles.sliderTrack, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={[styles.sliderFill, { width: `${percent}%`, backgroundColor: colors.secondary }]} />
                  </View>
                  <Text style={[typography.caption, { color: colors.textSecondary, width: 24, textAlign: 'right' }]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Review List */}
      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }]}>Recent Feedback</Text>
      
      {reviews && reviews.length > 0 ? (
        reviews.map((rev) => (
          <View key={rev._id} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerAvatar}>
                <Ionicons name="person" size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{rev.reviewerName}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {new Date(rev.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Ionicons 
                    key={i} 
                    name={i <= rev.rating ? 'star' : 'star-outline'} 
                    size={14} 
                    color={colors.primary} 
                  />
                ))}
              </View>
            </View>

            <Text style={[typography.bodyMedium, { color: colors.text, marginTop: 10, lineHeight: 18 }]}>
              {rev.comment}
            </Text>

            {/* Review Photos */}
            {rev.photos && rev.photos.length > 0 && (
              <View style={styles.photoRow}>
                {rev.photos.map((photo, idx) => (
                  <ExpoImage 
                    key={idx} 
                    source={{ uri: photo }} 
                    style={styles.reviewPhoto} 
                    contentFit="cover" 
                  />
                ))}
              </View>
            )}

            {/* Provider Response */}
            {rev.providerResponse ? (
              <View style={[styles.replyContainer, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.replyHeader}>
                  <Ionicons name="arrow-undo-sharp" size={14} color={colors.secondary} />
                  <Text style={[typography.caption, { color: colors.secondary, fontWeight: '700', marginLeft: 6 }]}>
                    Your Response
                  </Text>
                </View>
                <Text style={[typography.bodyMedium, { color: colors.text, marginTop: 4, fontStyle: 'italic' }]}>
                  {rev.providerResponse}
                </Text>
              </View>
            ) : (
              <Pressable style={[styles.replyBtn, { borderColor: colors.border }]}>
                <Ionicons name="chatbubble-ellipses" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6, fontWeight: '600' }]}>
                  Write a reply...
                </Text>
              </Pressable>
            )}
          </View>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="chatbubbles" size={40} color={colors.textSecondary} />
          <Text style={[typography.bodyLarge, { color: colors.text, marginTop: 12, fontWeight: '700' }]}>No Reviews Yet</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
            When customers rate your completed plumbing or repair services, their comments will show up here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  averageScoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1.5,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  replyContainer: {
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
