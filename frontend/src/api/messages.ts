import api from './axios';
import { ApiResponse } from '../types';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    property_id: string | null;
    message: string;
    image_url: string | null;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    partner_id: string;
    full_name: string;
    avatar_url: string | null;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    property_id: string | null;
    property_title: string | null;
    property_image: string | null;
}

export const messagesApi = {
    /** Lấy danh sách cuộc trò chuyện */
    getConversations: async () => {
        const res = await api.get<ApiResponse<Conversation[]>>('/messages/conversations');
        return res.data;
    },

    /** Lấy tin nhắn giữa 2 người */
    getMessages: async (partnerId: string) => {
        const res = await api.get<ApiResponse<Message[]>>(`/messages/${partnerId}`);
        return res.data;
    },

    /** Gửi tin nhắn */
    sendMessage: async (payload: {
        receiver_id: string;
        message: string;
        property_id?: string | null;
        image_url?: string | null;
    }) => {
        const res = await api.post<ApiResponse<Message>>('/messages', payload);
        return res.data;
    },

    /** Số tin nhắn chưa đọc */
    getUnreadCount: async () => {
        const res = await api.get<ApiResponse<{ count: number }>>('/messages/unread-count');
        return res.data;
    },

    /** Upload ảnh, trả về URL */
    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post<ApiResponse<{ url: string }>>('/messages/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data!.url;
    },
};
