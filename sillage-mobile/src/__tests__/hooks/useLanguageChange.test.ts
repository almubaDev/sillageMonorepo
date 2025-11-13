import { renderHook, act } from '@testing-library/react-native';
import { useLanguageChange } from '../../hooks/useLanguageChange';

// Mock i18n with event emitter
const mockOn = jest.fn();
const mockOff = jest.fn();

const mockI18n = {
  language: 'es',
  on: mockOn,
  off: mockOff,
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n,
  }),
}));

describe('useLanguageChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.language = 'es';
  });

  it('should return current language on mount', () => {
    const { result } = renderHook(() => useLanguageChange());
    expect(result.current).toBe('es');
  });

  it('should register language change listener on mount', () => {
    renderHook(() => useLanguageChange());
    expect(mockOn).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });

  it('should unregister listener on unmount', () => {
    const { unmount } = renderHook(() => useLanguageChange());
    unmount();
    expect(mockOff).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });

  it('should update language when languageChanged event is triggered', () => {
    const { result } = renderHook(() => useLanguageChange());

    // Get the registered callback
    const languageChangeCallback = mockOn.mock.calls[0][1];

    // Simulate language change
    act(() => {
      languageChangeCallback('en');
    });

    expect(result.current).toBe('en');
  });

  it('should call callback when language changes', () => {
    const mockCallback = jest.fn();
    renderHook(() => useLanguageChange(mockCallback));

    // Get the registered callback
    const languageChangeCallback = mockOn.mock.calls[0][1];

    // Simulate language change
    act(() => {
      languageChangeCallback('en');
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should work without callback', () => {
    const { result } = renderHook(() => useLanguageChange());

    // Get the registered callback
    const languageChangeCallback = mockOn.mock.calls[0][1];

    // Should not throw when no callback is provided
    expect(() => {
      act(() => {
        languageChangeCallback('en');
      });
    }).not.toThrow();

    expect(result.current).toBe('en');
  });

  it('should handle multiple language changes', () => {
    const { result } = renderHook(() => useLanguageChange());

    // Get the registered callback
    const languageChangeCallback = mockOn.mock.calls[0][1];

    // First change
    act(() => {
      languageChangeCallback('en');
    });
    expect(result.current).toBe('en');

    // Second change
    act(() => {
      languageChangeCallback('fr');
    });
    expect(result.current).toBe('fr');

    // Back to Spanish
    act(() => {
      languageChangeCallback('es');
    });
    expect(result.current).toBe('es');
  });
});
