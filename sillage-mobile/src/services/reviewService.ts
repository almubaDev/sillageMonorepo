import api from './api';

export interface ReviewCreateRequest {
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export const reviewService = {
  async submitReview(data: ReviewCreateRequest): Promise<ReviewResponse> {
    const response = await api.post<ReviewResponse>('/reviews', data);
    return response.data;
  },
};
