import api from './axios';
import { ApiResponse, Property, PropertyFilters } from '../types';

export const propertiesApi = {
  getAll: async (filters?: PropertyFilters): Promise<ApiResponse<Property[]>> => {
    const response = await api.get('/properties', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Property>> => {
    const response = await api.get(`/properties/${id}?view=true`);
    return response.data;
  },

  getFeatured: async (limit = 6): Promise<ApiResponse<Property[]>> => {
    const response = await api.get('/properties/featured', { params: { limit } });
    return response.data;
  },

  getMyProperties: async (filters?: PropertyFilters): Promise<ApiResponse<Property[]>> => {
    const response = await api.get('/properties/my', { params: filters });
    return response.data;
  },

  getPendingProperties: async (filters?: PropertyFilters): Promise<ApiResponse<Property[]>> => {
    const response = await api.get('/properties/pending', { params: filters });
    return response.data;
  },

  create: async (data: Partial<Property>): Promise<ApiResponse<Property>> => {
    const response = await api.post('/properties', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Property>): Promise<ApiResponse<Property>> => {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  approveProperty: async (id: string): Promise<ApiResponse<Property>> => {
    const response = await api.put(`/properties/${id}/approve`);
    return response.data;
  },

  rejectProperty: async (id: string, reason?: string): Promise<ApiResponse<Property>> => {
    const response = await api.put(`/properties/${id}/reject`, { reason });
    return response.data;
  },

  uploadImages: async (propertyId: string, images: File[]): Promise<ApiResponse> => {
    const formData = new FormData();
    images.forEach(image => formData.append('images', image));
    const response = await api.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};