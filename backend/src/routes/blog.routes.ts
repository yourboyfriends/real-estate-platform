import { Router } from 'express';
import blogController from '../controllers/blog.controller';

const router = Router();

/**
 * @route   GET /api/blog/posts
 * @desc    Get all blog posts with filters
 * @access  Public
 */
router.get('/posts', blogController.getAllPosts);

/**
 * @route   GET /api/blog/posts/latest
 * @desc    Get latest posts
 * @access  Public
 */
router.get('/posts/latest', blogController.getLatestPosts);

/**
 * @route   GET /api/blog/posts/trending
 * @desc    Get trending posts
 * @access  Public
 */
router.get('/posts/trending', blogController.getTrendingPosts);

/**
 * @route   GET /api/blog/tags
 * @desc    Get popular tags
 * @access  Public
 */
router.get('/tags', blogController.getPopularTags);

/**
 * @route   GET /api/blog/posts/:slug
 * @desc    Get post by slug
 * @access  Public
 */
router.get('/posts/:slug', blogController.getPostBySlug);

/**
 * @route   GET /api/blog/posts/:id/related
 * @desc    Get related posts
 * @access  Public
 */
router.get('/posts/:id/related', blogController.getRelatedPosts);

/**
 * @route   GET /api/blog/author/:authorId
 * @desc    Get posts by author
 * @access  Public
 */
router.get('/author/:authorId', blogController.getPostsByAuthor);

/**
 * @route   POST /api/blog/posts
 * @desc    Create new blog post
 * @access  Private (Admin only)
 */
router.post('/posts', blogController.createPost);

/**
 * @route   PUT /api/blog/posts/:id
 * @desc    Update blog post
 * @access  Private (Admin only)
 */
router.put('/posts/:id', blogController.updatePost);

/**
 * @route   DELETE /api/blog/posts/:id
 * @desc    Delete blog post
 * @access  Private (Admin only)
 */
router.delete('/posts/:id', blogController.deletePost);

export default router;