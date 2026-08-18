import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface WithdrawButtonProps {
  availableBalance: number;
  isLoading: boolean;
  onPress: () => void;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({
  availableBalance,
  isLoading,
  onPress,
}) => {
  const { colors, typography } = useTheme();
  const isDisabled = availableBalance <= 0 || isLoading;

  return (
    <View style={styles.container}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.secondary },
          pressed && { opacity: 0.9 },
          isDisabled && { backgroundColor: '#E2E8F0' },
        ]}
        accessibilityLabel="Withdraw money"
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            style={[
              typography.buttonText,
              styles.btnText,
              { color: isDisabled ? colors.textSecondary : '#FFFFFF' },
            ]}
          >
            Withdraw Money
          </Text>
        )}
      </Pressable>

      {availableBalance <= 0 && (
        <Text style={[styles.subText, { color: colors.textSecondary }]}>
          No balance available for withdrawal
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  btn: {
    width: '100%',
    height: 56, // 56dp touch target height (Section 14)
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontWeight: '800',
  },
  subText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
export default WithdrawButton;
