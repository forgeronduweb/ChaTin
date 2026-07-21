import * as Location from 'expo-location';

import { updateCity } from './api';
import { updateSessionUserCity } from './auth';

let syncedThisSession = false;

// Detects the user's city via GPS + reverse geocoding and saves it to their
// profile, so chat replies can use it for location-dependent questions
// (weather, local time...) without asking. Runs once per app session unless
// force is set (e.g. a manual "refresh" tap in Settings).
export async function syncCityFromLocation(options?: { force?: boolean }): Promise<string | null> {
  if (syncedThisSession && !options?.force) return null;
  syncedThisSession = true;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const city = place?.city || place?.subregion || place?.region || null;
    if (!city) return null;

    await updateCity(city);
    await updateSessionUserCity(city);
    return city;
  } catch (error) {
    console.error('Failed to detect city from location:', error);
    return null;
  }
}
