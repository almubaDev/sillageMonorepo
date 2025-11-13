import axios from 'axios';
import { weatherService } from '../../services/weatherService';

jest.mock('axios');

describe('weatherService', () => {
  const mockWeatherResponse = {
    data: {
      main: {
        temp: 22.5,
        humidity: 65,
        feels_like: 21.8,
      },
      weather: [
        {
          description: 'cielo despejado',
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    it('should get weather data successfully', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockWeatherResponse);

      const result = await weatherService.getWeather(40.7128, -74.006);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.openweathermap.org/data/2.5/weather')
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('lat=40.7128')
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('lon=-74.006')
      );

      expect(result).toEqual({
        temperatura: 23, // Rounded from 22.5
        humedad: 65,
        descripcion: 'cielo despejado',
        sensacion_termica: 22, // Rounded from 21.8
      });
    });

    it('should round temperature correctly', async () => {
      const response = {
        ...mockWeatherResponse,
        data: {
          ...mockWeatherResponse.data,
          main: {
            temp: 22.4,
            humidity: 65,
            feels_like: 21.6,
          },
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(response);

      const result = await weatherService.getWeather(40.7128, -74.006);

      expect(result?.temperatura).toBe(22);
      expect(result?.sensacion_termica).toBe(22);
    });

    it('should include API key in request', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockWeatherResponse);

      await weatherService.getWeather(40.7128, -74.006);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('appid=4d8fb5b93d4af21d66a2948710284366')
      );
    });

    it('should request metric units', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockWeatherResponse);

      await weatherService.getWeather(40.7128, -74.006);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('units=metric')
      );
    });

    it('should request Spanish language', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockWeatherResponse);

      await weatherService.getWeather(40.7128, -74.006);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('lang=es')
      );
    });

    it('should handle negative coordinates', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockWeatherResponse);

      const result = await weatherService.getWeather(-33.4489, -70.6693); // Santiago, Chile

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('lat=-33.4489')
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('lon=-70.6693')
      );
      expect(result).toBeTruthy();
    });

    it('should handle very cold temperature', async () => {
      const coldResponse = {
        ...mockWeatherResponse,
        data: {
          ...mockWeatherResponse.data,
          main: {
            temp: -10.5,
            humidity: 80,
            feels_like: -15.2,
          },
          weather: [{ description: 'nieve' }],
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(coldResponse);

      const result = await weatherService.getWeather(60.1699, 24.9384); // Helsinki

      expect(result).toEqual({
        temperatura: -10,
        humedad: 80,
        descripcion: 'nieve',
        sensacion_termica: -15,
      });
    });

    it('should handle very hot temperature', async () => {
      const hotResponse = {
        ...mockWeatherResponse,
        data: {
          ...mockWeatherResponse.data,
          main: {
            temp: 42.8,
            humidity: 30,
            feels_like: 45.6,
          },
          weather: [{ description: 'cielo claro' }],
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(hotResponse);

      const result = await weatherService.getWeather(25.2048, 55.2708); // Dubai

      expect(result).toEqual({
        temperatura: 43,
        humedad: 30,
        descripcion: 'cielo claro',
        sensacion_termica: 46,
      });
    });

    it('should return null on API error', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await weatherService.getWeather(40.7128, -74.006);

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await weatherService.getWeather(40.7128, -74.006);

      expect(result).toBeNull();
    });

    it('should return null on invalid response', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await weatherService.getWeather(40.7128, -74.006);

      expect(result).toBeNull();
    });

    it('should return null on timeout', async () => {
      (axios.get as jest.Mock).mockRejectedValue({ code: 'ECONNABORTED' });

      const result = await weatherService.getWeather(40.7128, -74.006);

      expect(result).toBeNull();
    });

    it('should handle high humidity', async () => {
      const humidResponse = {
        ...mockWeatherResponse,
        data: {
          ...mockWeatherResponse.data,
          main: {
            temp: 28.0,
            humidity: 95,
            feels_like: 32.0,
          },
          weather: [{ description: 'lluvia ligera' }],
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(humidResponse);

      const result = await weatherService.getWeather(1.3521, 103.8198); // Singapore

      expect(result?.humedad).toBe(95);
      expect(result?.descripcion).toBe('lluvia ligera');
    });

    it('should handle different weather descriptions', async () => {
      const descriptions = [
        'cielo despejado',
        'nubes dispersas',
        'lluvia moderada',
        'tormenta',
        'nieve ligera',
        'niebla',
      ];

      for (const descripcion of descriptions) {
        const response = {
          ...mockWeatherResponse,
          data: {
            ...mockWeatherResponse.data,
            weather: [{ description: descripcion }],
          },
        };
        (axios.get as jest.Mock).mockResolvedValue(response);

        const result = await weatherService.getWeather(40.7128, -74.006);

        expect(result?.descripcion).toBe(descripcion);
      }
    });
  });
});
