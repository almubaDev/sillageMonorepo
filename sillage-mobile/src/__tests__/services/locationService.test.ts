import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { locationService } from '../../services/locationService';

jest.mock('expo-location');

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios'; // Default to mobile
  });

  describe('requestPermissions', () => {
    it('should return true when permissions are granted on mobile', async () => {
      Platform.OS = 'ios';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await locationService.requestPermissions();

      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false when permissions are denied on mobile', async () => {
      Platform.OS = 'android';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await locationService.requestPermissions();

      expect(result).toBe(false);
    });

    it('should return true on web with geolocation support', async () => {
      Platform.OS = 'web';
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn(),
        },
      } as any;

      const result = await locationService.requestPermissions();

      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should return false on web without geolocation support', async () => {
      Platform.OS = 'web';
      global.navigator = {} as any;

      const result = await locationService.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location on mobile with permissions', async () => {
      Platform.OS = 'ios';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        {
          street: '5th Avenue',
          city: 'New York',
          region: 'NY',
        },
      ]);

      const result = await locationService.getCurrentLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        address: '5th Avenue New York, NY',
      });
    });

    it('should return null when permissions are denied', async () => {
      Platform.OS = 'android';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
    });

    it('should handle missing geocode data', async () => {
      Platform.OS = 'ios';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{}]);

      const result = await locationService.getCurrentLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        address: ',',
      });
    });

    it('should handle empty geocode array', async () => {
      Platform.OS = 'ios';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);

      const result = await locationService.getCurrentLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Ubicación actual',
      });
    });

    it('should return null on location error', async () => {
      Platform.OS = 'ios';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('Location error')
      );

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
    });

    it('should use web location on web platform', async () => {
      Platform.OS = 'web';
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success) => {
            success({
              coords: {
                latitude: 40.7128,
                longitude: -74.006,
              },
            });
          }),
        },
      } as any;
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ display_name: 'New York, USA' }),
      });

      const result = await locationService.getCurrentLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        address: 'New York, USA',
      });
    });
  });

  describe('getWebLocation', () => {
    it('should get location on web successfully', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success) => {
            success({
              coords: {
                latitude: 40.7128,
                longitude: -74.006,
              },
            });
          }),
        },
      } as any;
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ display_name: 'New York, USA' }),
      });

      const result = await locationService.getWebLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        address: 'New York, USA',
      });
    });

    it('should return null when geolocation is not supported', async () => {
      global.navigator = {} as any;

      const result = await locationService.getWebLocation();

      expect(result).toBeNull();
    });

    it('should use default address when reverse geocoding fails', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success) => {
            success({
              coords: {
                latitude: 40.7128,
                longitude: -74.006,
              },
            });
          }),
        },
      } as any;
      global.fetch = jest.fn().mockRejectedValue(new Error('Geocoding error'));

      const result = await locationService.getWebLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Ubicación actual',
      });
    });

    it('should return default location on permission denial', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success, error) => {
            error({ code: 1, message: 'Permission denied' });
          }),
        },
      } as any;

      const result = await locationService.getWebLocation();

      expect(result).toEqual({
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Santiago, Chile (ubicación por defecto)',
      });
    });

    it('should call Nominatim API with correct parameters', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success) => {
            success({
              coords: {
                latitude: 40.7128,
                longitude: -74.006,
              },
            });
          }),
        },
      } as any;
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ display_name: 'Test Address' }),
      });

      await locationService.getWebLocation();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=40.7128&lon=-74.006&zoom=18&addressdetails=1',
        {
          headers: {
            'User-Agent': 'Sillage-App',
          },
        }
      );
    });

    it('should use default address when Nominatim returns no display_name', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success) => {
            success({
              coords: {
                latitude: 40.7128,
                longitude: -74.006,
              },
            });
          }),
        },
      } as any;
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      });

      const result = await locationService.getWebLocation();

      expect(result?.address).toBe('Ubicación actual');
    });

    it('should handle timeout error', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success, error) => {
            error({ code: 3, message: 'Timeout' });
          }),
        },
      } as any;

      const result = await locationService.getWebLocation();

      expect(result).toEqual({
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Santiago, Chile (ubicación por defecto)',
      });
    });

    it('should handle position unavailable error', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((success, error) => {
            error({ code: 2, message: 'Position unavailable' });
          }),
        },
      } as any;

      const result = await locationService.getWebLocation();

      expect(result).toEqual({
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Santiago, Chile (ubicación por defecto)',
      });
    });
  });
});
