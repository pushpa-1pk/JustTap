import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentJob } from '../../../types/provider';
import { RecentActivityRow } from './RecentActivityRow';
import { EmptyActivityState } from './EmptyActivityState';
import { useTheme } from '../../../hooks/useTheme';

interface RecentActivityProps {
  jobs: RecentJob[];
  onViewAllPress: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  jobs,
  onViewAllPress,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[typography.caption, styles.sectionTitle, { color: colors.textSecondary }]}>
        RECENT ACTIVITY
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {jobs.length === 0 ? (
          <EmptyActivityState />
        ) : (
          <View>
            {jobs.map((job) => (
              <RecentActivityRow key={job.id} job={job} />
            ))}
            
            <Pressable
              onPress={onViewAllPress}
              style={({ pressed }) => [
                styles.viewAllBtn,
                pressed && { opacity: 0.8 }
              ]}
              accessibilityLabel="View all completed jobs"
              accessibilityRole="button"
            >
              <Text style={[typography.bodyMedium, styles.viewAllText, { color: colors.secondary }]}>
                View All
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  viewAllBtn: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewAllText: {
    fontWeight: '800',
  },
});
