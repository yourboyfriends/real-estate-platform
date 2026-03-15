import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';

const router = Router();

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments for the current user (as customer or broker)
 * @access  Private
 */
router.get('/', appointmentController.getAppointments);

/**
 * @route   POST /api/appointments
 * @desc    Book a new appointment
 * @access  Private
 */
router.post('/', appointmentController.createAppointment);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status (confirm/reject/cancel/complete)
 * @access  Private
 */
router.put('/:id/status', appointmentController.updateStatus);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete a terminal appointment (cancelled/rejected/completed)
 * @access  Private
 */
router.delete('/:id', appointmentController.deleteAppointment);

export default router;
