import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface JobEmptyStateProps {
  tab: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export const JobEmptyState: React.FC<JobEmptyStateProps> = ({ tab }) => {
  const { colors, typography } = useTheme();

  const getEmptyStateConfig = () => {
    switch (tab) {
      case 'UPCOMING':
        return {
          icon: 'calendar-outline' as const,
          title: 'No upcoming jobs',
          description: 'Your accepted and scheduled jobs will appear here.',
        };
      case 'ACTIVE':
        return {
          icon: 'checkmark-circle-outline' as const,
          title: 'No active job',
          description: "You're currently free. Go online from Dashboard to receive new requests.",
        };
      case 'COMPLETED':
        return {
          icon: 'ribbon-outline' as const,
          title: 'No completed jobs yet',
          description: 'Your completed services will appear here.',
        };
      case 'CANCELLED':
        return {
          icon: 'ban-outline' as const,
          title: 'No cancelled jobs',
          description: 'Great! Nothing has been cancelled.',
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name={config.icon} size={36} color={colors.textSecondary} />
      </View>
      <Text style={[typography.h3, styles.title, { color: colors.text }]}>
        {config.title}
      </Text>
      <Text style={[typography.bodyMedium, styles.desc, { color: colors.textSecondary }]}>
        {config.description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
export default JobEmptyState;
