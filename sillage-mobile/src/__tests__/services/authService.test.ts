import { authService, LoginCredentials, RegisterData, User } from '../../services/authService';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../services/api');

describe('authService', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    suscrito: false,
    consultas_restantes: 10,
    is_active: true,
    is_verified: true,
  };

  const mockAuthResponse = {
    access_token: 'test-token-123',
    token_type: 'bearer',
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully log in and store token', async () => {
      const credentials: LoginCredentials = {
        username: 'test@example.com',
        password: 'password123',
      };

      (api.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith(
        '/auth/login',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      expect(result).toEqual(mockAuthResponse);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'test-token-123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    it('should throw error on failed login', async () => {
      const credentials: LoginCredentials = {
        username: 'test@example.com',
        password: 'wrongpassword',
      };

      (api.post as jest.Mock).mockRejectedValue({
        response: { status: 401, data: { detail: 'Invalid credentials' } },
      });

      await expect(authService.login(credentials)).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerData: RegisterData = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
      };

      (api.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockAuthResponse);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'test-token-123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    it('should remove access_token and user from storage', async () => {
      await authService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch and store current user', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-token');

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('access_token');
    });

    it('should return false when token does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getUserFromStorage', () => {
    it('should retrieve and parse user from storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));

      const result = await authService.getUserFromStorage();

      expect(result).toEqual(mockUser);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null when user does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.getUserFromStorage();

      expect(result).toBeNull();
    });
  });
});
