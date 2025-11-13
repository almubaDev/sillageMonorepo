// sillage-mobile/src/services/recommendationService.ts

import api from './api';

export interface CreateRecommendationRequest {
  fecha_evento: string; // ISO format: YYYY-MM-DD
  hora_evento: string; // HH:MM
  latitud: number;
  longitud: number;
  lugar_nombre: string;
  lugar_tipo: 'abierto' | 'cerrado';
  lugar_descripcion: string;
  ocasion: string;
  expectativa: string;
  vestimenta: string;
  idioma?: string; // Idioma preferido del usuario (es, en)
}

export interface PerfumeRecomendado {
  id: number;
  nombre: string;
  marca: string;
  perfumista?: string;
  notas: string[];
  acordes: string[];
}

export interface RecommendationResponse {
  id: number;
  fecha_evento: string;
  hora_evento: string;
  lugar_nombre: string;
  lugar_tipo: 'abierto' | 'cerrado';
  ocasion: string;
  expectativa: string;
  vestimenta: string;
  clima_descripcion: string;
  temperatura: number;
  humedad: number;
  perfume_recomendado_id: number | null;
  perfume_recomendado: PerfumeRecomendado | null;
  explicacion: string;
  respuesta_ia: string;
  created_at: string;
  consultas_restantes?: number;
}

export interface RecommendationError {
  detail: string;
  status?: number;
}

export const recommendationService = {
  /**
   * Crear una nueva recomendación
   * @param data - Datos del formulario
   * @returns Recomendación completa con perfume sugerido
   */
  async create(data: CreateRecommendationRequest): Promise<RecommendationResponse> {
    try {
      const response = await api.post<RecommendationResponse>('/recommendations/', data);
      return response.data;
    } catch (error: any) {
      // Manejo detallado de errores
      if (error.response) {
        const errorDetail: RecommendationError = {
          detail: error.response.data?.detail || 'Error al generar recomendación',
          status: error.response.status
        };
        
        // Errores específicos
        if (error.response.status === 400) {
          if (error.response.data?.detail?.includes('colección')) {
            errorDetail.detail = 'Necesitas tener al menos un perfume en tu colección';
          }
        } else if (error.response.status === 402) {
          errorDetail.detail = 'Necesitas una suscripción activa para obtener recomendaciones';
        } else if (error.response.status === 429) {
          errorDetail.detail = 'No tienes consultas disponibles este mes. Considera renovar tu suscripción.';
        }
        
        throw errorDetail;
      }
      
      // Error de red
      throw {
        detail: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
        status: 0
      };
    }
  },

  /**
   * Obtener historial de recomendaciones
   * @param limit - Número máximo de resultados
   * @param skip - Número de resultados a saltar (paginación)
   * @returns Lista de recomendaciones
   */
  async getHistory(limit: number = 20, skip: number = 0): Promise<RecommendationResponse[]> {
    try {
      const response = await api.get<RecommendationResponse[]>('/recommendations/history', {
        params: { limit, skip }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  },

  /**
   * Obtener una recomendación específica por ID
   * @param id - ID de la recomendación
   * @returns Recomendación completa
   */
  async getById(id: number): Promise<RecommendationResponse> {
    try {
      const response = await api.get<RecommendationResponse>(`/recommendations/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Recomendación no encontrada');
      }
      throw error;
    }
  }
};