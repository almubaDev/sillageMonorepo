import * as Location from 'expo-location';
import { Platform } from 'react-native';

export const locationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // En web usamos la API del navegador
      if (!navigator.geolocation) {
        return false;
      }
      // Los permisos se solicitan automáticamente al llamar getCurrentPosition
      return true;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    address: string;
  } | null> {
    try {
      if (Platform.OS === 'web') {
        // Usar API de navegador para web
        return await this.getWebLocation();
      }

      // Código nativo para iOS/Android
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permiso de ubicación denegado');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = geocode
        ? `${geocode.street || ''} ${geocode.city || ''}, ${geocode.region || ''}`
        : 'Ubicación actual';

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address.trim(),
      };
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      return null;
    }
  },

  async getWebLocation(): Promise<{
    latitude: number;
    longitude: number;
    address: string;
  } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation no soportada en este navegador');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Intentar obtener dirección usando Nominatim (OpenStreetMap)
          let address = 'Ubicación actual';
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'Sillage-App',
                },
              }
            );
            const data = await response.json();
            if (data.display_name) {
              address = data.display_name;
            }
          } catch (error) {
            console.error('Error obteniendo dirección:', error);
          }

          resolve({
            latitude,
            longitude,
            address,
          });
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          
          // Si el usuario niega permisos, usar ubicación por defecto (Santiago, Chile)
          resolve({
            latitude: -33.4489,
            longitude: -70.6693,
            address: 'Santiago, Chile (ubicación por defecto)',
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  },
};