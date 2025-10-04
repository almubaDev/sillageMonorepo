import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  username: string; // FastAPI OAuth2 usa 'username' aunque sea email
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  suscrito: boolean;
  consultas_restantes: number;
  is_active: boolean;
  is_verified: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Guardar token
    await AsyncStorage.setItem('access_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);

    // Guardar token
    await AsyncStorage.setItem('access_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
  },

  // Obtener usuario actual
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Verificar si hay sesión activa
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },

  // Obtener usuario del storage
  async getUserFromStorage(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },
};