import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración base de la API
const API_BASE_URL = 'http://localhost:8000/api/v1';
//const API_BASE_URL = 'https://92t98wk8-8000.brs.devtunnels.ms/api/v1';

// Variable para almacenar el callback de logout
let onUnauthorizedCallback: (() => void) | null = null;

// Función para registrar el callback de logout
export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para agregar token JWT en cada petición
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // console.log('🔒 Token expirado o inválido - cerrando sesión automáticamente');

      // Limpiar el almacenamiento
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');

      // Llamar al callback de logout si está registrado
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;