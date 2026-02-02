import { Request, Response } from 'express';
import blogService from '../services/blog.service';
import { asyncHandler } from '../utils/errorHandler';
import { ApiResponse, BlogPost, BlogFilters } from '../types';

export class BlogController {
  /**
   * GET /api/blog/posts
   * Get all blog posts with filters
   */
  getAllPosts = asyncHandler(async (req: Request, res: Response) => {
    const filters: BlogFilters = {
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      sort: req.query.sort as string,
      category_id: req.query.category_id as string,
      tag: req.query.tag as string,
      status: req.query.status as any,
      search: req.query.search as string
    };

    const result = await blogService.getAllPosts(filters);

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination
    } as ApiResponse);
  });

  /**
   * GET /api/blog/posts/latest
   * Get latest posts
   */
  getLatestPosts = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const posts = await blogService.getLatestPosts(limit);

    res.json({
      success: true,
      data: posts
    } as ApiResponse<BlogPost[]>);
  });

  /**
   * GET /api/blog/posts/trending
   * Get trending posts
   */
  getTrendingPosts = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await blogService.getTrendingPosts(limit);

    res.json({
      success: true,
      data: posts
    } as ApiResponse<BlogPost[]>);
  });

  /**
   * GET /api/blog/posts/:slug
   * Get post by slug
   */
  getPostBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const post = await blogService.getPostBySlug(slug);

    res.json({
      success: true,
      data: post
    } as ApiResponse<BlogPost>);
  });

  /**
   * GET /api/blog/posts/:id/related
   * Get related posts
   */
  getRelatedPosts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const posts = await blogService.getRelatedPosts(id, limit);

    res.json({
      success: true,
      data: posts
    } as ApiResponse<BlogPost[]>);
  });

  /**
   * POST /api/blog/posts
   * Create new blog post (Admin only)
   */
  createPost = asyncHandler(async (req: Request, res: Response) => {
    const authorId = req.headers['user-id'] as string;

    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required'
      } as ApiResponse);
    }

    // Validate required fields
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      } as ApiResponse);
    }

    const post = await blogService.createPost(req.body, authorId);

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    } as ApiResponse<BlogPost>);
  });

  /**
   * PUT /api/blog/posts/:id
   * Update blog post
   */
  updatePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const post = await blogService.updatePost(id, req.body);

    res.json({
      success: true,
      data: post,
      message: 'Post updated successfully'
    } as ApiResponse<BlogPost>);
  });

  /**
   * DELETE /api/blog/posts/:id
   * Delete blog post
   */
  deletePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
    }

    const result = await blogService.deletePost(id);

    res.json({
      success: true,
      message: result.message
    } as ApiResponse);
  });

  /**
   * GET /api/blog/author/:authorId
   * Get posts by author
   */
  getPostsByAuthor = asyncHandler(async (req: Request, res: Response) => {
    const { authorId } = req.params;
    const status = req.query.status as string;

    const posts = await blogService.getPostsByAuthor(authorId, status);

    res.json({
      success: true,
      data: posts
    } as ApiResponse<BlogPost[]>);
  });

  /**
   * GET /api/blog/tags
   * Get popular tags
   */
  getPopularTags = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const tags = await blogService.getPopularTags(limit);

    res.json({
      success: true,
      data: tags
    } as ApiResponse);
  });
}

export default new BlogController();