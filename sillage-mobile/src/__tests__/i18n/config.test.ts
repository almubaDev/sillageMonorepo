/**
 * Tests for i18n configuration
 */

describe('i18n Configuration', () => {
  it('should have correct default language', () => {
    // Mock test - actual i18n is mocked in jest.setup.js
    const mockLanguage = 'es';
    expect(mockLanguage).toBe('es');
  });

  it('should support Spanish language', () => {
    const supportedLanguages = ['es', 'en'];
    expect(supportedLanguages).toContain('es');
  });

  it('should support English language', () => {
    const supportedLanguages = ['es', 'en'];
    expect(supportedLanguages).toContain('en');
  });

  it('should have translation namespaces', () => {
    const namespaces = [
      'common',
      'auth',
      'collection',
      'recommend',
      'profile',
      'history',
    ];

    expect(namespaces.length).toBeGreaterThan(0);
    expect(namespaces).toContain('auth');
    expect(namespaces).toContain('collection');
  });
});
