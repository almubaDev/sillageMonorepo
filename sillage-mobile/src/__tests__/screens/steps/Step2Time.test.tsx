import React from 'react';
import { render } from '@testing-library/react-native';
import { Step2Time } from '../../../screens/Recommend/steps/Step2Time';

jest.mock('../../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { bg: '#FFF', text: '#000', secondary: '#666', accent: '#8B5CF6' },
  }),
}));

describe('Step2Time', () => {
  const mockOnChange = jest.fn();
  const mockFormData = { hora_evento: '' };

  it('should render time selection', () => {
    const { UNSAFE_root } = render(
      <Step2Time formData={mockFormData} onChange={mockOnChange} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
