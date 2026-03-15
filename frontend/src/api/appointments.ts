import api from './axios';
import { ApiResponse } from '../types';

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Appointment {
    id: string;
    property_id: string;
    user_id: string;
    broker_id: string;
    appointment_date: string;
    appointment_time: string;
    full_name: string;
    phone: string;
    email: string | null;
    message: string | null;
    status: AppointmentStatus;
    rejection_reason: string | null;
    created_at: string;
    property?: {
        title: string;
        address: string;
        primary_image: string | null;
    };
    broker_profile?: {
        full_name: string;
        phone: string;
        avatar_url: string | null;
    };
    client_profile?: {
        full_name: string;
        phone: string;
        avatar_url: string | null;
    };
}

export interface CreateAppointmentPayload {
    property_id: string;
    broker_id: string;
    appointment_date: string;  // YYYY-MM-DD
    appointment_time: string;  // HH:MM
    full_name: string;
    phone: string;
    email?: string;
    message?: string;
}

export const appointmentsApi = {
    /** Lấy danh sách lịch hẹn */
    getAll: async (): Promise<ApiResponse<Appointment[]>> => {
        const res = await api.get<ApiResponse<Appointment[]>>('/appointments');
        return res.data;
    },

    /** Đặt lịch hẹn mới */
    create: async (payload: CreateAppointmentPayload): Promise<ApiResponse<Appointment>> => {
        const res = await api.post<ApiResponse<Appointment>>('/appointments', payload);
        return res.data;
    },

    /** Cập nhật trạng thái */
    updateStatus: async (id: string, status: AppointmentStatus, rejectionReason?: string): Promise<ApiResponse<Appointment>> => {
        const res = await api.put<ApiResponse<Appointment>>(`/appointments/${id}/status`, {
            status,
            rejection_reason: rejectionReason,
        });
        return res.data;
    },

    /** Xóa lịch hẹn */
    delete: async (id: string): Promise<ApiResponse<void>> => {
        const res = await api.delete<ApiResponse<void>>(`/appointments/${id}`);
        return res.data;
    },
};
