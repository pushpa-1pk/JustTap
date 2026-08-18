import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { EarningsPeriod } from '../../../types/earnings';
import { useTheme } from '../../../hooks/useTheme';

interface PeriodSelectorProps {
  selectedPeriod: EarningsPeriod;
  onPeriodChange: (period: EarningsPeriod) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const { colors, typography } = useTheme();

  const options: Array<{ key: EarningsPeriod; label: string }> = [
    { key: 'TODAY', label: 'Today' },
    { key: 'WEEK', label: 'Week' },
    { key: 'MONTH', label: 'Month' },
    { key: 'CUSTOM', label: 'Custom' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant }]}>
      {options.map((opt) => {
        const isSelected = selectedPeriod === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onPeriodChange(opt.key)}
            style={[
              styles.segment,
              isSelected && { backgroundColor: colors.surface }
            ]}
            accessibilityLabel={`${opt.label} filter`}
            accessibilityRole="button"
          >
            <Text
              style={[
                typography.bodySmall,
                styles.labelText,
                { color: isSelected ? colors.text : colors.textSecondary },
                isSelected && { fontWeight: '800' }
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 3,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontWeight: '700',
  },
});
export default PeriodSelector;
