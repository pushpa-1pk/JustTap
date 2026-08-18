import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface QuickActionsProps {
  onSchedulePress: () => void;
  onAvailabilityPress: () => void;
  onSupportPress: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSchedulePress,
  onAvailabilityPress,
  onSupportPress,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>
        QUICK ACTIONS
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          onPress={onSchedulePress}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: colors.surfaceVariant },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel="View Schedule"
          accessibilityRole="button"
        >
          <Ionicons name="calendar-outline" size={16} color={colors.text} style={styles.chipIcon} />
          <Text style={[typography.bodySmall, styles.chipLabel, { color: colors.text }]}>View Schedule</Text>
        </Pressable>

        <Pressable
          onPress={onAvailabilityPress}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: colors.surfaceVariant },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel="Availability Settings"
          accessibilityRole="button"
        >
          <Ionicons name="time-outline" size={16} color={colors.text} style={styles.chipIcon} />
          <Text style={[typography.bodySmall, styles.chipLabel, { color: colors.text }]}>Availability</Text>
        </Pressable>

        <Pressable
          onPress={onSupportPress}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: colors.surfaceVariant },
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel="Get Support"
          accessibilityRole="button"
        >
          <Ionicons name="help-buoy-outline" size={16} color={colors.text} style={styles.chipIcon} />
          <Text style={[typography.bodySmall, styles.chipLabel, { color: colors.text }]}>Support</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    height: 40, // 40dp chip target (Section 11)
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontWeight: '700',
  },
});
