import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

export const EmptyActivityState: React.FC = () => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      {/* Lightweight Graphic/Illustration Placeholder (Section 13) */}
      <View style={[styles.iconBg, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={[typography.h3, styles.title, { color: colors.text }]}>
        No jobs yet
      </Text>
      <Text style={[typography.bodyMedium, styles.subtitle, { color: colors.textSecondary }]}>
        Go online to start receiving requests.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
