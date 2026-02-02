import { Router } from 'express';
import categoryController from '../controllers/category.controller';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 * @query   withCount=true (optional) - Include property count
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/:slug', categoryController.getCategoryBySlug);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Admin only)
 */
router.post('/', categoryController.createCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id', categoryController.deleteCategory);

export default router;