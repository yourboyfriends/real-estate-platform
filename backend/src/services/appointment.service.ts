import { supabase } from '../config/database';
import { AppError } from '../utils/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Appointment {
    id: string;
    property_id: string;
    user_id: string;
    broker_id: string;
    appointment_date: string;   // YYYY-MM-DD
    appointment_time: string;   // HH:MM:SS
    full_name: string;
    phone: string;
    email: string | null;
    message: string | null;
    status: AppointmentStatus;
    rejection_reason: string | null;
    created_at: string;
    // Joined
    property?: {
        title: string;
        address: string;
        primary_image: string | null;
    };
    client_profile?: {
        full_name: string;
        phone: string;
        avatar_url: string | null;
    };
    broker_profile?: {
        full_name: string;
        phone: string;
        avatar_url: string | null;
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AppointmentService {

    /**
     * Tạo lịch hẹn mới
     */
    async create(userId: string, body: {
        property_id: string;
        broker_id: string;
        appointment_date: string;
        appointment_time: string;
        full_name: string;
        phone: string;
        email?: string;
        message?: string;
    }): Promise<Appointment> {
        const { property_id, broker_id, appointment_date, appointment_time, full_name, phone, email, message } = body;

        // Validate date is not in the past
        if (new Date(appointment_date) < new Date(new Date().toDateString())) {
            throw new AppError('Ngày hẹn không được trong quá khứ', 400);
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                property_id,
                user_id: userId,
                broker_id,
                appointment_date,
                appointment_time,
                full_name: full_name.trim(),
                phone: phone.trim(),
                email: email?.trim() || null,
                message: message?.trim() || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw new AppError(error.message, 400);
        return data as Appointment;
    }

    /**
     * Lấy danh sách lịch hẹn (user hoặc broker)
     * Kèm thông tin property + profiles
     */
    async getByUser(userId: string): Promise<Appointment[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .or(`user_id.eq.${userId},broker_id.eq.${userId}`)
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false });

        if (error) throw new AppError(error.message, 400);
        if (!data || data.length === 0) return [];

        // Enrich with property + profiles in parallel
        const enriched = await Promise.all(
            (data as Appointment[]).map(async (apt) => {
                // Property info + primary image
                const { data: prop } = await supabase
                    .from('properties')
                    .select('title, address')
                    .eq('id', apt.property_id)
                    .single();

                const { data: img } = await supabase
                    .from('property_images')
                    .select('url')
                    .eq('property_id', apt.property_id)
                    .eq('is_primary', true)
                    .single();

                // Broker profile
                const { data: broker } = await supabase
                    .from('users')
                    .select('full_name, phone, avatar_url')
                    .eq('id', apt.broker_id)
                    .single();

                // Client profile (only needed for broker view)
                const { data: client } = await supabase
                    .from('users')
                    .select('full_name, phone, avatar_url')
                    .eq('id', apt.user_id)
                    .single();

                return {
                    ...apt,
                    property: prop
                        ? { ...prop, primary_image: img?.url ?? null }
                        : undefined,
                    broker_profile: broker ?? undefined,
                    client_profile: client ?? undefined,
                };
            })
        );

        return enriched;
    }

    /**
     * Cập nhật trạng thái: confirm / reject / cancel / complete
     */
    async updateStatus(
        appointmentId: string,
        userId: string,
        status: AppointmentStatus,
        rejectionReason?: string
    ): Promise<Appointment> {
        // Fetch to verify ownership/broker role
        const { data: existing, error: fetchErr } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .single();

        if (fetchErr || !existing) throw new AppError('Lịch hẹn không tồn tại', 404);

        const apt = existing as Appointment;

        // Only broker can confirm/reject, only user can cancel
        if (status === 'confirmed' || status === 'rejected') {
            if (apt.broker_id !== userId) throw new AppError('Chỉ môi giới mới có thể thay đổi trạng thái này', 403);
        }
        if (status === 'cancelled') {
            if (apt.user_id !== userId && apt.broker_id !== userId) {
                throw new AppError('Bạn không có quyền hủy lịch hẹn này', 403);
            }
            if (!['pending', 'confirmed'].includes(apt.status)) {
                throw new AppError('Không thể hủy lịch ở trạng thái này', 400);
            }
        }

        const updatePayload: Record<string, any> = { status };
        if (status === 'rejected' && rejectionReason) {
            updatePayload.rejection_reason = rejectionReason;
        }

        const { data, error } = await supabase
            .from('appointments')
            .update(updatePayload)
            .eq('id', appointmentId)
            .select()
            .single();

        if (error) throw new AppError(error.message, 400);
        return data as Appointment;
    }

    /**
     * Xóa lịch hẹn (chỉ các trạng thái terminal: cancelled/rejected/completed)
     */
    async delete(appointmentId: string, userId: string): Promise<void> {
        const { data: existing } = await supabase
            .from('appointments')
            .select('user_id, broker_id, status')
            .eq('id', appointmentId)
            .single();

        if (!existing) throw new AppError('Lịch hẹn không tồn tại', 404);

        const apt = existing as { user_id: string; broker_id: string; status: string };
        if (apt.user_id !== userId && apt.broker_id !== userId) {
            throw new AppError('Bạn không có quyền xóa lịch hẹn này', 403);
        }
        if (!['cancelled', 'rejected', 'completed'].includes(apt.status)) {
            throw new AppError('Chỉ có thể xóa lịch đã hủy, từ chối hoặc hoàn thành', 400);
        }

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId);

        if (error) throw new AppError(error.message, 400);
    }
}

export default new AppointmentService();
