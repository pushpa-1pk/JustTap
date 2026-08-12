import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetProviderProfile, useUpdateProviderProfile, useUpdateProviderLocation } from '@/hooks/useProviderProfile';
import { useTheme } from '@/hooks/useTheme';
import MapViewComponent from '@/components/common/MapViewComponent';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ServiceAreasScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  // API Hooks
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetProviderProfile();
  const updateProfileMutation = useUpdateProviderProfile();
  const updateLocationMutation = useUpdateProviderLocation();

  const [radius, setRadius] = useState('10');
  const [city, setCity] = useState('Mumbai');
  const [zone, setZone] = useState('Andheri West');
  const [areas, setAreas] = useState<string[]>(['Andheri East', 'Bandra West', 'Juhu', 'Vile Parle']);
  const [newArea, setNewArea] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    if (profile) {
      setRadius(String(profile.workingRadius || 10));
    }
  }, [profile]);

  const handleSaveRadius = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const radiusNum = Number(radius);
    if (isNaN(radiusNum) || radiusNum < 1 || radiusNum > 100) {
      Alert.alert('Invalid Radius', 'Please enter a radius between 1 and 100 km.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        workingRadius: radiusNum,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      Alert.alert('Success', 'Working radius updated successfully!');
    } catch (err: any) {
      console.error('Update radius failed:', err);
      Alert.alert('Error', err?.message || 'Failed to update working radius.');
    }
  };

  const handleUpdateLiveLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUpdatingLocation(true);

    try {
      // Simulate fetching foreground location coordinates.
      // In production, we'd use: const { coords } = await Location.getCurrentPositionAsync({});
      // Here, let's toggle a minor deviation from current coordinates to prove update works.
      const baseLat = profile?.currentLocation?.coordinates?.[1] || 19.076;
      const baseLng = profile?.currentLocation?.coordinates?.[0] || 72.8777;

      const randomDeviationLat = (Math.random() - 0.5) * 0.01;
      const randomDeviationLng = (Math.random() - 0.5) * 0.01;

      const latitude = baseLat + randomDeviationLat;
      const longitude = baseLng + randomDeviationLng;

      await updateLocationMutation.mutateAsync({
        latitude,
        longitude,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      Alert.alert('Success', `Location updated to coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } catch (err: any) {
      console.error('Update location failed:', err);
      Alert.alert('Error', err?.message || 'Failed to access live device coordinates.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleAddArea = () => {
    if (!newArea.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAreas([...areas, newArea.trim()]);
    setNewArea('');
  };

  const handleRemoveArea = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...areas];
    updated.splice(index, 1);
    setAreas(updated);
  };

  if (isProfileLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const latitude = profile?.currentLocation?.coordinates?.[1] || 19.076;
  const longitude = profile?.currentLocation?.coordinates?.[0] || 72.8777;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Map Card */}
      <View style={[styles.cardMap, { borderColor: colors.border }]}>
        <View style={styles.mapWrapper}>
          <MapViewComponent 
            latitude={latitude}
            longitude={longitude}
            title={profile?.businessName || 'My Location'}
            description={`Coverage: ${radius} km radius`}
          />
        </View>
        <View style={[styles.mapOverlayDetails, { backgroundColor: colors.surface }]}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>CURRENT COORDINATES</Text>
          <Text style={[typography.bodyLarge, { color: colors.text, fontWeight: '700', marginTop: 2 }]}>
            {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
          </Text>
        </View>
      </View>

      {/* Radius Controls */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Coverage Settings</Text>
        
        <Text style={styles.label}>Working Radius (in Kilometers)</Text>
        <View style={styles.rowInput}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
            value={radius}
            onChangeText={setRadius}
            keyboardType="number-pad"
            placeholder="km radius"
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable 
            style={[styles.saveBtn, { backgroundColor: colors.secondary }]}
            onPress={handleSaveRadius}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color={colors.onSecondary} />
            ) : (
              <Text style={[typography.buttonText, { color: colors.onSecondary }]}>Update</Text>
            )}
          </Pressable>
        </View>
        
        <Pressable 
          style={[styles.locationBtn, { borderColor: colors.secondary }]}
          onPress={handleUpdateLiveLocation}
          disabled={isUpdatingLocation}
        >
          {isUpdatingLocation ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <>
              <Ionicons name="location" size={18} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={[typography.buttonText, { color: colors.secondary }]}>Update to Live Location</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Target Cities & Zones */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Service Coverage Zones</Text>

        <Text style={styles.label}>Working City</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant, marginBottom: 12 }]}
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Mumbai"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Base Working Zone</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
          value={zone}
          onChangeText={setZone}
          placeholder="e.g. Andheri West"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Sub-areas Tags List */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Specific Neighborhoods</Text>

        <View style={styles.rowInput}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceVariant }]}
            value={newArea}
            onChangeText={setNewArea}
            placeholder="Add nearby neighborhood"
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable style={[styles.addBtn, { backgroundColor: colors.text }]} onPress={handleAddArea}>
            <Text style={[typography.buttonText, { color: colors.surface }]}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.tagContainer}>
          {areas.map((area, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <Text style={[typography.bodySmall, { color: colors.text }]}>{area}</Text>
              <Pressable onPress={() => handleRemoveArea(index)} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={16} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardMap: {
    height: 250,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlayDetails: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  rowInput: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  saveBtn: {
    width: 80,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 68,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBtn: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
