import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import MapViewComponent from '../common/MapViewComponent';

interface ServiceAreaCardProps {
  serviceArea: string;
  radiusKm: number;
  latitude: number;
  longitude: number;
  onManageAreaPress: () => void;
}

export default function ServiceAreaCard({
  serviceArea,
  radiusKm,
  latitude,
  longitude,
  onManageAreaPress,
}: ServiceAreaCardProps) {
  const { typography } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[typography.h3, { color: '#0F172A', fontWeight: '700', marginBottom: 12 }]}>
        📍 Service Area
      </Text>

      <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
        {/* Map Preview Area */}
        <View style={[styles.mapContainer, { borderColor: '#E5E7EB' }]}>
          <MapViewComponent
            latitude={latitude}
            longitude={longitude}
            title={serviceArea}
            description={`Service radius: ${radiusKm} km`}
          />
        </View>

        {/* Text Details & Button */}
        <View style={styles.detailsRow}>
          <View style={styles.textCol}>
            <Text style={[typography.bodyLarge, { color: '#0F172A', fontWeight: '700' }]}>
              {serviceArea}
            </Text>
            <Text style={[typography.bodySmall, { color: '#64748B', marginTop: 2 }]}>
              Service Radius: {radiusKm} km
            </Text>
          </View>

          <Pressable
            onPress={onManageAreaPress}
            style={({ pressed }) => [
              styles.manageBtn,
              { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', borderWidth: 1 },
              pressed && { opacity: 0.8 }
            ]}
          >
            <Text style={[typography.caption, { color: '#0F172A', fontWeight: '700' }]}>
              Manage Area
            </Text>
          </Pressable>
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
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  mapContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    borderBottomWidth: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  textCol: {
    flex: 1,
  },
  manageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
