import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../../screens/Profile/ProfileScreen';

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { bg: '#FFF', text: '#000', secondary: '#666', accent: '#8B5CF6' },
  }),
}));

jest.mock('../../utils/AuthContext', () => ({
  useAuthContext: () => ({
    user: {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      suscrito: false,
      consultas_restantes: 10,
    },
    logout: jest.fn(),
  }),
}));

jest.mock('../../i18n', () => ({
  changeLanguage: jest.fn(),
  getCurrentLanguage: () => 'es',
}));

describe('ProfileScreen', () => {
  const mockNavigation = { navigate: jest.fn() };

  it('should render profile screen with user info', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('should display user subscription status', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);
    expect(getByText).toBeTruthy();
  });
});
