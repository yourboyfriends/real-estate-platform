import api from './axios';
import { ApiResponse } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
    | 'property_approved'
    | 'property_rejected'
    | 'property_expiring'
    | 'new_contact'
    | 'system';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    property_id?: string;
    property_title?: string;
    rejection_reason?: string;
    is_read: boolean;
    created_at: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    unread_count: number;
}

// ─── API ────────────────────────────────────────────────────────────────────────

export const notificationsApi = {
    /** Lấy danh sách thông báo */
    getAll: async (): Promise<ApiResponse<NotificationsResponse>> => {
        const response = await api.get('/notifications');
        return response.data;
    },

    /** Đánh dấu một thông báo đã đọc */
    markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    /** Đánh dấu tất cả thông báo đã đọc */
    markAllAsRead: async (): Promise<ApiResponse<null>> => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    /** Xóa một thông báo */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    /** Lấy số lượng thông báo chưa đọc */
    getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
};
