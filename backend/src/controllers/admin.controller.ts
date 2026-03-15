import { Request, Response } from 'express';
import adminService from '../services/admin.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse } from '../types';

export class AdminController {

  // ── Stats ────────────────────────────────────────────────────────────────────

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats } as ApiResponse);
  });

  // ── Users ────────────────────────────────────────────────────────────────────

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await adminService.getUsers(search, parseInt(page), parseInt(limit));
    res.json({ success: true, data: result } as ApiResponse);
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_active, role } = req.body;

    if (is_active === undefined && !role) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cập nhật' } as ApiResponse);
    }

    const validRoles = ['admin', 'broker', 'customer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' } as ApiResponse);
    }

    const updated = await adminService.updateUser(id, {
      ...(is_active !== undefined ? { is_active } : {}),
      ...(role ? { role } : {}),
    });
    res.json({ success: true, data: updated, message: 'Đã cập nhật người dùng' } as ApiResponse);
  });

  // ── Properties ───────────────────────────────────────────────────────────────

  getAllProperties = asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await adminService.getAllProperties(status, search, parseInt(page), parseInt(limit));
    res.json({ success: true, data: result } as ApiResponse);
  });

  deleteProperty = asyncHandler(async (req: Request, res: Response) => {
    await adminService.adminDeleteProperty(req.params.id);
    res.json({ success: true, message: 'Đã xóa tin đăng' } as ApiResponse);
  });

  // ── Categories ───────────────────────────────────────────────────────────────

  getCategories = asyncHandler(async (_req: Request, res: Response) => {
    const cats = await adminService.getCategories();
    res.json({ success: true, data: cats } as ApiResponse);
  });

  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, slug, description, icon } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Tên và slug là bắt buộc' } as ApiResponse);
    }
    const cat = await adminService.createCategory({ name, slug, description, icon });
    res.status(201).json({ success: true, data: cat, message: 'Đã tạo danh mục' } as ApiResponse);
  });

  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const cat = await adminService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: cat, message: 'Đã cập nhật danh mục' } as ApiResponse);
  });

  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Đã xóa danh mục' } as ApiResponse);
  });
}

export default new AdminController();
