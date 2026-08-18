import React from 'react';
import { FlatList, RefreshControl, ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { ProviderJob } from '../../../types/job';
import { JobCard } from './JobCard';
import { ActiveJobCard } from './ActiveJobCard';
import { JobEmptyState } from './JobEmptyState';
import { useTheme } from '../../../hooks/useTheme';

interface JobListProps {
  tab: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  jobs: ProviderJob[];
  activeJob: ProviderJob | null;
  isActionLoading: boolean;
  onActionPress: (jobId: string, currentStatus: string) => void;
  onOpenTracking: (jobId: string) => void;
  onCardPress: (jobId: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  loadingMore: boolean;
  onLoadMore: () => void;
  hasNextPage: boolean;
}

export const JobList: React.FC<JobListProps> = ({
  tab,
  jobs,
  activeJob,
  isActionLoading,
  onActionPress,
  onOpenTracking,
  onCardPress,
  refreshing,
  onRefresh,
  loadingMore,
  onLoadMore,
  hasNextPage,
}) => {
  const { colors } = useTheme();

  // Active Tab Rule: Active job always pins to top, and list contains other jobs
  const renderHeader = () => {
    if (tab === 'ACTIVE' && activeJob) {
      return (
        <ActiveJobCard
          job={activeJob}
          isActionLoading={isActionLoading}
          onActionPress={onActionPress}
          onOpenTracking={onOpenTracking}
          onPress={() => onCardPress(activeJob.id)}
        />
      );
    }
    return null;
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={colors.secondary} size="small" />
        </View>
      );
    }
    return null;
  };

  const visibleJobs = tab === 'ACTIVE' ? [] : jobs; // Active tab has only the active job (pinned at top)

  // Empty state logic: if no active job and list is empty
  const isEmpty = (tab === 'ACTIVE' && !activeJob) || (tab !== 'ACTIVE' && visibleJobs.length === 0);

  if (isEmpty && !refreshing) {
    return (
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<JobEmptyState tab={tab} />}
        contentContainerStyle={styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      />
    );
  }

  return (
    <FlatList
      data={visibleJobs}
      renderItem={({ item }) => (
        <JobCard job={item} onPress={() => onCardPress(item.id)} />
      )}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (hasNextPage && !loadingMore && !refreshing) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.secondary]}
          tintColor={colors.secondary}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerLoader: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default JobList;
