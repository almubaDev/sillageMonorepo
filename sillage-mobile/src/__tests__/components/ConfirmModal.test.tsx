import React from 'react';
import { render } from '@testing-library/react-native';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ThemeProvider } from '../../theme/ThemeProvider';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ConfirmModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component', () => {
    const { UNSAFE_root } = renderWithTheme(
      <ConfirmModal
        visible={true}
        title="Test Title"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('should accept all props', () => {
    const { UNSAFE_root } = renderWithTheme(
      <ConfirmModal
        visible={false}
        title="Test Title"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmText="Yes"
        cancelText="No"
        type="danger"
      />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle warning type', () => {
    const { UNSAFE_root } = renderWithTheme(
      <ConfirmModal
        visible={true}
        title="Warning"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        type="warning"
      />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle info type', () => {
    const { UNSAFE_root } = renderWithTheme(
      <ConfirmModal
        visible={true}
        title="Info"
        message="Information message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        type="info"
      />
    );

    expect(UNSAFE_root).toBeTruthy();
  });
});
