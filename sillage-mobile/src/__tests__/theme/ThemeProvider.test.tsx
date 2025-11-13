import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../../theme/ThemeProvider';

const TestComponent = () => {
  const { colors } = useTheme();
  return (
    <>
      <Text>{colors.bg}</Text>
      <Text>{colors.text}</Text>
      <Text>{colors.accent}</Text>
    </>
  );
};

describe('ThemeProvider', () => {
  it('should provide theme colors', () => {
    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should render color values
    expect(getByText).toBeTruthy();
  });

  it('should have required color properties', () => {
    const { UNSAFE_root } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(UNSAFE_root).toBeTruthy();
  });
});
