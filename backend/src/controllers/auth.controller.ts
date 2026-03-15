import { Request, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import authService from '../services/auth.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse, User } from '../types';
import { supabase } from '../config/database';

// Service-role client for Storage 
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);


// Multer – memory storage 
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});


export class AuthController {
  // POST /api/auth/register
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, full_name, role } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and full_name are required'
      } as ApiResponse);
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      } as ApiResponse);
    }

    const user = await authService.register(email, password, full_name, role);

    res.status(201).json({
      success: true,
      data: user,
      message: 'Registration successful'
    } as ApiResponse<User>);
  });

  // POST /api/auth/login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      } as ApiResponse);
    }

    const user = await authService.login(email, password);

    res.json({
      success: true,
      data: user,
      message: 'Login successful',
    } as ApiResponse<User>);
  });

  // GET /api/auth/me
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required'
      } as ApiResponse);
    }

    const user = await authService.getUserById(userId);

    res.json({
      success: true,
      data: user
    } as ApiResponse<User>);
  });

  // PUT /api/auth/profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const user = await authService.updateProfile(userId, req.body);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    } as ApiResponse<User>);
  });
  // POST /api/auth/avatar
  uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' } as ApiResponse);
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' } as ApiResponse);
    }

    const ext = req.file.mimetype.split('/')[1] ?? 'jpg';
    const filePath = `${userId}/avatar.${ext}`;

    // Upload to Supabase Storage (using service-role client)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatar')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ success: false, message: uploadError.message } as ApiResponse);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from('avatar').getPublicUrl(filePath);
    const avatar_url = urlData.publicUrl;

    // Persist URL in users table
    const user = await authService.updateProfile(userId, { avatar_url });

    res.json({
      success: true,
      data: user,
      message: 'Avatar updated successfully',
    } as ApiResponse<User>);
  });
}

export default new AuthController();