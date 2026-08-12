import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface LatestReviewCardProps {
  rating: number;
  comment: string;
  reviewerName: string;
  onViewAllPress: () => void;
}

export default function LatestReviewCard({
  rating,
  comment,
  reviewerName,
  onViewAllPress,
}: LatestReviewCardProps) {
  const { typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700' }]}>
          ⭐ Latest Customer Review
        </Text>
        <Pressable onPress={onViewAllPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
            View All Reviews →
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < Math.floor(rating) ? 'star' : 'star-outline'}
              size={14}
              color="#FBBF24"
            />
          ))}
          <Text style={[typography.bodySmall, { color: '#0F172A', fontWeight: '700', marginLeft: 6 }]}>
            {rating.toFixed(1)}
          </Text>
        </View>

        <Text style={[typography.bodyMedium, { color: '#0F172A', fontStyle: 'italic', marginTop: 10, lineHeight: 20 }]}>
          "{comment}"
        </Text>

        <Text style={[typography.caption, { color: '#64748B', marginTop: 10, fontWeight: '600' }]}>
          — {reviewerName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
