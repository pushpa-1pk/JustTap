import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface EarningsSnapshotProps {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  onViewEarningsPress: () => void;
}

type FilterTab = 'today' | 'week' | 'month';

export default function EarningsSnapshot({
  todayEarnings,
  weeklyEarnings,
  monthlyEarnings,
  onViewEarningsPress,
}: EarningsSnapshotProps) {
  const { typography } = useTheme();
  const [activeTab, setActiveTab] = useState<FilterTab>('today');

  const getDisplayEarnings = () => {
    switch (activeTab) {
      case 'today': return todayEarnings;
      case 'week': return weeklyEarnings;
      case 'month': return monthlyEarnings;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700' }]}>
          Earnings Snapshot
        </Text>
        <Pressable onPress={onViewEarningsPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={[typography.bodyMedium, { color: '#16A34A', fontWeight: '700' }]}>
            View Earnings →
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
        {/* Tab Filters */}
        <View style={[styles.tabBar, { backgroundColor: '#F8FAFC' }]}>
          {(['today', 'week', 'month'] as FilterTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabItem,
                activeTab === tab && { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
              ]}
            >
              <Text style={[
                typography.caption,
                { 
                  color: activeTab === tab ? '#0F172A' : '#64748B', 
                  fontWeight: activeTab === tab ? '700' : '500',
                  textTransform: 'capitalize' 
                }
              ]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Main Earnings Details */}
        <View style={styles.detailsRow}>
          <View>
            <Text style={[typography.h1, { color: '#0F172A', fontWeight: '900', fontSize: 32 }]}>
              ₹{getDisplayEarnings().toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
            <View style={styles.trendRow}>
              <Ionicons name="trending-up" size={16} color="#16A34A" />
              <Text style={[typography.caption, { color: '#16A34A', fontWeight: '700', marginLeft: 4 }]}>
                +12% <Text style={{ color: '#94A3B8', fontWeight: '400' }}>compared with yesterday</Text>
              </Text>
            </View>
          </View>

          {/* Premium Sparkline */}
          <View style={styles.sparklineWrapper}>
            <Svg height="40" width="110" viewBox="0 0 100 30">
              <Path
                d="M 5 25 Q 20 15 35 22 T 65 8 T 85 18 T 95 5"
                fill="none"
                stroke="#FBBF24" // Yellow accent line
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  sparklineWrapper: {
    paddingRight: 6,
  },
});
