import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGetNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useProviderProfile';
import { logout } from '@/redux/slices/authSlice';
import { secureStore } from '@/utils/secureStore';
import apiClient from '@/config/axios';
import { useTheme } from '@/hooks/useTheme';

export default function ProviderSettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Queries & Mutations
  const { data: preferences, isLoading: isNotifLoading, refetch } = useGetNotificationPreferences();
  const updateNotifPreferences = useUpdateNotificationPreferences();

  // Local Notification Preferences Toggles
  const [bookingReq, setBookingReq] = useState(true);
  const [payments, setPayments] = useState(true);
  const [messages, setMessages] = useState(true);
  const [offers, setOffers] = useState(false);
  const [promotions, setPromotions] = useState(false);
  const [support, setSupport] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  // General App settings
  const [language, setLanguage] = useState('English');
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('system');
  const [autoAccept, setAutoAccept] = useState(false);
  const [navPref, setNavPref] = useState('Google Maps');
  const [mapPref, setMapPref] = useState('Standard');

  // Security Toggles
  const [biometric, setBiometric] = useState(false);
  const [pinLock, setPinLock] = useState(false);

  // Delete Account States
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state from Notification preferences endpoint
  useEffect(() => {
    if (preferences) {
      setBookingReq(preferences.categories?.booking ?? true);
      setPayments(preferences.categories?.payment ?? true);
      setMessages(preferences.categories?.wallet ?? true); // wallet channels mapped to payments/wallet
      setOffers(preferences.categories?.marketing ?? false);
      setPromotions(preferences.categories?.promotions ?? false);
      setSupport(preferences.categories?.support ?? true);
      setEmergencyAlerts(preferences.categories?.system ?? true);
      
      if (preferences.language) {
        setLanguage(preferences.language === 'hi' ? 'Hindi' : 'English');
      }
    }
  }, [preferences]);

  // Handle Notifications Toggle Updates
  const handleToggleNotif = async (category: string, currentValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic local state update
    if (category === 'booking') setBookingReq(!currentValue);
    if (category === 'payment') setPayments(!currentValue);
    if (category === 'wallet') setMessages(!currentValue);
    if (category === 'marketing') setOffers(!currentValue);
    if (category === 'promotions') setPromotions(!currentValue);
    if (category === 'support') setSupport(!currentValue);
    if (category === 'system') setEmergencyAlerts(!currentValue);

    try {
      const updatedCategories = {
        booking: category === 'booking' ? !currentValue : bookingReq,
        payment: category === 'payment' ? !currentValue : payments,
        wallet: category === 'wallet' ? !currentValue : messages,
        review: true,
        marketing: category === 'marketing' ? !currentValue : offers,
        support: category === 'support' ? !currentValue : support,
        promotions: category === 'promotions' ? !currentValue : promotions,
        system: category === 'system' ? !currentValue : emergencyAlerts,
      };

      await updateNotifPreferences.mutateAsync({
        categories: updatedCategories,
      });
      refetch();
    } catch (err) {
      console.error('Update notification preferences failed:', err);
    }
  };

  const handleLanguageChange = () => {
    Alert.alert('Language', 'Choose your preferred language', [
      { text: 'English', onPress: () => setLanguage('English') },
      { text: 'Hindi', onPress: () => setLanguage('Hindi') },
      { text: 'Spanish', onPress: () => setLanguage('Spanish') },
    ]);
  };

  const handleThemeChange = () => {
    Alert.alert('Appearance', 'Choose your app theme style', [
      { text: 'System default', onPress: () => setThemePref('system') },
      { text: 'Light mode', onPress: () => setThemePref('light') },
      { text: 'Dark mode', onPress: () => setThemePref('dark') },
    ]);
  };

  const handleNavPrefChange = () => {
    Alert.alert('Navigation Preference', 'Choose your primary GPS map app', [
      { text: 'Google Maps', onPress: () => setNavPref('Google Maps') },
      { text: 'Apple Maps', onPress: () => setNavPref('Apple Maps') },
      { text: 'Waze', onPress: () => setNavPref('Waze') },
    ]);
  };

  // Delete Account flow
  const handleDeleteAccountConfirm = async () => {
    if (confirmDeleteText !== 'DELETE') {
      Alert.alert('Verification Failed', 'Please type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // 1. Call backend deletion API (soft delete)
      await apiClient.post('/auth/delete-account');

      // 2. Clear all local tokens & user credentials
      await secureStore.clearAll();

      // 3. Clear query client cache
      queryClient.clear();

      // 4. Logout Redux auth context
      dispatch(logout());

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteModalVisible(false);
      Alert.alert('Account Deleted', 'Your provider account has been successfully deleted.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      console.error('Account deletion failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Deletion Error', error.response?.data?.message || 'Failed to soft delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      
      {/* Notifications Section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Notification Settings</Text>
        
        {isNotifLoading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.text }]}>Booking Requests</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Sound alerts for new customer job dispatches</Text>
              </View>
              <Switch
                value={bookingReq}
                onValueChange={() => handleToggleNotif('booking', bookingReq)}
                trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
                thumbColor={bookingReq ? colors.secondary : '#94A3B8'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.text }]}>Payments & Wallet</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Settlements release and transaction approvals</Text>
              </View>
              <Switch
                value={payments}
                onValueChange={() => handleToggleNotif('payment', payments)}
                trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
                thumbColor={payments ? colors.secondary : '#94A3B8'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.text }]}>Messages</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Chat messages from customers during active jobs</Text>
              </View>
              <Switch
                value={messages}
                onValueChange={() => handleToggleNotif('wallet', messages)}
                trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
                thumbColor={messages ? colors.secondary : '#94A3B8'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.text }]}>Offers & Promotions</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Discounts, cashbacks, and referral bonuses</Text>
              </View>
              <Switch
                value={promotions}
                onValueChange={() => handleToggleNotif('promotions', promotions)}
                trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
                thumbColor={promotions ? colors.secondary : '#94A3B8'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.text }]}>Emergency Alerts</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Urgent safety warnings or platform alerts</Text>
              </View>
              <Switch
                value={emergencyAlerts}
                onValueChange={() => handleToggleNotif('system', emergencyAlerts)}
                trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
                thumbColor={emergencyAlerts ? colors.secondary : '#94A3B8'}
              />
            </View>
          </>
        )}
      </View>

      {/* General Settings */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>General Settings</Text>

        <Pressable style={styles.rowBtn} onPress={handleLanguageChange}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.text }]}>Language</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{language}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.rowBtn} onPress={handleThemeChange}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.text }]}>Appearance</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Theme preference: {themePref}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.rowBtn} onPress={handleNavPrefChange}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.text }]}>Navigation Map App</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{navPref}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.text }]}>Auto Accept Jobs</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Automatically accepts bookings without prompts</Text>
          </View>
          <Switch
            value={autoAccept}
            onValueChange={setAutoAccept}
            trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
            thumbColor={autoAccept ? colors.secondary : '#94A3B8'}
          />
        </View>
      </View>

      {/* Privacy & Security */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Privacy & Security</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.text }]}>Biometric Fingerprint Login</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Enable FaceID/Fingerprint logins</Text>
          </View>
          <Switch
            value={biometric}
            onValueChange={setBiometric}
            trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
            thumbColor={biometric ? colors.secondary : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.text }]}>PIN Code Lock</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Enforce secure PIN on app open</Text>
          </View>
          <Switch
            value={pinLock}
            onValueChange={setPinLock}
            trackColor={{ false: '#CBD5E1', true: colors.secondary + '80' }}
            thumbColor={pinLock ? colors.secondary : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <Pressable style={styles.dangerRowBtn} onPress={() => setDeleteModalVisible(true)}>
          <Text style={[typography.bodyLarge, { color: colors.danger, fontWeight: '700' }]}>Delete Provider Account</Text>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>

      {/* Help & Support */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Help & Support</Text>
        
        <Pressable style={styles.rowBtn}>
          <Text style={[typography.bodyLarge, { color: colors.text }]}>Frequently Asked FAQs</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.rowBtn}>
          <Text style={[typography.bodyLarge, { color: colors.text }]}>Raise Support Ticket</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.rowBtn}>
          <Text style={[typography.bodyLarge, { color: colors.text }]}>Call Hotline Support</Text>
          <Ionicons name="call" size={18} color={colors.secondary} />
        </Pressable>
      </View>

      {/* Legal & About */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Legal Agreement</Text>

        <Pressable style={styles.rowBtn}>
          <Text style={[typography.bodyLarge, { color: colors.text }]}>Provider Terms of Service</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.rowBtn}>
          <Text style={[typography.bodyLarge, { color: colors.text }]}>Commission & Fee Policies</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.aboutRow}>
          <Text style={[typography.bodyLarge, { color: colors.text }]}>JustTap Version</Text>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>v1.4.2-prod</Text>
        </View>
      </View>

      {/* Account Deletion Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="warning" size={48} color={colors.danger} />
            <Text style={[typography.h2, { color: colors.text, marginVertical: 12, textAlign: 'center' }]}>
              Confirm Deletion
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }]}>
              This will soft delete your JustTap Provider account. Your active bookings will be cancelled and you will be logged out.
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8, fontWeight: '700' }]}>
              TYPE "DELETE" BELOW TO CONFIRM:
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              value={confirmDeleteText}
              onChangeText={setConfirmDeleteText}
              placeholder="DELETE"
              autoCapitalize="characters"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalActionRow}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setConfirmDeleteText('');
                }}
              >
                <Text style={[typography.buttonText, { color: '#0F172A' }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
                onPress={handleDeleteAccountConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[typography.buttonText, { color: '#FFFFFF' }]}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dangerRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
