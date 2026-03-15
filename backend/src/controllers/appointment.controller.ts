import { Request, Response } from 'express';
import appointmentService, { AppointmentStatus } from '../services/appointment.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse } from '../types';

export class AppointmentController {

    /**
     * GET /api/appointments
     * Lấy tất cả lịch hẹn của user (cả vai trò khách và broker)
     */
    getAppointments = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        const appointments = await appointmentService.getByUser(userId);
        res.json({ success: true, data: appointments } as ApiResponse);
    });

    /**
     * POST /api/appointments
     * Đặt lịch hẹn mới
     */
    createAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        const { property_id, broker_id, appointment_date, appointment_time, full_name, phone, email, message } = req.body;

        if (!property_id || !broker_id || !appointment_date || !appointment_time || !full_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: property_id, broker_id, appointment_date, appointment_time, full_name, phone',
            } as ApiResponse);
        }

        const appointment = await appointmentService.create(userId, {
            property_id,
            broker_id,
            appointment_date,
            appointment_time,
            full_name,
            phone,
            email,
            message,
        });

        res.status(201).json({
            success: true,
            data: appointment,
            message: 'Đặt lịch hẹn thành công! Đang chờ xác nhận từ môi giới.',
        } as ApiResponse);
    });

    /**
     * PUT /api/appointments/:id/status
     * Cập nhật trạng thái: confirmed | rejected | cancelled | completed
     */
    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        const { id } = req.params;
        const { status, rejection_reason } = req.body;

        const validStatuses: AppointmentStatus[] = ['confirmed', 'rejected', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Phải là: ${validStatuses.join(', ')}`,
            } as ApiResponse);
        }

        if (status === 'rejected' && !rejection_reason?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do từ chối',
            } as ApiResponse);
        }

        const updated = await appointmentService.updateStatus(id, userId, status, rejection_reason);

        const messages: Record<string, string> = {
            confirmed: 'Đã xác nhận lịch hẹn',
            rejected: 'Đã từ chối lịch hẹn',
            cancelled: 'Đã hủy lịch hẹn',
            completed: 'Đã đánh dấu hoàn thành',
        };

        res.json({ success: true, data: updated, message: messages[status] } as ApiResponse);
    });

    /**
     * DELETE /api/appointments/:id
     * Xóa lịch hẹn (chỉ trạng thái terminal)
     */
    deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.headers['user-id'] as string;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
        }

        await appointmentService.delete(req.params.id, userId);
        res.json({ success: true, message: 'Đã xóa lịch hẹn' } as ApiResponse);
    });
}

export default new AppointmentController();
