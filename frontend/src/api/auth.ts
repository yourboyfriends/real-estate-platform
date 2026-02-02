import api from './axios';
import { ApiResponse, User } from '../types';

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};