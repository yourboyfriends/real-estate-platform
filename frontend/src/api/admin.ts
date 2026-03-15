import api from './axios';
import { ApiResponse } from '../types';

export interface AdminStats {
  total_users: number;
  new_users_this_month: number;
  total_properties: number;
  active_properties: number;
  pending_properties: number;
  rejected_properties: number;
  top_properties: Array<{
    id: string;
    title: string;
    view_count: number;
    city: string;
    user_id: string;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  property_count?: number;
}

export interface AdminProperty {
  id: string;
  title: string;
  status: string;
  price: number;
  city: string;
  district: string;
  area: number;
  listing_type: string;
  view_count: number;
  created_at: string;
  user_id: string;
  primary_image: string | null;
  broker: { full_name: string; email: string; phone: string } | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export const adminApi = {
  // Stats
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const res = await api.get<ApiResponse<AdminStats>>('/admin/stats');
    return res.data;
  },

  // Users
  getUsers: async (search?: string, page = 1): Promise<ApiResponse<{ users: AdminUser[]; total: number }>> => {
    const res = await api.get('/admin/users', { params: { search, page } });
    return res.data;
  },
  updateUser: async (id: string, data: { is_active?: boolean; role?: string }): Promise<ApiResponse<AdminUser>> => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },

  // Properties
  getAllProperties: async (status?: string, search?: string, page = 1): Promise<ApiResponse<{ properties: AdminProperty[]; total: number }>> => {
    const res = await api.get('/admin/properties', { params: { status, search, page } });
    return res.data;
  },
  approveProperty: async (id: string): Promise<ApiResponse> => {
    const res = await api.put(`/admin/properties/${id}/approve`);
    return res.data;
  },
  rejectProperty: async (id: string, reason: string): Promise<ApiResponse> => {
    const res = await api.put(`/admin/properties/${id}/reject`, { reason });
    return res.data;
  },
  deleteProperty: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/admin/properties/${id}`);
    return res.data;
  },

  // Categories
  getCategories: async (): Promise<ApiResponse<AdminCategory[]>> => {
    const res = await api.get('/admin/categories');
    return res.data;
  },
  createCategory: async (data: { name: string; slug: string; description?: string; icon?: string }): Promise<ApiResponse<AdminCategory>> => {
    const res = await api.post('/admin/categories', data);
    return res.data;
  },
  updateCategory: async (id: string, data: Partial<AdminCategory>): Promise<ApiResponse<AdminCategory>> => {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/admin/categories/${id}`);
    return res.data;
  },
};
