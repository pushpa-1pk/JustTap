import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';

interface AvailabilityCardProps {
  isOnline: boolean;
  isUpdating: boolean;
  workingRadius: number;
  onToggle: (onlineState: boolean) => Promise<void>;
}

export const AvailabilityCard: React.FC<AvailabilityCardProps> = ({
  isOnline,
  isUpdating,
  workingRadius,
  onToggle,
}) => {
  const { colors, typography } = useTheme();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);

  const handleToggle = async (value: boolean) => {
    if (isUpdating) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (value) {
      // Go Online check permission (Requirement 7)
      setCheckingPermission(true);
      try {
        const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
        
        if (currentStatus !== 'granted') {
          setShowPermissionModal(true);
          setCheckingPermission(false);
          return;
        }

        setCheckingPermission(false);
        await onToggle(true);
      } catch (err) {
        setCheckingPermission(false);
        console.warn('Error checking location permission:', err);
        setShowPermissionModal(true);
      }
    } else {
      // Go Offline directamente (Requirement 8)
      await onToggle(false);
    }
  };

  const requestPermissionAndOnline = async () => {
    setShowPermissionModal(false);
    setCheckingPermission(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setCheckingPermission(false);

      if (status === 'granted') {
        await onToggle(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Permission Denied', 'Location permission is required to receive nearby jobs.');
      }
    } catch (err) {
      setCheckingPermission(false);
      console.warn('Location request failed:', err);
      Alert.alert('Error', 'Failed to request location services.');
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.leftColumn}>
            <Text style={[typography.bodyLarge, styles.title, { color: colors.text }]}>
              Available for Work
            </Text>
          </View>
          <View style={styles.rightColumn}>
            {isUpdating || checkingPermission ? (
              <ActivityIndicator color={colors.secondary} size="small" />
            ) : (
              <Switch
                value={isOnline}
                onValueChange={handleToggle}
                trackColor={{ false: '#D1D5DB', true: colors.secondary + '66' }}
                thumbColor={isOnline ? colors.secondary : '#9CA3AF'}
                ios_backgroundColor="#D1D5DB"
              />
            )}
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.radiusRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[typography.bodyMedium, styles.radiusText, { color: colors.text }]}>
              {workingRadius ? `${workingRadius} km` : '2.5 km'} radius
            </Text>
          </View>
          <Text style={[typography.bodySmall, styles.caption, { color: colors.textSecondary }]}>
            {isOnline ? "You're visible to customers near you" : "You're invisible to customers"}
          </Text>
        </View>
      </View>

      {/* Explicit Location Permission Blocking UI Modal (Requirement 7) */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="location" size={40} color={colors.primary} />
            </View>
            <Text style={[typography.h2, styles.modalTitle, { color: colors.text }]}>
              Enable location to receive nearby jobs
            </Text>
            <Text style={[typography.bodyMedium, styles.modalDesc, { color: colors.textSecondary }]}>
              JustTap needs your location to find nearby service requests.
            </Text>

            <Pressable
              onPress={requestPermissionAndOnline}
              style={({ pressed }) => [
                styles.modalBtn,
                { backgroundColor: colors.secondary },
                pressed && { opacity: 0.8 }
              ]}
            >
              <Text style={styles.modalBtnText}>Enable Location</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowPermissionModal(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
  },
  bottomRow: {
    gap: 4,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radiusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  caption: {
    fontWeight: '500',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 10,
    lineHeight: 28,
  },
  modalDesc: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBtn: {
    width: '100%',
    height: 56, // 56dp Touch Target
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalCancelBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
