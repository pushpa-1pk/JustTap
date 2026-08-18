import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { JobsSearch } from './JobsSearch';

interface JobsHeaderProps {
  isSearching: boolean;
  searchQuery: string;
  onSearchToggle: (active: boolean) => void;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
}

export const JobsHeader: React.FC<JobsHeaderProps> = ({
  isSearching,
  searchQuery,
  onSearchToggle,
  onSearchChange,
  onFilterPress,
}) => {
  const { colors, typography } = useTheme();

  if (isSearching) {
    return (
      <JobsSearch
        value={searchQuery}
        onChangeText={onSearchChange}
        onCancel={() => {
          onSearchChange('');
          onSearchToggle(false);
        }}
      />
    );
  }

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.titleContainer}>
        <Text style={[typography.h2, styles.title, { color: colors.text }]}>
          Jobs
        </Text>
        <Text style={[typography.bodySmall, styles.subtitle, { color: colors.textSecondary }]}>
          Manage your service requests
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <Pressable
          onPress={() => onSearchToggle(true)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Search jobs"
          accessibilityRole="button"
        >
          <Ionicons name="search" size={22} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={onFilterPress}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Filter jobs"
          accessibilityRole="button"
        >
          <Ionicons name="filter" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 24,
  },
  subtitle: {
    marginTop: 2,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default JobsHeader;
