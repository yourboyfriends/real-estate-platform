import { Router } from 'express';
import authController, { avatarUpload } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);

/**
 * @route   POST /api/auth/avatar
 * @desc    Upload avatar to Supabase Storage
 * @access  Private
 */
router.post('/avatar', avatarUpload.single('avatar'), authController.uploadAvatar);

export default router;