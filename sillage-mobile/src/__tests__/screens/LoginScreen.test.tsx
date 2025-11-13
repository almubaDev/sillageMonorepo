import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../screens/Auth/LoginScreen';

// Mock dependencies
jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#FFFFFF',
      text: '#000000',
      secondary: '#666666',
      accent: '#8B5CF6',
    },
  }),
}));

jest.mock('../../utils/AuthContext', () => ({
  useAuthContext: () => ({
    login: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

jest.mock('../../hooks/useLanguageChange', () => ({
  useLanguageChange: () => 'es',
}));

jest.mock('../../components/LanguageSelector', () => ({
  LanguageSelector: () => null,
}));

describe('LoginScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByPlaceholderText('auth:login.emailPlaceholder')).toBeTruthy();
    expect(getByPlaceholderText('auth:login.passwordPlaceholder')).toBeTruthy();
    expect(getByText('auth:login.loginButton')).toBeTruthy();
  });

  it('should show validation errors for empty fields', async () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    const loginButton = getByText('auth:login.loginButton');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('auth:login.errors.emailRequired')).toBeTruthy();
    });
  });

  it('should navigate to register screen', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    const registerButton = getByText('auth:login.createAccount');
    fireEvent.press(registerButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });
});
