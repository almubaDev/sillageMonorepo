import api from './api';
import { Perfume } from './perfumeService';

export interface RecommendationRequest {
  fecha_evento: string; // formato: "YYYY-MM-DD"
  hora_evento: string;  // formato: "HH:MM:SS"
  latitud: number;
  longitud: number;
  lugar_nombre: string;
  lugar_tipo: 'abierto' | 'cerrado';
  lugar_descripcion: string;
  ocasion: string;
  expectativa: string;
  vestimenta: string;
}

export interface Recommendation {
  id: number;
  fecha_evento: string;
  hora_evento: string;
  lugar_nombre: string;
  ocasion: string;
  expectativa: string;
  vestimenta: string;
  clima_descripcion: string;
  temperatura: number;
  humedad: number;
  perfume_recomendado_id: number | null;
  perfume_recomendado: Perfume | null;
  explicacion: string | null;
  respuesta_ia: string;
  created_at: string;
}

export const recommendationService = {
  // Crear nueva recomendación
  async create(data: RecommendationRequest): Promise<Recommendation> {
    const response = await api.post<Recommendation>('/recommendations/', data);
    return response.data;
  },

  // Obtener historial de recomendaciones
  async getHistory(limit: number = 10): Promise<Recommendation[]> {
    const response = await api.get<Recommendation[]>('/recommendations/history', {
      params: { limit },
    });
    return response.data;
  },

  // Obtener una recomendación específica
  async getById(id: number): Promise<Recommendation> {
    const response = await api.get<Recommendation>(`/recommendations/${id}`);
    return response.data;
  },
};