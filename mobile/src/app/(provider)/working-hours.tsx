import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetProviderProfile, useUpdateProviderProfile } from '@/hooks/useProviderProfile';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface DailySchedule {
  day: string;
  isOpen: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

export default function WorkingHoursScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  // Queries & Mutations
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetProviderProfile();
  const updateProfileMutation = useUpdateProviderProfile();

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  // Days list with local state for breakdown
  const [schedule, setSchedule] = useState<DailySchedule[]>([
    { day: 'Monday', isOpen: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Tuesday', isOpen: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Wednesday', isOpen: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Thursday', isOpen: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Friday', isOpen: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Saturday', isOpen: true, start: '09:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
    { day: 'Sunday', isOpen: false, start: '09:00', end: '13:00', breakStart: '12:00', breakEnd: '13:00' },
  ]);

  useEffect(() => {
    if (profile?.workingHours) {
      setStartTime(profile.workingHours.start || '09:00');
      setEndTime(profile.workingHours.end || '18:00');
      
      // Sync local schedule representation
      setSchedule(prev => prev.map(item => {
        if (item.day !== 'Sunday') {
          return {
            ...item,
            start: profile.workingHours.start || '09:00',
            end: profile.workingHours.end || '18:00',
          };
        }
        return item;
      }));
    }
  }, [profile]);

  const handleToggleOpen = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...schedule];
    updated[index].isOpen = !updated[index].isOpen;
    setSchedule(updated);
  };

  const handleTimeChange = (index: number, field: 'start' | 'end' | 'breakStart' | 'breakEnd', value: string) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSaveAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Invalid Format', 'Please enter hours in 24-hour HH:MM format.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        workingHours: {
          start: startTime,
          end: endTime,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      Alert.alert('Success', 'Working hours saved to profile service!');
    } catch (err: any) {
      console.error('Update working hours failed:', err);
      Alert.alert('Error', err?.message || 'Failed to update working hours.');
    }
  };

  if (isProfileLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Global Working Hours Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Primary Availability</Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: 16 }]}>
          Configure your standard daily start and end times below. This acts as the default limit for bookings.
        </Text>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Opening Time</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="e.g. 09:00"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Closing Time</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="e.g. 18:00"
            />
          </View>
        </View>

        <Pressable 
          style={[styles.saveBtn, { backgroundColor: colors.secondary }]} 
          onPress={handleSaveAll}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color={colors.onSecondary} />
          ) : (
            <Text style={[typography.buttonText, { color: colors.onSecondary }]}>Save Primary Schedule</Text>
          )}
        </Pressable>
      </View>

      {/* Days Breakdown */}
      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Weekly Breakdown</Text>
      
      {schedule.map((dayItem, index) => (
        <View key={dayItem.day} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{dayItem.day}</Text>
              <Text style={[typography.caption, { color: dayItem.isOpen ? colors.secondary : colors.danger, fontWeight: '600' }]}>
                {dayItem.isOpen ? 'OPEN FOR JOBS' : 'HOLIDAY / OFF-DAY'}
              </Text>
            </View>
            <Switch
              value={dayItem.isOpen}
              onValueChange={() => handleToggleOpen(index)}
              trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
              thumbColor={dayItem.isOpen ? colors.secondary : '#94A3B8'}
            />
          </View>

          {dayItem.isOpen && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Start Time</Text>
                  <TextInput
                    style={[styles.subInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                    value={dayItem.start}
                    onChangeText={(val) => handleTimeChange(index, 'start', val)}
                    placeholder="09:00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>End Time</Text>
                  <TextInput
                    style={[styles.subInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                    value={dayItem.end}
                    onChangeText={(val) => handleTimeChange(index, 'end', val)}
                    placeholder="18:00"
                  />
                </View>
              </View>

              <View style={[styles.twoCol, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Break Start</Text>
                  <TextInput
                    style={[styles.subInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                    value={dayItem.breakStart}
                    onChangeText={(val) => handleTimeChange(index, 'breakStart', val)}
                    placeholder="13:00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Break End</Text>
                  <TextInput
                    style={[styles.subInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
                    value={dayItem.breakEnd}
                    onChangeText={(val) => handleTimeChange(index, 'breakEnd', val)}
                    placeholder="14:00"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  subInput: {
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  saveBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
