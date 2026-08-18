import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapViewComponent from '@/components/common/MapViewComponent';
import { useTheme } from '@/hooks/useTheme';
import SvgIcon from '@/components/common/SvgIcon';
import * as Haptics from 'expo-haptics';

export default function ProviderDetailsScreen() {
  const { colors, typography, spacing, border } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    providerId: string;
    providerServiceId: string;
    businessName: string;
    price: string;
    experience?: string;
    rating?: string;
    distance?: string;
    latitude?: string;
    longitude?: string;
    serviceId: string;
    serviceName?: string;
  }>();

  const providerLat = Number(params.latitude);
  const providerLng = Number(params.longitude);
  const hasProviderLocation = Number.isFinite(providerLat) && Number.isFinite(providerLng);

  const handleProceedBooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(customer)/book-service',
      params: {
        providerId: params.providerId,
        providerServiceId: params.providerServiceId,
        businessName: params.businessName,
        price: params.price,
        serviceId: params.serviceId,
        serviceName: params.serviceName || '',
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {hasProviderLocation ? <View style={styles.mapContainer}><MapViewComponent latitude={providerLat} longitude={providerLng} title={params.businessName} description={params.serviceName || 'Service Provider'} /></View> : <View style={styles.locationUnavailable}><Text>Provider location is not available.</Text></View>}

        {/* Profile Details */}
        <View style={[styles.detailsBox, { backgroundColor: colors.surface }]}>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <Text style={[typography.h1, { color: colors.text }]}>{params.businessName}</Text>
            
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                  ★ {params.rating || '4.8'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[typography.bodyMedium, { color: colors.text }]}>
                  {params.experience || '5'} Yrs Exp
                </Text>
              </View>
              {params.distance && (
                <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>
                    {Number(params.distance).toFixed(1)} km away
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Pricing Panel */}
          <View style={[styles.pricingPanel, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <View>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>UPFRONT PRICING</Text>
              <Text style={[typography.h1, { color: colors.secondary, fontWeight: '800', marginTop: 4 }]}>
                ₹{params.price} <Text style={[typography.bodyMedium, { color: colors.textSecondary, fontWeight: '400' }]}>/ service</Text>
              </Text>
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[typography.caption, { color: colors.secondary, fontWeight: '800' }]}>VERIFIED RATE</Text>
            </View>
          </View>

          {/* Description / Bio */}
          <View style={styles.section}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>About Provider</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, lineHeight: 22 }]}>
              We provide high-quality {params.serviceName?.toLowerCase() || 'home maintenance'} services with certified experts. All jobs are executed following safety standards, and we clean up post-work. Satisfying customer service is guaranteed.
            </Text>
          </View>

          {/* Working Hours */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Business Hours</Text>
            <View style={styles.row}>
              <SvgIcon name="briefcase" color={colors.textSecondary} size={16} />
              <Text style={[typography.bodyMedium, { color: colors.text, marginLeft: spacing.sm }]}>
                Monday - Sunday (09:00 AM - 06:00 PM)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booking Floating Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable 
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          onPress={handleProceedBooking}
        >
          <Text style={[typography.buttonText, { color: colors.onPrimary }]}>Book Service</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: 220,
    width: '100%',
  },
  locationUnavailable: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsBox: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    padding: 24,
    minHeight: 400,
  },
  headerInfo: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pricingPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  bookBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});
