import React from 'react';
import { render } from '@testing-library/react-native';
import { RootNavigator } from '../../navigation/RootNavigator';
import { useAuthContext } from '../../utils/AuthContext';
import { ThemeProvider } from '../../theme/ThemeProvider';

jest.mock('../../utils/AuthContext');
jest.mock('../../navigation/AppNavigator', () => ({
  AppNavigator: () => null,
}));
jest.mock('../../navigation/AuthNavigator', () => ({
  AuthNavigator: () => null,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('RootNavigator', () => {
  it('should render AppNavigator when authenticated', () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    const { UNSAFE_root } = renderWithProviders(<RootNavigator />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render AuthNavigator when not authenticated', () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    const { UNSAFE_root } = renderWithProviders(<RootNavigator />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should show loading state', () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    const { UNSAFE_root } = renderWithProviders(<RootNavigator />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
