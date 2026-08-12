import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface EarningsChartProps {
  dailyEarnings: number[]; // Array of 7 numbers (Mon to Sun)
}

export default function EarningsChart({ dailyEarnings }: EarningsChartProps) {
  const { typography } = useTheme();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const maxVal = Math.max(...dailyEarnings, 100); // Avoid divide by 0, min height baseline

  return (
    <View style={styles.container}>
      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700', marginBottom: 16 }]}>
        Weekly Activity
      </Text>

      {/* Chart Canvas */}
      <View style={styles.chartContainer}>
        {/* Y Axis Guides */}
        <View style={styles.yAxisGuides}>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>₹{(maxVal).toFixed(0)}</Text>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>₹{(maxVal / 2).toFixed(0)}</Text>
          <Text style={[typography.caption, { color: '#94A3B8' }]}>₹0</Text>
        </View>

        {/* Bars Container */}
        <View style={styles.barsContainer}>
          {dailyEarnings.map((val, idx) => {
            // Calculate height percentage
            const pct = (val / maxVal) * 100;
            const barHeight = Math.max(10, Math.min(100, pct)); // Clamp heights safely

            const isSelected = selectedDay === idx;

            return (
              <View key={idx} style={styles.barColumn}>
                {/* Tooltip */}
                {isSelected && (
                  <View style={[styles.tooltip, { backgroundColor: '#0F172A' }]}>
                    <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '800', fontSize: 10 }]}>
                      ₹{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                )}

                {/* The Bar */}
                <Pressable
                  onPressIn={() => setSelectedDay(idx)}
                  onPressOut={() => setSelectedDay(null)}
                  style={[
                    styles.bar,
                    { 
                      height: `${barHeight}%`,
                      backgroundColor: val > 0 ? (isSelected ? '#FBBF24' : '#FFF9F0') : '#F8FAFC',
                      borderColor: val > 0 ? '#FBBF24' : '#E5E7EB',
                      borderWidth: 1.5
                    }
                  ]}
                />
                
                {/* Label */}
                <Text style={[typography.caption, { color: val > 0 ? '#0F172A' : '#94A3B8', fontWeight: val > 0 ? '700' : '400', marginTop: 8 }]}>
                  {daysLabel[idx]}
                </Text>
              </View>
            );
          })}
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
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    height: 180,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  yAxisGuides: {
    justifyContent: 'space-between',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    height: '84%',
    alignItems: 'flex-end',
    width: 50,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingLeft: 8,
    height: '84%',
  },
  barColumn: {
    alignItems: 'center',
    width: '12%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    width: '100%',
    minHeight: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tooltip: {
    position: 'absolute',
    top: -30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
