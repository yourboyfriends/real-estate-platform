import { supabase } from '../config/database';
import { BlogPost, BlogFilters, PaginationResponse } from '../types';
import { AppError } from '../utils/errorHandler';
import { PAGINATION } from '../config/constants';
import { promises } from 'node:dns';

export class BlogService {
  /**
   * Get all blog posts with filters
   */
  async getAllPosts(filters: BlogFilters) {
    const {
      category_id,
      tag,
      search,
      status = 'published',
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = 'created_at_desc'
    } = filters;

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        author:author_id (
          id,
          full_name,
          avatar_url
        ),
        category:categories (
          id,
          name,
          slug
        )
      `, { count: 'exact' })
      .eq('status', status);

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Sort
    const sortParts = sort.split('_');
    const sortOrder = sortParts[sortParts.length - 1]; // 'asc' or 'desc'
    const sortField = sortParts.slice(0, -1).join('_'); // rejoin everything except last part
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new AppError(error.message, 400);

    const pagination: PaginationResponse = {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    };

    return { posts: data as BlogPost[], pagination };
  }

  /**
   * Get blog post by slug
   */
  async getPostBySlug(slug: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:author_id (
          id,
          full_name,
          avatar_url,
          bio
        ),
        category:categories (
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw new AppError('Post not found', 404);

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    return data as BlogPost;
  }

  /**
   * Get latest posts
   */
  async getLatestPosts(limit: number = 5) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        view_count,
        author:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 400);

    return data as unknown as BlogPost[];
  }

  /**
   * Get trending posts (most viewed in last 7 days)
   */
  async getTrendingPosts(limit: number = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        view_count
      `)
      .eq('status', 'published')
      .gte('published_at', sevenDaysAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 400);

    return data as BlogPost[];
  }

  /**
   * Get related posts
   */
  async getRelatedPosts(postId: string, limit: number = 5) {
    // Get current post's category and tags
    const { data: currentPost } = await supabase
      .from('blog_posts')
      .select('category_id, tags')
      .eq('id', postId)
      .single();

    if (!currentPost) return [];

    // Find posts with same category or tags
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at
      `)
      .eq('status', 'published')
      .neq('id', postId);

    // Prioritize same category
    if (currentPost.category_id) {
      query = query.eq('category_id', currentPost.category_id);
    }

    query = query
      .order('view_count', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) return [];

    return data as BlogPost[];
  }

  /**
   * Create blog post (Admin only)
   */
  async createPost(postData: Partial<BlogPost>, authorId: string) {
    // Generate slug from title if not provided
    let slug = postData.slug;
    if (!slug && postData.title) {
      slug = postData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...postData,
        author_id: authorId,
        slug,
        published_at: postData.status === 'published' ? new Date().toISOString() : null
      })
      .select(`
        *,
        author:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw new AppError(error.message, 400);

    return data as BlogPost;
  }

  /**
   * Update blog post
   */
  async updatePost(id: string, updates: Partial<BlogPost>) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        author:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw new AppError(error.message, 400);

    return data as BlogPost;
  }

  /**
   * Delete blog post
   */
  async deletePost(id: string) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);

    return { message: 'Post deleted successfully' };
  }

  /**
   * Get posts by author
   */
  async getPostsByAuthor(authorId: string, status?: string) {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:categories (
          id,
          name,
          slug
        )
      `)
      .eq('author_id', authorId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 400);

    return data as BlogPost[];
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('tags')
      .eq('status', 'published');

    if (error) return [];

    // Flatten and count tags
    const tagCount: Record<string, number> = {};
    data.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    // Sort by count and return top tags
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }
}

export default new BlogService();