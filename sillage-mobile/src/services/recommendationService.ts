import api from './api';

export interface CreateRecommendationRequest {
  fecha_evento: string; // ISO format: YYYY-MM-DD
  hora_evento: string; // HH:MM
  latitud: number;
  longitud: number;
  lugar_nombre: string;
  lugar_tipo: 'abierto' | 'cerrado';
  ocasion: string;
  expectativa: string;
  vestimenta: string;
}

export interface RecommendationResponse {
  id: number;
  perfume_recomendado: {
    id: number;
    nombre: string;
    marca: string;
    acordes: string[];
    notas: string[];
  };
  clima_descripcion: string;
  temperatura: number;
  humedad: number;
  respuesta_ia: string;
  created_at: string;
}

export const recommendationService = {
  async create(data: CreateRecommendationRequest): Promise<RecommendationResponse> {
    const response = await api.post('/recommendations/', data);
    return response.data;
  },

  async getHistory(): Promise<RecommendationResponse[]> {
    const response = await api.get('/recommendations/');
    return response.data;
  },

  async getById(id: number): Promise<RecommendationResponse> {
    const response = await api.get(`/recommendations/${id}`);
    return response.data;
  },
};