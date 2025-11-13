import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuthContext } from '../../utils/AuthContext';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');

const TestComponent = () => {
  const { user, isAuthenticated } = useAuthContext();
  return (
    <>
      <Text>{user ? user.email : 'no-user'}</Text>
      <Text>{isAuthenticated ? 'authenticated' : 'not-authenticated'}</Text>
    </>
  );
};

describe('AuthContext', () => {
  it('should provide auth context', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' },
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('authenticated')).toBeTruthy();
    });
  });

  it('should handle unauthenticated state', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('no-user')).toBeTruthy();
      expect(getByText('not-authenticated')).toBeTruthy();
    });
  });
});
