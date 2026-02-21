import api from './api';

// --- Types ---

export interface ReposicionData {
  id: number;
  perfume_coleccion_id: number;
  cantidad_ml: number;
  costo: number;
  created_at: string;
}

export interface ReposicionCreate {
  cantidad_ml: number;
  costo: number;
}

export interface ColeccionStats {
  id: number;
  usuario_id: number;
  nombre: string;
  es_publica: boolean;
  created_at: string;
  perfumes_count: number;
  inversion_total: number;
}

export interface PerfumeColeccionData {
  id: number;
  coleccion_id: number;
  nombre: string;
  marca: string;
  perfumistas: string[];
  acordes: string[];
  notas: string[];
  familia_olfativa: string;
  concentracion: string;
  momento_dia: string;
  estacion: string;
  cantidad_ml: number;
  precio: number | null;
  calificacion: number | null;
  imagen: string;
  created_at: string;
  updated_at: string | null;
  reposiciones: ReposicionData[];
}

export interface PerfumeColeccionCreate {
  nombre: string;
  marca?: string;
  perfumistas?: string[];
  acordes?: string[];
  notas?: string[];
  familia_olfativa?: string;
  concentracion?: string;
  momento_dia?: string;
  estacion?: string;
  cantidad_ml?: number;
  precio?: number | null;
  calificacion?: number | null;
  imagen?: string;
}

export interface PerfumeColeccionUpdate extends Partial<PerfumeColeccionCreate> {}

export interface ImportPerfumeItem {
  nombre: string;
  marca?: string;
  perfumistas?: string[];
  acordes?: string[];
  notas?: string[];
  familia_olfativa?: string;
  concentracion?: string;
  momento_dia?: string;
  estacion?: string;
  cantidad_ml?: number;
  precio?: number | null;
  calificacion?: number | null;
  imagen?: string;
  reposiciones?: { cantidad_ml: number; costo: number }[];
}

export interface ImportResponse {
  imported: number;
  message: string;
}

export interface PerfumeFilters {
  nombre?: string;
  marca?: string;
  perfumistas?: string;
  familia_olfativa?: string;
  momento_dia?: string;
  estacion?: string;
  precio_max?: number;
  calificacion?: number;
}

// --- Service ---

export const coleccionService = {
  async getColeccion(): Promise<ColeccionStats> {
    const response = await api.get<ColeccionStats>('/coleccion');
    return response.data;
  },

  async listPerfumes(filters?: PerfumeFilters): Promise<PerfumeColeccionData[]> {
    const params: Record<string, string | number> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });
    }
    const response = await api.get<PerfumeColeccionData[]>('/coleccion/perfumes', { params });
    return response.data;
  },

  async getPerfume(id: number): Promise<PerfumeColeccionData> {
    const response = await api.get<PerfumeColeccionData>(`/coleccion/perfumes/${id}`);
    return response.data;
  },

  async createPerfume(data: PerfumeColeccionCreate): Promise<PerfumeColeccionData> {
    const response = await api.post<PerfumeColeccionData>('/coleccion/perfumes', data);
    return response.data;
  },

  async updatePerfume(id: number, data: PerfumeColeccionUpdate): Promise<PerfumeColeccionData> {
    const response = await api.put<PerfumeColeccionData>(`/coleccion/perfumes/${id}`, data);
    return response.data;
  },

  async deletePerfume(id: number): Promise<void> {
    await api.delete(`/coleccion/perfumes/${id}`);
  },

  async addReposicion(perfumeId: number, data: ReposicionCreate): Promise<ReposicionData> {
    const response = await api.post<ReposicionData>(
      `/coleccion/perfumes/${perfumeId}/reposiciones`,
      data
    );
    return response.data;
  },

  async deleteReposicion(reposicionId: number): Promise<void> {
    await api.delete(`/coleccion/reposiciones/${reposicionId}`);
  },

  async importPerfumes(perfumes: ImportPerfumeItem[]): Promise<ImportResponse> {
    const response = await api.post<ImportResponse>('/coleccion/import', { perfumes });
    return response.data;
  },
};
