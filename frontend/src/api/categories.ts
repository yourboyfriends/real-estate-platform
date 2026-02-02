import api from './axios';
import { ApiResponse, Category } from '../types';

export const categoriesApi = {
  getAll: async (withCount = false): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories', { 
      params: { withCount: withCount ? 'true' : undefined } 
    });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },
};