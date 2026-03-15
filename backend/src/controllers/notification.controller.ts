import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse } from '../types';

export class NotificationController {
    /**
     * GET /api/notifications
     * Lấy danh sách thông báo của user đang đăng nhập
     */
    getNotifications = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }
        const result = await notificationService.getByUserId(userId);
        res.json({ success: true, data: result } as ApiResponse);
    });

    /**
     * GET /api/notifications/unread-count
     * Lấy số thông báo chưa đọc
     */
    getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }
        const count = await notificationService.getUnreadCount(userId);
        res.json({ success: true, data: { count } } as ApiResponse);
    });

    /**
     * PUT /api/notifications/:id/read
     * Đánh dấu một thông báo đã đọc
     */
    markAsRead = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }
        const notification = await notificationService.markAsRead(id, userId);
        res.json({ success: true, data: notification } as ApiResponse);
    });

    /**
     * PUT /api/notifications/read-all
     * Đánh dấu tất cả thông báo đã đọc
     */
    markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }
        await notificationService.markAllAsRead(userId);
        res.json({ success: true, message: 'All notifications marked as read' } as ApiResponse);
    });

    /**
     * DELETE /api/notifications/:id
     * Xóa một thông báo
     */
    deleteNotification = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }
        await notificationService.delete(id, userId);
        res.json({ success: true, message: 'Notification deleted' } as ApiResponse);
    });
}

export default new NotificationController();
