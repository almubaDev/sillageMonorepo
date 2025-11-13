import {
  recommendationService,
  CreateRecommendationRequest,
  RecommendationResponse,
} from '../../services/recommendationService';
import api from '../../services/api';

jest.mock('../../services/api');

describe('recommendationService', () => {
  const mockRequest: CreateRecommendationRequest = {
    fecha_evento: '2025-03-20',
    hora_evento: '19:00',
    latitud: 40.7128,
    longitud: -74.006,
    lugar_nombre: 'Cena romántica',
    lugar_tipo: 'cerrado',
    lugar_descripcion: 'Restaurante elegante',
    ocasion: 'Cita romántica',
    expectativa: 'Impresionar',
    vestimenta: 'Elegante',
    idioma: 'es',
  };

  const mockResponse: RecommendationResponse = {
    id: 1,
    fecha_evento: '2025-03-20',
    hora_evento: '19:00',
    lugar_nombre: 'Cena romántica',
    lugar_tipo: 'cerrado',
    ocasion: 'Cita romántica',
    expectativa: 'Impresionar',
    vestimenta: 'Elegante',
    clima_descripcion: 'cielo despejado',
    temperatura: 22,
    humedad: 65,
    perfume_recomendado_id: 1,
    perfume_recomendado: {
      id: 1,
      nombre: 'Dior Sauvage',
      marca: 'Dior',
      perfumista: 'François Demachy',
      notas: ['bergamot', 'pepper', 'lavender'],
      acordes: ['fresh', 'woody', 'aromatic'],
    },
    explicacion: 'Perfume ideal para la ocasión',
    respuesta_ia: 'Te recomiendo Dior Sauvage...',
    created_at: '2025-03-15T10:00:00',
    consultas_restantes: 9,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create recommendation successfully', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await recommendationService.create(mockRequest);

      expect(api.post).toHaveBeenCalledWith('/recommendations/', mockRequest);
      expect(result).toEqual(mockResponse);
      expect(result.perfume_recomendado).toBeTruthy();
    });

    it('should create recommendation without language', async () => {
      const requestWithoutLang = { ...mockRequest };
      delete requestWithoutLang.idioma;

      (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await recommendationService.create(requestWithoutLang);

      expect(api.post).toHaveBeenCalledWith('/recommendations/', requestWithoutLang);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty collection error (400)', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { detail: 'No tienes perfumes en tu colección' },
        },
      });

      await expect(recommendationService.create(mockRequest)).rejects.toMatchObject({
        detail: 'Necesitas tener al menos un perfume en tu colección',
        status: 400,
      });
    });

    it('should handle subscription required error (402)', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: {
          status: 402,
          data: { detail: 'Subscription required' },
        },
      });

      await expect(recommendationService.create(mockRequest)).rejects.toMatchObject({
        detail: 'Necesitas una suscripción activa para obtener recomendaciones',
        status: 402,
      });
    });

    it('should handle rate limit error (429)', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: {
          status: 429,
          data: { detail: 'Too many requests' },
        },
      });

      await expect(recommendationService.create(mockRequest)).rejects.toMatchObject({
        detail: 'No tienes consultas disponibles este mes. Considera renovar tu suscripción.',
        status: 429,
      });
    });

    it('should handle generic server error', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { detail: 'Internal server error' },
        },
      });

      await expect(recommendationService.create(mockRequest)).rejects.toMatchObject({
        detail: 'Internal server error',
        status: 500,
      });
    });

    it('should handle network error', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(recommendationService.create(mockRequest)).rejects.toMatchObject({
        detail: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
        status: 0,
      });
    });

    it('should handle error without response', async () => {
      (api.post as jest.Mock).mockRejectedValue({ message: 'Unknown error' });

      await expect(recommendationService.create(mockRequest)).rejects.toMatchObject({
        detail: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
        status: 0,
      });
    });
  });

  describe('getHistory', () => {
    it('should get recommendation history with default params', async () => {
      const mockHistory = [mockResponse];
      (api.get as jest.Mock).mockResolvedValue({ data: mockHistory });

      const result = await recommendationService.getHistory();

      expect(api.get).toHaveBeenCalledWith('/recommendations/history', {
        params: { limit: 20, skip: 0 },
      });
      expect(result).toEqual(mockHistory);
    });

    it('should get recommendation history with custom params', async () => {
      const mockHistory = [mockResponse];
      (api.get as jest.Mock).mockResolvedValue({ data: mockHistory });

      const result = await recommendationService.getHistory(10, 5);

      expect(api.get).toHaveBeenCalledWith('/recommendations/history', {
        params: { limit: 10, skip: 5 },
      });
      expect(result).toEqual(mockHistory);
    });

    it('should return empty history', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await recommendationService.getHistory();

      expect(result).toEqual([]);
    });

    it('should handle history fetch error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await expect(recommendationService.getHistory()).rejects.toThrow('Unauthorized');
    });

    it('should handle pagination correctly', async () => {
      const mockHistory = [mockResponse];
      (api.get as jest.Mock).mockResolvedValue({ data: mockHistory });

      // Page 1
      await recommendationService.getHistory(10, 0);
      expect(api.get).toHaveBeenLastCalledWith('/recommendations/history', {
        params: { limit: 10, skip: 0 },
      });

      // Page 2
      await recommendationService.getHistory(10, 10);
      expect(api.get).toHaveBeenLastCalledWith('/recommendations/history', {
        params: { limit: 10, skip: 10 },
      });
    });
  });

  describe('getById', () => {
    it('should get recommendation by id', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await recommendationService.getById(1);

      expect(api.get).toHaveBeenCalledWith('/recommendations/1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle not found error (404)', async () => {
      (api.get as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      });

      await expect(recommendationService.getById(999)).rejects.toThrow(
        'Recomendación no encontrada'
      );
    });

    it('should handle other errors', async () => {
      (api.get as jest.Mock).mockRejectedValue({
        response: { status: 500 },
      });

      await expect(recommendationService.getById(1)).rejects.toMatchObject({
        response: { status: 500 },
      });
    });

    it('should handle network error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(recommendationService.getById(1)).rejects.toThrow('Network error');
    });

    it('should retrieve full recommendation details', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await recommendationService.getById(1);

      expect(result).toHaveProperty('perfume_recomendado');
      expect(result).toHaveProperty('explicacion');
      expect(result).toHaveProperty('respuesta_ia');
      expect(result).toHaveProperty('clima_descripcion');
    });
  });
});
