import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import categoryRoutes from './category.routes';
import blogRoutes from './blog.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/categories', categoryRoutes);
router.use('/blog', blogRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;