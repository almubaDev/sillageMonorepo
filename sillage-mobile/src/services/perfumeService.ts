import api from './api';

export interface Perfume {
  id: number;
  nombre: string;
  marca: string;
  perfumista?: string;
  notas: string[];
  acordes: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PerfumeInCollection extends Perfume {
  added_at: string;
}

export interface PerfumeCreate {
  nombre: string;
  marca: string;
  perfumista?: string;
  notas: string[];
  acordes: string[];
}

export interface SearchParams {
  q?: string;
  marca?: string;
  acorde?: string;
  limit?: number;
}

export interface PerfumeReportCreate {
  nombre: string;
  marca: string;
}

export interface PerfumeReport {
  id: number;
  nombre: string;
  marca: string;
  user_id: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export const perfumeService = {
  // Buscar perfumes
  async search(params: SearchParams): Promise<Perfume[]> {
    const response = await api.get<Perfume[]>('/perfumes/search', { params });
    return response.data;
  },

  // Obtener mi colección
  async getMyCollection(): Promise<PerfumeInCollection[]> {
    const response = await api.get<PerfumeInCollection[]>('/perfumes/collection');
    return response.data;
  },

  // Agregar perfume a mi colección
  async addToCollection(perfumeId: number): Promise<{ message: string }> {
    const response = await api.post(`/perfumes/collection/${perfumeId}`);
    return response.data;
  },

  // Eliminar perfume de mi colección
  async removeFromCollection(perfumeId: number): Promise<{ message: string }> {
    const response = await api.delete(`/perfumes/collection/${perfumeId}`);
    return response.data;
  },

  // Crear nuevo perfume (y agregarlo a colección)
  async createPerfume(data: PerfumeCreate): Promise<Perfume> {
    const response = await api.post<Perfume>('/perfumes/', data);
    return response.data;
  },

  // Reportar perfume faltante
  async reportPerfume(data: PerfumeReportCreate): Promise<PerfumeReport> {
    const response = await api.post<PerfumeReport>('/perfume-reports', data);
    return response.data;
  },

  // Obtener todos los reportes (solo admin)
  async getAllReports(): Promise<PerfumeReport[]> {
    const response = await api.get<PerfumeReport[]>('/perfume-reports');
    return response.data;
  },

  // Eliminar un reporte (solo admin)
  async deleteReport(reportId: number): Promise<void> {
    await api.delete(`/perfume-reports/${reportId}`);
  },
};