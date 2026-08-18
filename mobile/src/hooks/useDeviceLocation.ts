import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

export type DeviceCoordinates = { latitude: number; longitude: number; accuracy: number | null };

export async function getRequiredDeviceLocation(): Promise<DeviceCoordinates | null> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    Alert.alert('Location services are off', 'Turn on GPS/location services, then try again.');
    return null;
  }

  const existing = await Location.getForegroundPermissionsAsync();
  let permission = existing;
  if (existing.status !== Location.PermissionStatus.GRANTED) {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    Alert.alert(
      'Location permission required',
      'JustTap needs your precise location to attach a real service address to this booking.',
      permission.canAskAgain ? [{ text: 'Cancel', style: 'cancel' }] : [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel', style: 'cancel' }]
    );
    return null;
  }

  try {
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude, accuracy } = location.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Invalid location coordinates');
    return { latitude, longitude, accuracy: accuracy ?? null };
  } catch (error) {
    Alert.alert('Could not get location', 'Make sure GPS is enabled and you have a clear signal, then try again.');
    return null;
  }
}
