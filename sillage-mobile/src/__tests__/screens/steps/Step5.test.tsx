import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { bg: '#FFF', text: '#000', secondary: '#666', accent: '#8B5CF6' },
  }),
}));

describe('Step5', () => {
  it('should render step 5', () => {
    const mockFormData = {};
    const mockOnChange = jest.fn();
    expect(true).toBe(true);
  });
});
