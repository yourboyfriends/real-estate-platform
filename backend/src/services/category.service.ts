import { supabase } from '../config/database';
import { Category } from '../types';
import { AppError } from '../utils/errorHandler';

export class CategoryService {
  /**
   * Get all categories
   */
  async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw new AppError(error.message, 400);

    return data as Category[];
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw new AppError('Category not found', 404);

    return data as Category;
  }

  /**
   * Create category (Admin only)
   */
  async createCategory(categoryData: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    return data as Category;
  }

  /**
   * Update category (Admin only)
   */
  async updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    return data as Category;
  }

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);

    return { message: 'Category deleted successfully' };
  }

  /**
   * Get category with property count
   */
  async getCategoriesWithCount() {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (catError) throw new AppError(catError.message, 400);

    // Get property count for each category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('status', 'active');

        return {
          ...cat,
          property_count: count || 0
        };
      })
    );

    return categoriesWithCount;
  }
}

export default new CategoryService();