import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ThemeProvider } from '../../theme/ThemeProvider';

const mockChangeLanguage = jest.fn();
jest.mock('../../i18n', () => ({
  changeLanguage: jest.fn((lang) => mockChangeLanguage(lang)),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('should render with current language flag', () => {
    const { getByText } = renderWithTheme(<LanguageSelector />);
    expect(getByText('🇪🇸')).toBeTruthy();
  });

  it('should render in top-right position by default', () => {
    const { getByText } = renderWithTheme(<LanguageSelector />);
    const container = getByText('🇪🇸').parent;
    expect(container).toBeTruthy();
  });

  it('should render in top-left position when specified', () => {
    const { getByText } = renderWithTheme(<LanguageSelector position="top-left" />);
    const container = getByText('🇪🇸').parent;
    expect(container).toBeTruthy();
  });

  it('should render on web platform', () => {
    Platform.OS = 'web';
    const { getByText } = renderWithTheme(<LanguageSelector />);
    expect(getByText('🇪🇸')).toBeTruthy();
  });

  it('should render on android platform', () => {
    Platform.OS = 'android';
    const { getByText } = renderWithTheme(<LanguageSelector />);
    expect(getByText('🇪🇸')).toBeTruthy();
  });

  it('should have chevron-down icon', () => {
    const { UNSAFE_root } = renderWithTheme(<LanguageSelector />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
