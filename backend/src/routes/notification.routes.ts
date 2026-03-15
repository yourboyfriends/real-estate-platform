import { Router } from 'express';
import notificationController from '../controllers/notification.controller';

const router = Router();

// Tất cả routes đều cần đăng nhập — middleware lọc user-id header

/** GET /api/notifications — Lấy danh sách thông báo */
router.get('/', notificationController.getNotifications);

/** GET /api/notifications/unread-count — Số thông báo chưa đọc */
router.get('/unread-count', notificationController.getUnreadCount);

/** PUT /api/notifications/read-all — Đánh dấu tất cả đã đọc */
router.put('/read-all', notificationController.markAllAsRead);

/** PUT /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc */
router.put('/:id/read', notificationController.markAsRead);

/** DELETE /api/notifications/:id — Xóa thông báo */
router.delete('/:id', notificationController.deleteNotification);

export default router;
