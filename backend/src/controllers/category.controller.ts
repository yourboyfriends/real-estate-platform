import { Request, Response } from 'express';
import categoryService from '../services/category.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse, Category } from '../types';

export class CategoryController {
  /**
   * GET /api/categories
   * Get all categories
   */
  getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const withCount = req.query.withCount === 'true';

    const categories = withCount
      ? await categoryService.getCategoriesWithCount()
      : await categoryService.getAllCategories();

    res.json({
      success: true,
      data: categories
    } as ApiResponse<Category[]>);
  });

  /**
   * GET /api/categories/:slug
   * Get category by slug
   */
  getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    res.json({
      success: true,
      data: category
    } as ApiResponse<Category>);
  });

  /**
   * POST /api/categories
   * Create new category (Admin only)
   */
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      } as ApiResponse);
    }

    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    } as ApiResponse<Category>);
  });

  /**
   * PUT /api/categories/:id
   * Update category (Admin only)
   */
  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    } as ApiResponse<Category>);
  });

  /**
   * DELETE /api/categories/:id
   * Delete category (Admin only)
   */
  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: result.message
    } as ApiResponse);
  });
}

export default new CategoryController();