import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useGetCategoriesQuery, useGetServiceByIdQuery } from '@/redux/api/serviceApi';

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const validId = typeof serviceId === 'string' && /^[a-f\d]{24}$/i.test(serviceId);
  const serviceQuery = useGetServiceByIdQuery(serviceId ?? '', { skip: !validId });
  const categoryQuery = useGetCategoriesQuery();
  const service = serviceQuery.data?.data;
  const category = categoryQuery.data?.data?.find((item) => item._id === service?.categoryId);

  if (!validId) return <Unavailable onBack={() => router.back()} />;
  if (serviceQuery.isLoading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  if (serviceQuery.isError || !service || !service.isActive) return <Unavailable onBack={() => router.back()} retry={() => serviceQuery.refetch()} />;

  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back"><Ionicons name="arrow-back" size={24} color={colors.text} /></Pressable>
      {service.image?.startsWith('http') && <Image source={{ uri: service.image }} style={styles.image} />}
      <Text style={[typography.h1, { color: colors.text, marginTop: spacing.lg }]}>{service.name}</Text>
      <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>{service.description || 'No description is available for this service.'}</Text>
      <View style={[styles.details, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Detail label="Category" value={category?.name || 'Category unavailable'} />
        <Detail label="Estimated duration" value={`${service.estimatedDuration} minutes`} />
        <Detail label="Availability" value="Available for provider selection" />
        <Detail label="Pricing" value="Provider-specific price shown after you select a professional" />
      </View>
    </ScrollView>
    <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}><Pressable onPress={() => router.push({ pathname: '/(customer)/(tabs)/search', params: { serviceId: service._id } })} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={{ color: colors.onPrimary, fontWeight: '700' }}>View available professionals</Text></Pressable></View>
  </View>;
}
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={{ color: '#64748B' }}>{label}</Text><Text style={{ color: '#0F172A', fontWeight: '600', marginTop: 4 }}>{value}</Text></View>; }
function Unavailable({ onBack, retry }: { onBack: () => void; retry?: () => unknown }) { return <View style={styles.center}><Text style={{ fontSize: 20, fontWeight: '700' }}>Service unavailable</Text><Text style={{ color: '#64748B', textAlign: 'center', marginTop: 8 }}>This service may have been removed or deactivated.</Text>{retry && <Pressable onPress={() => void retry()} style={styles.link}><Text style={{ color: '#FBC02D', fontWeight: '700' }}>Retry</Text></Pressable>}<Pressable onPress={onBack} style={styles.link}><Text style={{ color: '#FBC02D', fontWeight: '700' }}>Back to search</Text></Pressable></View>; }
const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, content: { paddingBottom: 100 }, image: { width: '100%', height: 220, borderRadius: 16, marginTop: 18 }, details: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 24 }, detail: { marginBottom: 16 }, footer: { padding: 16, borderTopWidth: 1 }, button: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 52 }, link: { marginTop: 18 } });
