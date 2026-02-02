import api from './axios';
import { ApiResponse, BlogPost, BlogFilters } from '../types';

export const blogApi = {
    getAll: async (filters?: BlogFilters): Promise<ApiResponse<BlogPost[]>> => {
        const response = await api.get('/blog/posts', { params: filters });
        return response.data;
    },

    getBySlug: async (slug: string): Promise<ApiResponse<BlogPost>> => {
        const response = await api.get(`/blog/posts/${slug}`);
        return response.data;
    },

    create: async (data: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> => {
        const response = await api.post('/blog/posts', data);
        return response.data;
    },

    update: async (id: string, data: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> => {
        const response = await api.put(`/blog/posts/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/blog/posts/${id}`);
        return response.data;
    },
};
