import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse, User } from '../types';

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
}

export default new AuthController();