import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { setUnauthorizedCallback } from '../../services/api';

jest.mock('../../services/authService');
jest.mock('../../services/api');

describe('useAuth', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nombre: 'Test User',
    is_active: true,
    has_subscription: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should check auth on mount and set user if authenticated', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authService.getUserFromStorage as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should remain unauthenticated if no user in storage', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (authService.login as jest.Mock).mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let response;
    await act(async () => {
      response = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(response).toEqual({ success: true });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle login error', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { detail: 'Invalid credentials' } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let response;
    await act(async () => {
      response = await result.current.login({
        email: 'test@example.com',
        password: 'wrong',
      });
    });

    expect(response).toEqual({
      success: false,
      error: 'Invalid credentials',
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should register successfully', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (authService.register as jest.Mock).mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let response;
    await act(async () => {
      response = await result.current.register({
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Test User',
      });
    });

    expect(response).toEqual({ success: true });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle register error', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (authService.register as jest.Mock).mockRejectedValue({
      response: { data: { detail: 'Email already exists' } },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let response;
    await act(async () => {
      response = await result.current.register({
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Test User',
      });
    });

    expect(response).toEqual({
      success: false,
      error: 'Email already exists',
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should logout successfully', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authService.getUserFromStorage as jest.Mock).mockResolvedValue(mockUser);
    (authService.logout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should refresh user data', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authService.getUserFromStorage as jest.Mock).mockResolvedValue(mockUser);

    const updatedUser = { ...mockUser, nombre: 'Updated Name' };
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(updatedUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(updatedUser);
  });

  it('should register unauthorized callback', async () => {
    (authService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (authService.getUserFromStorage as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(setUnauthorizedCallback).toHaveBeenCalled();

    // Simulate unauthorized callback
    const callback = (setUnauthorizedCallback as jest.Mock).mock.calls[0][0];
    act(() => {
      callback();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle auth check error gracefully', async () => {
    (authService.isAuthenticated as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
