import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

type TabType = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface JobsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const JobsTabs: React.FC<JobsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colors, typography } = useTheme();

  const tabs: Array<{ key: TabType; label: string }> = [
    { key: 'UPCOMING', label: 'Upcoming' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                isSelected && { borderBottomColor: colors.primary }, // Brand yellow accent (Section 7)
                pressed && { opacity: 0.8 },
              ]}
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  styles.tabLabel,
                  { color: isSelected ? colors.text : colors.textSecondary },
                  isSelected && { fontWeight: '800' }
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: {
    height: 48, // 48dp touch target height (Section 7)
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontWeight: '600',
  },
});
export default JobsTabs;
