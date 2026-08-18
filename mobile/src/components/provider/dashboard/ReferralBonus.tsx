import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

export const ReferralBonus: React.FC = () => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="gift" size={20} color="#3B82F6" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[typography.bodyLarge, styles.title, { color: '#2563EB' }]}>
            Referral Bonus
          </Text>
          <Text style={[typography.bodySmall, styles.subText, { color: colors.textSecondary }]}>
            You've earned 3 referrals this week – ₹600 in bonuses!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '800',
    fontSize: 15,
  },
  subText: {
    marginTop: 2,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
  },
});
