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
};