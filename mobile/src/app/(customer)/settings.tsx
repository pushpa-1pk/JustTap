import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { logout } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import apiClient from '@/config/axios';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Notification Preferences
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifOffer, setNotifOffer] = useState(false);
  const [notifChat, setNotifChat] = useState(true);
  const [notifEmergency, setNotifEmergency] = useState(true);

  // App settings
  const [language, setLanguage] = useState('English');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  
  // Accessibility
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Security
  const [biometricLogin, setBiometricLogin] = useState(false);

  // Delete Account State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLanguageChange = () => {
    Alert.alert('Language', 'Choose your preferred language', [
      { text: 'English', onPress: () => setLanguage('English') },
      { text: 'Hindi', onPress: () => setLanguage('Hindi') },
      { text: 'Spanish', onPress: () => setLanguage('Spanish') },
    ]);
  };

  const handleThemeChange = () => {
    Alert.alert('Appearance', 'Choose your app theme style', [
      { text: 'System default', onPress: () => setThemePreference('system') },
      { text: 'Light mode', onPress: () => setThemePreference('light') },
      { text: 'Dark mode', onPress: () => setThemePreference('dark') },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Verification Failed', 'Please type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // 1. Call backend deletion API
      await apiClient.post('/auth/delete-account');

      // 2. Clear all local tokens & user credentials
      await secureStore.clearAll();

      // 3. Clear query client cache
      queryClient.clear();

      // 4. Logout Redux auth context
      dispatch(logout());

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteModalVisible(false);
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      console.error('Account deletion failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Deletion Error', error?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Notifications Section */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notification Settings</Text>
        <View style={[styles.sectionCard, { borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Booking Updates</Text>
            <Switch value={notifBooking} onValueChange={setNotifBooking} />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Payment Confirmations</Text>
            <Switch value={notifPayment} onValueChange={setNotifPayment} />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Offers & Promos</Text>
            <Switch value={notifOffer} onValueChange={setNotifOffer} />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Chat Notifications</Text>
            <Switch value={notifChat} onValueChange={setNotifChat} />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Emergency Alerts</Text>
            <Switch value={notifEmergency} onValueChange={setNotifEmergency} />
          </View>
        </View>

        {/* General Settings */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Preferences</Text>
        <View style={[styles.sectionCard, { borderColor: colors.border }]}>
          <Pressable onPress={handleLanguageChange} style={styles.navRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Language</Text>
            <View style={styles.navRight}>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>{language}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable onPress={handleThemeChange} style={[styles.navRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Appearance</Text>
            <View style={styles.navRight}>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                {themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        {/* Accessibility */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Accessibility</Text>
        <View style={[styles.sectionCard, { borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Reduce Motion</Text>
            <Switch value={reduceMotion} onValueChange={setReduceMotion} />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>High Contrast</Text>
            <Switch value={highContrast} onValueChange={setHighContrast} />
          </View>
        </View>

        {/* Privacy & Security */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Privacy & Security</Text>
        <View style={[styles.sectionCard, { borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Biometric Login</Text>
            <Switch value={biometricLogin} onValueChange={setBiometricLogin} />
          </View>
          
          <Pressable
            onPress={() => {
              setDeleteConfirmText('');
              setDeleteModalVisible(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={[styles.navRow, { borderBottomWidth: 0 }]}
          >
            <Text style={[styles.settingLabel, { color: '#DC2626', fontWeight: '800' }]}>
              Delete Account
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal animationType="fade" transparent={true} visible={deleteModalVisible}>
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteContent}>
            <View style={styles.deleteHeader}>
              <Ionicons name="warning" size={44} color="#DC2626" />
              <Text style={styles.deleteTitle}>Delete Your Account?</Text>
            </View>
            <Text style={styles.deleteWarning}>
              This action is permanent and cannot be undone. All your profile details, wallet balance, and bookings records will be immediately revoked.
            </Text>
            <Text style={styles.deleteInstructions}>
              Please type <Text style={{ fontWeight: '900' }}>DELETE</Text> below to confirm:
            </Text>

            <TextInput
              style={styles.deleteInput}
              placeholder="Type DELETE"
              autoCapitalize="characters"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
            />

            <View style={styles.deleteActions}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.deleteBtn, styles.cancelBtn]}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                style={[
                  styles.deleteBtn,
                  styles.confirmBtn,
                  deleteConfirmText !== 'DELETE' && { opacity: 0.5 },
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Delete Account</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { padding: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  deleteHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
    marginTop: 10,
  },
  deleteWarning: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  deleteInstructions: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '700',
    marginBottom: 8,
  },
  deleteInput: {
    height: 48,
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
