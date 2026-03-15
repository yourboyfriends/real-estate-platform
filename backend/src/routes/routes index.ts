import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import categoryRoutes from './category.routes';
import blogRoutes from './blog.routes';
import notificationRoutes from './notification.routes';
import messageRoutes from './message.routes';
import appointmentRoutes from './appointment.routes';
import adminRoutes from './admin.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/categories', categoryRoutes);
router.use('/blog', blogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;