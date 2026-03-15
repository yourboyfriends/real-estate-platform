import { supabase } from '../config/database';
import { AppError } from '../utils/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

export class MessageService {

    /**
     * Lấy danh sách cuộc trò chuyện của user
     * Nhóm các tin nhắn theo partner, trả về last_message & unread_count
     */
    async getConversations(userId: string): Promise<Conversation[]> {
        // Lấy tất cả tin nhắn liên quan đến user, mới nhất trước
        const { data: allMessages, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw new AppError(error.message, 400);
        if (!allMessages || allMessages.length === 0) return [];

        // Nhóm theo partner, giữ tin nhắn đầu tiên (mới nhất) của mỗi pair
        const convMap = new Map<string, {
            partnerId: string;
            lastMessage: string;
            lastMessageAt: string;
            unreadCount: number;
            propertyId: string | null;
        }>();

        for (const msg of allMessages) {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            if (!convMap.has(partnerId)) {
                convMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg.image_url && !msg.message ? '📷 Hình ảnh' : msg.message,
                    lastMessageAt: msg.created_at,
                    unreadCount: 0,
                    propertyId: msg.property_id ?? null,
                });
            }
            // Đếm tin chưa đọc gửi cho mình
            if (msg.receiver_id === userId && !msg.is_read) {
                const conv = convMap.get(partnerId)!;
                conv.unreadCount++;
            }
        }

        const partnerIds = Array.from(convMap.keys());
        if (partnerIds.length === 0) return [];

        // Lấy thông tin profile của partner
        const { data: profiles } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .in('id', partnerIds);

        // Lấy tên + ảnh đại diện của BĐS liên quan
        const propertyIds = Array.from(convMap.values())
            .map(c => c.propertyId)
            .filter(Boolean) as string[];

        const propertiesMap = new Map<string, { title: string; image: string | null }>();
        if (propertyIds.length > 0) {
            const { data: properties } = await supabase
                .from('properties')
                .select('id, title')
                .in('id', propertyIds);

            // Lấy ảnh đầu tiên (primary) của mỗi BĐS
            const { data: propImages } = await supabase
                .from('property_images')
                .select('property_id, url')
                .in('property_id', propertyIds)
                .eq('is_primary', true);

            const imageMap = new Map<string, string>();
            propImages?.forEach(img => imageMap.set(img.property_id, img.url));

            properties?.forEach(p => propertiesMap.set(p.id, {
                title: p.title,
                image: imageMap.get(p.id) ?? null,
            }));
        }

        const convList: Conversation[] = partnerIds.map(pid => {
            const conv = convMap.get(pid)!;
            const profile = profiles?.find(p => p.id === pid);
            const propInfo = conv.propertyId ? propertiesMap.get(conv.propertyId) : null;

            return {
                partner_id: pid,
                full_name: profile?.full_name ?? 'Người dùng',
                avatar_url: profile?.avatar_url ?? null,
                last_message: conv.lastMessage,
                last_message_at: conv.lastMessageAt,
                unread_count: conv.unreadCount,
                property_id: conv.propertyId,
                property_title: propInfo?.title ?? null,
                property_image: propInfo?.image ?? null,
            };
        });

        // Sắp xếp theo tin nhắn mới nhất
        return convList.sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
    }

    /**
     * Lấy tin nhắn giữa 2 người, đồng thời đánh dấu đã đọc
     */
    async getMessages(userId: string, partnerId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
            )
            .order('created_at', { ascending: true });

        if (error) throw new AppError(error.message, 400);

        // Đánh dấu đã đọc các tin nhắn của partner gửi cho mình
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', partnerId)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        return (data ?? []) as Message[];
    }

    /**
     * Gửi tin nhắn mới
     */
    async sendMessage(params: {
        sender_id: string;
        receiver_id: string;
        message: string;
        property_id?: string | null;
        image_url?: string | null;
    }): Promise<Message> {
        const { sender_id, receiver_id, message, property_id, image_url } = params;

        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id,
                receiver_id,
                message: message.trim(),
                property_id: property_id ?? null,
                image_url: image_url ?? null,
                is_read: false,
            })
            .select()
            .single();

        if (error) throw new AppError(error.message, 400);
        return data as Message;
    }

    /**
     * Số tin nhắn chưa đọc của user
     */
    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) return 0;
        return count ?? 0;
    }
}

export default new MessageService();
