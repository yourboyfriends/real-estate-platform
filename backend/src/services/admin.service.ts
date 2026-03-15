import { supabase } from '../config/database';
import { AppError } from '../utils/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  new_users_this_month: number;
  total_properties: number;
  active_properties: number;
  pending_properties: number;
  rejected_properties: number;
  top_properties: Array<{
    id: string;
    title: string;
    view_count: number;
    city: string;
    user_id: string;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  property_count?: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AdminService {

  // ── Dashboard stats ─────────────────────────────────────────────────────────

  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [usersRes, newUsersRes, propsRes, topPropsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('properties').select('status'),
      supabase
        .from('properties')
        .select('id, title, view_count, city, user_id, status')
        .eq('status', 'active')
        .order('view_count', { ascending: false })
        .limit(5),
    ]);

    const allStatuses = propsRes.data ?? [];
    const countByStatus = (s: string) => allStatuses.filter((p: any) => p.status === s).length;

    return {
      total_users: usersRes.count ?? 0,
      new_users_this_month: newUsersRes.count ?? 0,
      total_properties: allStatuses.length,
      active_properties: countByStatus('active'),
      pending_properties: countByStatus('pending'),
      rejected_properties: countByStatus('rejected'),
      top_properties: (topPropsRes.data ?? []) as AdminStats['top_properties'],
    };
  }

  // ── User management ──────────────────────────────────────────────────────────

  async getUsers(search?: string, page = 1, limit = 20): Promise<{ users: AdminUser[]; total: number }> {
    let query = supabase
      .from('users')
      .select('id, email, full_name, role, phone, avatar_url, is_active, is_verified, created_at', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new AppError(error.message, 400);

    // Enrich with property count
    const usersWithCount = await Promise.all(
      (data ?? []).map(async (u: any) => {
        const { count: propCount } = await supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.id);
        return { ...u, property_count: propCount ?? 0 } as AdminUser;
      })
    );

    return { users: usersWithCount, total: count ?? 0 };
  }

  async updateUser(id: string, data: { is_active?: boolean; role?: string }): Promise<AdminUser> {
    const { data: updated, error } = await supabase
      .from('users')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return updated as AdminUser;
  }

  // ── Property management ──────────────────────────────────────────────────────

  async getAllProperties(
    status?: string,
    search?: string,
    page = 1,
    limit = 20
  ): Promise<{ properties: any[]; total: number }> {
    let query = supabase
      .from('properties')
      .select(
        'id, title, status, price, city, district, area, listing_type, view_count, created_at, user_id, is_featured',
        { count: 'exact' }
      );

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new AppError(error.message, 400);

    // Enrich with broker name + primary image
    const enriched = await Promise.all(
      (data ?? []).map(async (p: any) => {
        const { data: user } = await supabase
          .from('users')
          .select('full_name, email, phone')
          .eq('id', p.user_id)
          .single();

        const { data: img } = await supabase
          .from('property_images')
          .select('url')
          .eq('property_id', p.id)
          .eq('is_primary', true)
          .single();

        return { ...p, broker: user ?? null, primary_image: img?.url ?? null };
      })
    );

    return { properties: enriched, total: count ?? 0 };
  }

  async adminDeleteProperty(id: string): Promise<void> {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw new AppError(error.message, 400);
  }

  // ── Category management ──────────────────────────────────────────────────────

  async getCategories(): Promise<AdminCategory[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index');
    if (error) throw new AppError(error.message, 400);
    return (data ?? []) as AdminCategory[];
  }

  async createCategory(body: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
  }): Promise<AdminCategory> {
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', body.slug).single();
    if (existing) throw new AppError('Slug đã tồn tại', 400);

    const { data: maxOrder } = await supabase.from('categories').select('order_index').order('order_index', { ascending: false }).limit(1).single();
    const nextOrder = ((maxOrder as any)?.order_index ?? 0) + 1;

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...body, order_index: nextOrder })
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return data as AdminCategory;
  }

  async updateCategory(id: string, body: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    is_active: boolean;
  }>): Promise<AdminCategory> {
    const { data, error } = await supabase
      .from('categories')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return data as AdminCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if any properties use this category
    const { count } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    if (count && count > 0) {
      throw new AppError(`Danh mục đang dùng bởi ${count} tin đăng, không thể xóa`, 400);
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new AppError(error.message, 400);
  }
}

export default new AdminService();
