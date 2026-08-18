import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

export const EarningsHeader: React.FC = () => {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Text style={[typography.h2, styles.title, { color: colors.text }]}>
        Earnings
      </Text>
      <Text style={[typography.bodySmall, styles.subtitle, { color: colors.textSecondary }]}>
        Track your income
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '800',
    fontSize: 24,
  },
  subtitle: {
    marginTop: 2,
    fontWeight: '600',
  },
});
export default EarningsHeader;
