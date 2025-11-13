import React from 'react';
import { render } from '@testing-library/react-native';
import { Step3PlaceType } from '../../../screens/Recommend/steps/Step3PlaceType';

jest.mock('../../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { bg: '#FFF', text: '#000', secondary: '#666', accent: '#8B5CF6' },
  }),
}));

describe('Step3PlaceType', () => {
  it('should render place type selection', () => {
    const { UNSAFE_root } = render(
      <Step3PlaceType formData={{ lugar_tipo: '' }} onChange={jest.fn()} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
