import axios from 'axios';

const OPENWEATHER_API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // Tu API key

interface WeatherData {
  temperatura: number;
  humedad: number;
  descripcion: string;
  sensacion_termica: number;
}

export const weatherService = {
  async getWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;
      
      const response = await axios.get(url);

      return {
        temperatura: Math.round(response.data.main.temp),
        humedad: response.data.main.humidity,
        descripcion: response.data.weather[0].description,
        sensacion_termica: Math.round(response.data.main.feels_like),
      };
    } catch (error) {
      console.error('Error obteniendo clima:', error);
      return null;
    }
  },
};