import { perfumeService, Perfume, PerfumeCreate } from '../../services/perfumeService';
import api from '../../services/api';

jest.mock('../../services/api');

describe('perfumeService', () => {
  const mockPerfume: Perfume = {
    id: 1,
    nombre: 'Dior Sauvage',
    marca: 'Dior',
    perfumista: 'François Demachy',
    notas: ['bergamot', 'pepper', 'lavender'],
    acordes: ['fresh', 'woody', 'aromatic'],
    created_at: '2025-03-10T10:00:00',
    updated_at: '2025-03-10T10:00:00',
  };

  const mockPerfumeInCollection = {
    ...mockPerfume,
    added_at: '2025-03-11T10:00:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search perfumes with query', async () => {
      const mockPerfumes = [mockPerfume];
      (api.get as jest.Mock).mockResolvedValue({ data: mockPerfumes });

      const result = await perfumeService.search({ q: 'Sauvage' });

      expect(api.get).toHaveBeenCalledWith('/perfumes/search', {
        params: { q: 'Sauvage' },
      });
      expect(result).toEqual(mockPerfumes);
    });

    it('should search perfumes by brand', async () => {
      const mockPerfumes = [mockPerfume];
      (api.get as jest.Mock).mockResolvedValue({ data: mockPerfumes });

      const result = await perfumeService.search({ marca: 'Dior' });

      expect(api.get).toHaveBeenCalledWith('/perfumes/search', {
        params: { marca: 'Dior' },
      });
      expect(result).toEqual(mockPerfumes);
    });

    it('should search perfumes by accord', async () => {
      const mockPerfumes = [mockPerfume];
      (api.get as jest.Mock).mockResolvedValue({ data: mockPerfumes });

      const result = await perfumeService.search({ acorde: 'woody' });

      expect(api.get).toHaveBeenCalledWith('/perfumes/search', {
        params: { acorde: 'woody' },
      });
      expect(result).toEqual(mockPerfumes);
    });

    it('should search with limit', async () => {
      const mockPerfumes = [mockPerfume];
      (api.get as jest.Mock).mockResolvedValue({ data: mockPerfumes });

      const result = await perfumeService.search({ q: 'perfume', limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/perfumes/search', {
        params: { q: 'perfume', limit: 10 },
      });
      expect(result).toEqual(mockPerfumes);
    });

    it('should return empty array when no results', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await perfumeService.search({ q: 'nonexistent' });

      expect(result).toEqual([]);
    });

    it('should handle search error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(perfumeService.search({ q: 'test' })).rejects.toThrow('Network error');
    });
  });

  describe('getMyCollection', () => {
    it('should get user collection', async () => {
      const mockCollection = [mockPerfumeInCollection];
      (api.get as jest.Mock).mockResolvedValue({ data: mockCollection });

      const result = await perfumeService.getMyCollection();

      expect(api.get).toHaveBeenCalledWith('/perfumes/collection');
      expect(result).toEqual(mockCollection);
      expect(result[0]).toHaveProperty('added_at');
    });

    it('should return empty collection', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await perfumeService.getMyCollection();

      expect(result).toEqual([]);
    });

    it('should handle collection fetch error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await expect(perfumeService.getMyCollection()).rejects.toThrow('Unauthorized');
    });
  });

  describe('addToCollection', () => {
    it('should add perfume to collection', async () => {
      const mockResponse = { message: 'Perfume added successfully' };
      (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await perfumeService.addToCollection(1);

      expect(api.post).toHaveBeenCalledWith('/perfumes/collection/1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle add to collection error', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Already in collection'));

      await expect(perfumeService.addToCollection(1)).rejects.toThrow('Already in collection');
    });

    it('should handle network error when adding to collection', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(perfumeService.addToCollection(1)).rejects.toThrow('Network error');
    });
  });

  describe('removeFromCollection', () => {
    it('should remove perfume from collection', async () => {
      const mockResponse = { message: 'Perfume removed successfully' };
      (api.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await perfumeService.removeFromCollection(1);

      expect(api.delete).toHaveBeenCalledWith('/perfumes/collection/1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle remove from collection error', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Not in collection'));

      await expect(perfumeService.removeFromCollection(1)).rejects.toThrow('Not in collection');
    });

    it('should handle network error when removing from collection', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(perfumeService.removeFromCollection(1)).rejects.toThrow('Network error');
    });
  });

  describe('createPerfume', () => {
    it('should create new perfume', async () => {
      const newPerfume: PerfumeCreate = {
        nombre: 'New Perfume',
        marca: 'New Brand',
        perfumista: 'New Perfumer',
        notas: ['note1', 'note2'],
        acordes: ['accord1', 'accord2'],
      };
      (api.post as jest.Mock).mockResolvedValue({ data: { ...newPerfume, id: 2 } });

      const result = await perfumeService.createPerfume(newPerfume);

      expect(api.post).toHaveBeenCalledWith('/perfumes/', newPerfume);
      expect(result).toHaveProperty('id', 2);
      expect(result.nombre).toBe(newPerfume.nombre);
    });

    it('should create perfume without optional fields', async () => {
      const newPerfume: PerfumeCreate = {
        nombre: 'Simple Perfume',
        marca: 'Simple Brand',
        notas: ['note1'],
        acordes: ['accord1'],
      };
      (api.post as jest.Mock).mockResolvedValue({ data: { ...newPerfume, id: 3 } });

      const result = await perfumeService.createPerfume(newPerfume);

      expect(result).toHaveProperty('id', 3);
      expect(result.perfumista).toBeUndefined();
    });

    it('should handle create perfume error', async () => {
      const newPerfume: PerfumeCreate = {
        nombre: 'Test',
        marca: 'Test',
        notas: [],
        acordes: [],
      };
      (api.post as jest.Mock).mockRejectedValue(new Error('Validation error'));

      await expect(perfumeService.createPerfume(newPerfume)).rejects.toThrow('Validation error');
    });

    it('should handle duplicate perfume error', async () => {
      const newPerfume: PerfumeCreate = {
        nombre: 'Dior Sauvage',
        marca: 'Dior',
        notas: ['bergamot'],
        acordes: ['fresh'],
      };
      (api.post as jest.Mock).mockRejectedValue(new Error('Perfume already exists'));

      await expect(perfumeService.createPerfume(newPerfume)).rejects.toThrow(
        'Perfume already exists'
      );
    });
  });
});
