import { useState, useEffect } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await authService.getUserFromStorage();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión',
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al registrarse',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };
};