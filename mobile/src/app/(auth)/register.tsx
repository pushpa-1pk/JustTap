import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image, Alert, Platform, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { RootState } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useVerifyOtpMutation } from '@/redux/api/authApi';
import { AppUserRole, getAuthPlatform, getDefaultRouteForRole } from '@/utils/auth';
import { secureStore } from '@/utils/secureStore';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

type PendingSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    role: AppUserRole;
    roles: AppUserRole[];
    accountStatus: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DELETED';
    isProfileComplete: boolean;
  };
};

export default function RegisterScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { phone, otp } = useLocalSearchParams<{ phone?: string; otp?: string }>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [verifyOtp] = useVerifyOtpMutation();
  const [isVerifyingRole, setIsVerifyingRole] = useState<AppUserRole | null>(null);

  const handleRoleSelect = async (role: AppUserRole) => {
    if (isVerifyingRole) return;
    if (!phone || !otp) {
      Alert.alert('Error', 'Missing phone number or verification code.');
      router.replace('/(auth)/login');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVerifyingRole(role);

    try {
      const response = await verifyOtp({
        phone,
        otp,
        role: role.toLowerCase() as 'customer' | 'provider' | 'admin',
        deviceId: await secureStore.getDeviceId(),
        deviceName: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
        platform: getAuthPlatform(),
        appVersion: '1.0.0',
      }).unwrap();

      if (response.success && response.data) {
        const { accessToken, refreshToken, user: authUser } = response.data;
        const session = {
          accessToken,
          refreshToken,
          user: {
            id: authUser.id,
            phone: authUser.phone,
            role: authUser.role,
            roles: Array.from(new Set([...(authUser.roles || []), role])),
            accountStatus: authUser.accountStatus,
            isProfileComplete: authUser.isProfileComplete || false,
          },
        };

        const roles = Array.from(new Set([...session.user.roles, role]));
        const selectedUser = {
          ...session.user,
          role,
          roles,
        };

        await secureStore.saveTokens(session.accessToken, session.refreshToken);
        await secureStore.saveRole(role);
        await secureStore.saveUser(selectedUser);

        dispatch(
          setCredentials({
            user: selectedUser,
            accessToken: session.accessToken,
          })
        );

        if (!selectedUser.isProfileComplete) {
          router.replace(role === 'PROVIDER' ? '/(provider)/(tabs)/profile' : '/(customer)/(tabs)/profile');
          return;
        }

        router.replace(getDefaultRouteForRole(role));
      }
    } catch (error: any) {
      console.warn('Verify OTP error:', error);
      Alert.alert(
        'Verification Failed',
        error.data?.message || 'The verification code could not be verified. Please go back to enter the correct code.'
      );
    } finally {
      setIsVerifyingRole(null);
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: '#FFFFFF', 
      paddingTop: insets.top + 20, 
      paddingBottom: insets.bottom + 20,
      paddingHorizontal: 20
    }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Decorative Top-Left Blob */}
      <View style={styles.topBlob} />
      
      {/* Decorative Bottom-Right Blob */}
      <View style={styles.bottomBlob} />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoTextJust}>Just</Text>
          <Text style={styles.logoTextTap}>Tap</Text>
          <View style={styles.sparkRow}>
            <View style={[styles.sparkLine, { transform: [{ rotate: '-25deg' }] }]} />
            <View style={[styles.sparkLine, { transform: [{ rotate: '0deg' }], marginHorizontal: 2 }]} />
            <View style={[styles.sparkLine, { transform: [{ rotate: '25deg' }] }]} />
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          India's Last Minute Service App
        </Text>
      </View>

      {/* Middle Headline */}
      <View style={styles.headlineContainer}>
        <Text style={[typography.h1, styles.headlineText]}>
          Choose your role
        </Text>
        <Text style={[typography.bodyMedium, styles.headlineSubtext]}>
          Tell us how you want to use JustTap and we'll set things up for you.
        </Text>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* CUSTOMER CARD */}
        <Pressable
          style={({ pressed }) => [
            styles.roleCard,
            {
              backgroundColor: '#FFFDF2',
              opacity: pressed || isVerifyingRole ? 0.95 : 1,
            }
          ]}
          onPress={() => handleRoleSelect('CUSTOMER')}
          disabled={!!isVerifyingRole}
        >
          {/* Backdrop yellow circle */}
          <View style={styles.customerBackdropCircle} />
          
          <View style={styles.cardTextSection}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="person-outline" size={22} color="#0F172A" />
            </View>
            <Text style={[typography.h2, styles.cardTitle]}>Customer</Text>
            <Text style={styles.cardDesc}>
              Book trusted services quickly and easily
            </Text>
            
            <View style={[styles.cardArrowCircle, { backgroundColor: '#FBBF24' }]}>
              {isVerifyingRole === 'CUSTOMER' ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Ionicons name="arrow-forward" size={18} color="#0F172A" />
              )}
            </View>
          </View>

          {/* Customer Image */}
          <Image 
            source={require('../../../assets/images/rolec.png')}
            style={styles.customerImage}
            resizeMode="contain"
          />
        </Pressable>

        {/* SEPARATOR */}
        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorCircle}>
            <Text style={styles.separatorText}>or</Text>
          </View>
          <View style={styles.separatorLine} />
        </View>

        {/* PROVIDER CARD */}
        <Pressable
          style={({ pressed }) => [
            styles.roleCard,
            {
              backgroundColor: '#F0FDF4',
              opacity: pressed || isVerifyingRole ? 0.95 : 1,
            }
          ]}
          onPress={() => handleRoleSelect('PROVIDER')}
          disabled={!!isVerifyingRole}
        >
          {/* Backdrop green circle */}
          <View style={styles.providerBackdropCircle} />

          {/* Provider Image */}
          <Image 
            source={require('../../../assets/images/onboarding_1@.png')}
            style={styles.providerImage}
            resizeMode="contain"
          />

          <View style={[styles.cardTextSection, { alignItems: 'flex-start', paddingLeft: 12 }]}>
            <View style={[styles.cardIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="briefcase-outline" size={22} color="#16A34A" />
            </View>
            <Text style={[typography.h2, styles.cardTitle]}>Provider</Text>
            <Text style={styles.cardDesc}>
              Offer your services and grow your business
            </Text>
            
            <View style={[styles.cardArrowCircle, { backgroundColor: '#22C55E' }]}>
              {isVerifyingRole === 'PROVIDER' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              )}
            </View>
          </View>
        </Pressable>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
          <Text style={styles.footerText}>
            Safe. Secure. Trusted by thousands of users across the city.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topBlob: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FEF08A',
    opacity: 0.6,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FEF08A',
    opacity: 0.5,
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextJust: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  logoTextTap: {
    fontSize: 32,
    fontWeight: '900',
    color: '#16A34A',
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    height: 24,
  },
  sparkLine: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: '#FBC02D',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    fontWeight: '500',
    marginTop: 2,
  },
  headlineContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  headlineText: {
    fontWeight: '800',
    fontSize: 28,
    color: '#0F172A',
    textAlign: 'center',
  },
  headlineSubtext: {
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    lineHeight: 20,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    zIndex: 2,
  },
  roleCard: {
    height: 175,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  customerBackdropCircle: {
    position: 'absolute',
    right: -25,
    bottom: -35,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FEF3C7',
    opacity: 0.8,
  },
  providerBackdropCircle: {
    position: 'absolute',
    left: -25,
    bottom: -35,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DCFCE7',
    opacity: 0.8,
  },
  cardTextSection: {
    width: '58%',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '800',
    fontSize: 20,
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  cardArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  customerImage: {
    width: 130,
    height: '100%',
    alignSelf: 'flex-end',
    zIndex: 1,
  },
  providerImage: {
    width: 130,
    height: '100%',
    alignSelf: 'flex-end',
    zIndex: 1,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  separatorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    maxWidth: '90%',
  },
  footerText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#475569',
    flexShrink: 1,
    lineHeight: 14,
  },
});
