import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface DashboardHeaderProps {
  fullName: string;
  serviceArea: string;
  hasUnread: boolean;
  avatarUrl: string | null;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

export default function DashboardHeader({
  fullName,
  serviceArea,
  hasUnread,
  avatarUrl,
  onNotificationPress,
  onProfilePress,
}: DashboardHeaderProps) {
  const { colors, typography } = useTheme();

  // Extract first name for friendly greeting
  const firstName = fullName.split(' ')[0] || 'Provider';

  return (
    <View style={[styles.headerContainer, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.leftSection}>
        <Text style={[typography.bodyMedium, { color: '#64748B', fontWeight: '500' }]}>
          Good Morning, {firstName} 👋
        </Text>
        <View style={styles.locationRow}>
          <Text style={[typography.bodySmall, { color: '#16A34A', marginRight: 2 }]}>📍</Text>
          <Text style={[typography.bodySmall, { color: '#64748B', fontWeight: '600' }]}>
            {serviceArea}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Notification Bell */}
        <Pressable
          onPress={onNotificationPress}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && { opacity: 0.7 },
            { backgroundColor: '#F1F5F9' }
          ]}
        >
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          {hasUnread && <View style={[styles.badge, { backgroundColor: '#EF4444' }]} />}
        </Pressable>

        {/* Profile Avatar */}
        <Pressable
          onPress={onProfilePress}
          style={({ pressed }) => [
            styles.avatarBtn,
            pressed && { opacity: 0.8 }
          ]}
        >
          {avatarUrl ? (
            <ExpoImage
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: '#E2E8F0' }]}>
              <Ionicons name="person" size={18} color="#64748B" />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  leftSection: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
