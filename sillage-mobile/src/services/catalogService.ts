import api from './api';

export interface CatalogPerfume {
  nombre: string;
  marca: string;
  acordes: string[];
  notas: string[];
}

export interface CatalogSearchResult {
  id: number;
  nombre: string;
  marca: string;
  acordes: string[] | null;
  notas: string[] | null;
}

export const catalogService = {
  async searchBrands(q: string): Promise<string[]> {
    const response = await api.get<string[]>('/perfumes/brands', { params: { q, limit: 20 } });
    return response.data;
  },

  async searchPerfumes(q: string, marca?: string): Promise<CatalogSearchResult[]> {
    const params: Record<string, string | number> = { q, limit: 20 };
    if (marca) params.marca = marca;
    const response = await api.get<CatalogSearchResult[]>('/perfumes/search', { params });
    return response.data;
  },

  async matchPerfume(nombre: string, marca: string): Promise<CatalogPerfume | null> {
    const response = await api.get<CatalogPerfume | null>('/perfumes/match', {
      params: { nombre, marca },
    });
    return response.data;
  },
};
