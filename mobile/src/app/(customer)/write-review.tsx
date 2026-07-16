import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCreateReviewMutation } from '@/redux/api/reviewApi';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

const REVIEW_TAGS = ['On-Time', 'Polite', 'Expert', 'Fair Price', 'Well Behaved', 'Clean Work'];

export default function WriteReviewScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    providerId: string;
    serviceId: string;
    serviceName?: string;
    businessName?: string;
  }>();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mutation
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const handleToggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await createReview({
        bookingId: params.bookingId,
        providerId: params.providerId,
        serviceId: params.serviceId,
        rating,
        title: title || undefined,
        comment: comment || undefined,
        tags: selectedTags,
        images: [],
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Review Submitted', 'Thank you for your valuable feedback!');
      router.back();
    } catch (err: any) {
      console.error('Submit review failed:', err);
      Alert.alert('Error', err.data?.message || 'Failed to submit review');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>RATE SERVICE FOR</Text>
        <Text style={[typography.h2, { color: colors.text, marginTop: 4 }]}>{params.businessName || 'Service Provider'}</Text>
        <Text style={[typography.bodyMedium, { color: colors.secondary, fontWeight: '700' }]}>
          {params.serviceName || 'Home Maintenance'}
        </Text>
      </View>

      {/* Star Selector */}
      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginBottom: spacing.md }]}>
          How was your experience?
        </Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= rating;
            return (
              <Pressable
                key={star}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setRating(star);
                }}
                style={styles.starPressable}
              >
                {/* Custom drawn Star SVG */}
                <View style={styles.starIcon}>
                  <Text style={[styles.starText, { color: active ? colors.primary : colors.border }]}>
                    ★
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Review Fields */}
      <View style={styles.fields}>
        <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary }]}>REVIEW TITLE</Text>
        <TextInput
          style={[styles.input, typography.bodyLarge, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. Excellent speed & quality"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>DETAILED FEEDBACK</Text>
        <TextInput
          style={[
            styles.input, 
            styles.textArea,
            typography.bodyMedium, 
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
          ]}
          placeholder="Share details of the work done..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        {/* Tags Selector */}
        <Text style={[styles.label, typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>QUICK HIGHLIGHTS</Text>
        <View style={styles.tagGrid}>
          {REVIEW_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[
                  styles.tagPill,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => handleToggleTag(tag)}
              >
                <Text style={[
                  typography.caption, 
                  { color: isSelected ? colors.onPrimary : colors.text }
                ]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: spacing.xl }]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Submit Review</Text>
        )}
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  section: {
    alignItems: 'center',
    marginBottom: 24,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starPressable: {
    padding: 4,
  },
  starIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    fontSize: 40,
    lineHeight: 44,
  },
  fields: {
    width: '100%',
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});
