import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { requireAdmin } from '../middlewares/admin.middleware';
import propertyController from '../controllers/property.controller';

const router = Router();

// All routes require admin
router.use(requireAdmin);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);

// ── Users ────────────────────────────────────────────────────────────────────
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);

// ── Properties ───────────────────────────────────────────────────────────────
router.get('/properties', adminController.getAllProperties);
router.delete('/properties/:id', adminController.deleteProperty);

// Reuse existing approve/reject from property controller
router.put('/properties/:id/approve', propertyController.approveProperty);
router.put('/properties/:id/reject', propertyController.rejectProperty);

// ── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

export default router;
