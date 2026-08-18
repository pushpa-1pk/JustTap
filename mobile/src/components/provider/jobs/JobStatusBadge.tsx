import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobStatus } from '../../../types/job';
import { useTheme } from '../../../hooks/useTheme';

interface JobStatusBadgeProps {
  status: JobStatus;
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
  const { colors, typography } = useTheme();

  // Status mappings to colors and icons (Section 26)
  const getBadgeConfig = () => {
    switch (status) {
      case 'SCHEDULED':
        return {
          text: 'SCHEDULED',
          bg: colors.surfaceVariant,
          textCol: colors.textSecondary,
          icon: 'calendar-outline' as const,
        };
      case 'ACCEPTED':
        return {
          text: 'ACCEPTED',
          bg: '#EAFDF0',
          textCol: colors.secondary,
          icon: 'checkmark-circle-outline' as const,
        };
      case 'ON_THE_WAY':
        return {
          text: 'ON THE WAY',
          bg: '#EFF6FF',
          textCol: '#2563EB',
          icon: 'bicycle-outline' as const,
        };
      case 'ARRIVED':
        return {
          text: 'ARRIVED',
          bg: '#EFF6FF',
          textCol: '#2563EB',
          icon: 'pin-outline' as const,
        };
      case 'SERVICE_STARTED':
        return {
          text: 'STARTED',
          bg: '#EFF6FF',
          textCol: '#2563EB',
          icon: 'hammer-outline' as const,
        };
      case 'COMPLETED':
        return {
          text: 'COMPLETED',
          bg: '#EAFDF0',
          textCol: colors.secondary,
          icon: 'checkmark-done-circle-outline' as const,
        };
      case 'CANCELLED':
        return {
          text: 'CANCELLED',
          bg: '#FEF2F2',
          textCol: colors.danger,
          icon: 'close-circle-outline' as const,
        };
      default:
        return {
          text: String(status),
          bg: colors.surfaceVariant,
          textCol: colors.textSecondary,
          icon: 'alert-circle-outline' as const,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={13} color={config.textCol} />
      <Text style={[typography.caption, styles.text, { color: config.textCol }]}>
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  text: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
export default JobStatusBadge;
