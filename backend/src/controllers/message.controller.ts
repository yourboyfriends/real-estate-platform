import { Request, Response } from 'express';
import messageService from '../services/message.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse } from '../types';

export class MessageController {

    /**
     * GET /api/messages/conversations
     * Danh sách cuộc trò chuyện của user đang đăng nhập
     */
    getConversations = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID required',
            } as ApiResponse);
        }

        const conversations = await messageService.getConversations(userId);
        res.json({ success: true, data: conversations } as ApiResponse);
    });

    /**
     * GET /api/messages/unread-count
     * Số tin nhắn chưa đọc
     */
    getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        const count = await messageService.getUnreadCount(userId);
        res.json({ success: true, data: { count } } as ApiResponse);
    });

    /**
     * GET /api/messages/:partnerId
     * Lấy tất cả tin nhắn giữa user hiện tại và partnerId
     */
    getMessages = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        const { partnerId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        if (!partnerId) {
            return res.status(400).json({ success: false, message: 'partnerId is required' } as ApiResponse);
        }

        const messages = await messageService.getMessages(userId, partnerId);
        res.json({ success: true, data: messages } as ApiResponse);
    });

    /**
     * POST /api/messages
     * Gửi tin nhắn mới (text hoặc kèm image_url từ Cloudinary)
     */
    sendMessage = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        const { receiver_id, message, property_id, image_url } = req.body;

        if (!receiver_id) {
            return res.status(400).json({ success: false, message: 'receiver_id is required' } as ApiResponse);
        }

        if (!message && !image_url) {
            return res.status(400).json({ success: false, message: 'message or image_url is required' } as ApiResponse);
        }

        const newMessage = await messageService.sendMessage({
            sender_id: userId,
            receiver_id,
            message: message ?? '',
            property_id: property_id ?? null,
            image_url: image_url ?? null,
        });

        res.status(201).json({
            success: true,
            data: newMessage,
            message: 'Message sent',
        } as ApiResponse);
    });

    /**
     * POST /api/messages/upload-image
     * Upload ảnh lên Cloudinary, trả về URL để frontend dùng khi gửi tin nhắn
     */
    uploadImage = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        const file = req.file as any;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No image file provided' } as ApiResponse);
        }

        // Cloudinary URL is available at file.path (set by multer-storage-cloudinary)
        const imageUrl: string = file.path;

        res.json({
            success: true,
            data: { url: imageUrl },
            message: 'Image uploaded successfully',
        } as ApiResponse);
    });
}

export default new MessageController();
