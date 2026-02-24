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
  is_admin: boolean;
  is_superuser: boolean;
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

  // Verificar si hay sesión activa (incluye validación de expiración)
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return false;

    // Decodificar JWT y verificar expiración
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expirado - limpiar storage
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('user');
        return false;
      }
    } catch {
      // Si no se puede decodificar, eliminar token inválido
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      return false;
    }

    return true;
  },

  // Obtener usuario del storage
  async getUserFromStorage(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // console.log('📡 AuthService: Enviando solicitud de cambio de contraseña...');
    // console.log('📡 Endpoint: /password/change-password');
    // console.log('📡 Datos:', { current_password: '***', new_password: '***' });

    try {
      const response = await api.post('/password/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      // console.log('✅ AuthService: Respuesta exitosa:', response.data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Solicitar recuperación de contraseña
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/password/request-reset', { email });
  },

  // Restablecer contraseña con token
  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    await api.post('/password/reset-password', {
      email,
      token,
      new_password: newPassword,
    });
  },

  // Eliminar cuenta
  async deleteAccount(password: string): Promise<{ message: string; email: string }> {
    const response = await api.delete('/auth/account', {
      data: { password },
    });

    // Limpiar datos locales
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');

    return response.data;
  },
};