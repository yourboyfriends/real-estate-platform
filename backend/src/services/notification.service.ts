import { supabase } from '../config/database';
import { AppError } from '../utils/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
    | 'property_approved'
    | 'property_rejected'
    | 'property_expiring'
    | 'new_contact'
    | 'system';

/** Shape stored in the `data` JSONB column */
interface NotificationData {
    property_id?: string;
    property_title?: string;
    rejection_reason?: string;
    [key: string]: unknown;
}

/** Raw row from the notifications table */
interface NotificationRow {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: NotificationData;
    is_read: boolean;
    created_at: string;
}

/** Flattened shape exposed to the API / frontend */
export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    property_id?: string;
    property_title?: string;
    rejection_reason?: string;
    is_read: boolean;
    created_at: string;
}

/** Flatten JSONB data fields onto root level so frontend contract stays the same */
const mapRow = (row: NotificationRow): Notification => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    is_read: row.is_read,
    created_at: row.created_at,
    ...(row.data ?? {}),
});

// ─── Service ──────────────────────────────────────────────────────────────────

export class NotificationService {
    /**
     * Tạo một thông báo mới cho user
     * Schema thực tế lưu metadata trong cột `data JSONB`
     */
    async create(params: {
        user_id: string;
        type: NotificationType;
        title: string;
        message: string;
        property_id?: string;
        property_title?: string;
        rejection_reason?: string;
    }): Promise<Notification> {
        const { user_id, type, title, message, ...meta } = params;

        // Build data JSONB — chỉ giữ các key có giá trị
        const data: NotificationData = {};
        if (meta.property_id) data.property_id = meta.property_id;
        if (meta.property_title) data.property_title = meta.property_title;
        if (meta.rejection_reason) data.rejection_reason = meta.rejection_reason;

        const { data: row, error } = await supabase
            .from('notifications')
            .insert({ user_id, type, title, message, data, is_read: false })
            .select()
            .single();

        if (error) {
            // Không throw — tránh làm gián đoạn flow approve/reject
            console.error('[NotificationService] Failed to create notification:', error.message);
            return null as any;
        }

        return mapRow(row as NotificationRow);
    }

    /** Thông báo duyệt tin */
    async notifyPropertyApproved(propertyId: string, propertyTitle: string, brokerId: string) {
        return this.create({
            user_id: brokerId,
            type: 'property_approved',
            title: 'Tin đăng đã được duyệt',
            message: `Tin đăng "${propertyTitle}" đã được phê duyệt và đang hiển thị trên hệ thống.`,
            property_id: propertyId,
            property_title: propertyTitle,
        });
    }

    /** Thông báo từ chối tin (kèm lý do) */
    async notifyPropertyRejected(
        propertyId: string,
        propertyTitle: string,
        brokerId: string,
        reason?: string
    ) {
        return this.create({
            user_id: brokerId,
            type: 'property_rejected',
            title: 'Tin đăng bị từ chối',
            message: `Tin đăng "${propertyTitle}" đã bị từ chối.${reason ? ' Vui lòng xem lý do chi tiết.' : ''}`,
            property_id: propertyId,
            property_title: propertyTitle,
            rejection_reason: reason,
        });
    }

    /** Danh sách thông báo của user */
    async getByUserId(userId: string): Promise<{ notifications: Notification[]; unread_count: number }> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw new AppError(error.message, 400);

        const notifications = (data || []).map((r) => mapRow(r as NotificationRow));
        const unread_count = notifications.filter((n) => !n.is_read).length;

        return { notifications, unread_count };
    }

    /** Số thông báo chưa đọc */
    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) return 0;
        return count || 0;
    }

    /** Đánh dấu một thông báo đã đọc */
    async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw new AppError('Notification not found', 404);
        return mapRow(data as NotificationRow);
    }

    /** Đánh dấu tất cả thông báo của user đã đọc */
    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw new AppError(error.message, 400);
    }

    /** Xóa một thông báo */
    async delete(notificationId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw new AppError('Notification not found', 404);
    }
}

export default new NotificationService();
