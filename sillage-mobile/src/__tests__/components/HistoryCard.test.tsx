import React from 'react';
import { render } from '@testing-library/react-native';
import { HistoryCard } from '../../components/HistoryCard';
import { ThemeProvider } from '../../theme/ThemeProvider';

jest.mock('../../utils/formatters', () => ({
  formatPerfumeName: (name: string) => name,
  formatBrand: (brand: string) => brand,
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('HistoryCard', () => {
  const mockRecommendation = {
    id: 1,
    fecha_evento: '2025-03-15',
    hora_evento: '18:00',
    lugar_nombre: 'Cena romántica',
    clima_descripcion: 'cielo despejado',
    temperatura: 22,
    perfume_recomendado: {
      nombre: 'Dior Sauvage',
      marca: 'Dior',
    },
    created_at: '2025-03-10T10:00:00',
  };

  const mockRecommendationNoPerfume = {
    ...mockRecommendation,
    perfume_recomendado: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with perfume recommendation', () => {
    const { getByText } = renderWithTheme(<HistoryCard recommendation={mockRecommendation} />);

    expect(getByText('Dior Sauvage')).toBeTruthy();
    expect(getByText('Dior')).toBeTruthy();
    expect(getByText('Cena romántica')).toBeTruthy();
  });

  it('should render without perfume recommendation', () => {
    const { getByText } = renderWithTheme(<HistoryCard recommendation={mockRecommendationNoPerfume} />);

    expect(getByText('components:historyCard.noPerfume')).toBeTruthy();
  });

  it('should display correct weather information', () => {
    const { getByText } = renderWithTheme(<HistoryCard recommendation={mockRecommendation} />);

    expect(getByText(/22°C/)).toBeTruthy();
    expect(getByText(/cielo despejado/)).toBeTruthy();
  });

  it('should display view details text', () => {
    const { getByText } = renderWithTheme(<HistoryCard recommendation={mockRecommendation} />);
    expect(getByText('components:historyCard.viewDetails')).toBeTruthy();
  });

  it('should render with different temperatures', () => {
    const coldRec = { ...mockRecommendation, temperatura: 5 };
    const { UNSAFE_root } = renderWithTheme(<HistoryCard recommendation={coldRec} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle onPress callback', () => {
    const mockOnPress = jest.fn();
    const { UNSAFE_root } = renderWithTheme(
      <HistoryCard recommendation={mockRecommendation} onPress={mockOnPress} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
