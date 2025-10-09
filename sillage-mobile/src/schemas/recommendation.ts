// sillage-mobile/src/schemas/recommendation.ts

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
  consultas_restantes?: number; // Consultas que quedan después de esta
}

export interface RecommendationError {
  detail: string;
  status?: number;
}