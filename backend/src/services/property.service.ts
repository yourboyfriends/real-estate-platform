import { supabase } from '../config/database';
import { Property, PropertyFilters, PaginationResponse } from '../types';
import { AppError } from '../utils/errorHandler';
import { PAGINATION } from '../config/constants';
import notificationService from './notification.service';


export class PropertyService {
  /**
   * Get all properties with filters and pagination
   */
  async getProperties(filters: PropertyFilters) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = 'created_at_desc',
      listing_type,
      property_type,
      city,
      district,
      min_price,
      max_price,
      min_area,
      max_area,
      bedrooms,
      bathrooms,
      search
    } = filters;

    let query = supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone, email, avatar_url, company_name),
        images:property_images(id, url, thumbnail_url, is_primary, order_index),
        category:categories(id, name, slug, icon)
      `, { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (listing_type) {
      query = query.eq('listing_type', listing_type);
    }

    if (property_type) {
      query = query.eq('property_type', property_type);
    }

    if (city) {
      query = query.eq('city', city);
    }

    if (district) {
      query = query.eq('district', district);
    }

    if (min_price) {
      query = query.gte('price', min_price);
    }

    if (max_price) {
      query = query.lte('price', max_price);
    }

    if (min_area) {
      query = query.gte('area', min_area);
    }

    if (max_area) {
      query = query.lte('area', max_area);
    }

    if (bedrooms) {
      query = query.eq('bedrooms', bedrooms);
    }

    if (bathrooms) {
      query = query.eq('bathrooms', bathrooms);
    }

    // Search in title, description, address
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
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

    return { properties: data as Property[], pagination };
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string, incrementView: boolean = false) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone, email, avatar_url, company_name, bio),
        images:property_images(id, url, thumbnail_url, is_primary, order_index),
        category:categories(id, name, slug, icon)
      `)
      .eq('id', id)
      .single();

    if (error) throw new AppError('Property not found', 404);

    // Increment view count if needed
    if (incrementView) {
      await supabase
        .from('properties')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
    }

    return data as Property;
  }

  /**
   * Get property by code
   */
  async getPropertyByCode(code: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone, email, avatar_url, company_name),
        images:property_images(*),
        category:categories(*)
      `)
      .eq('property_code', code)
      .single();

    if (error) throw new AppError('Property not found', 404);

    return data as Property;
  }

  /**
   * Create new property
   */
  async createProperty(userId: string, propertyData: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: userId,
        status: 'pending', // Admin will approve
        ...propertyData
      })
      .select(`
        *,
        user:user_id(id, full_name, phone, email),
        category:categories(id, name, slug)
      `)
      .single();

    if (error) throw new AppError(error.message, 400);

    return data as Property;
  }

  /**
   * Update property
   */
  async updateProperty(id: string, userId: string, updates: Partial<Property>) {
    // Check ownership
    const { data: property } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    if (property.user_id !== userId) {
      throw new AppError('Unauthorized to update this property', 403);
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:user_id(id, full_name, phone, email),
        images:property_images(*),
        category:categories(*)
      `)
      .single();

    if (error) throw new AppError(error.message, 400);

    return data as Property;
  }

  /**
   * Delete property
   */
  async deleteProperty(id: string, userId: string) {
    // Check ownership
    const { data: property } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    if (property.user_id !== userId) {
      throw new AppError('Unauthorized to delete this property', 403);
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);

    return { message: 'Property deleted successfully' };
  }

  /**
   * Get properties by user
   */
  async getPropertiesByUser(userId: string, filters: PropertyFilters, includeAll: boolean = false) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = 'created_at_desc'
    } = filters;

    let query = supabase
      .from('properties')
      .select(`
        *,
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug)
      `, { count: 'exact' })
      .eq('user_id', userId);

    // If not includeAll, only show active properties
    if (!includeAll) {
      query = query.eq('status', 'active');
    }

    // Sort
    const sortParts = sort.split('_');
    const sortOrder = sortParts[sortParts.length - 1];
    const sortField = sortParts.slice(0, -1).join('_');
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

    return { properties: data as Property[], pagination };
  }

  /**
   * Get pending properties (Admin only)
   */
  async getPendingProperties(filters: PropertyFilters) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = 'created_at_desc'
    } = filters;

    let query = supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone, email, company_name),
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug)
      `, { count: 'exact' })
      .eq('status', 'pending');

    // Sort
    const sortParts = sort.split('_');
    const sortOrder = sortParts[sortParts.length - 1];
    const sortField = sortParts.slice(0, -1).join('_');
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

    return { properties: data as Property[], pagination };
  }

  /**
   * Approve property (Admin only)
   */
  async approveProperty(id: string, adminId: string) {
    // Check if property exists and is pending
    const { data: property } = await supabase
      .from('properties')
      .select('status, user_id, title')
      .eq('id', id)
      .single();

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    if (property.status !== 'pending') {
      throw new AppError('Only pending properties can be approved', 400);
    }

    // Update property status to active
    const { data, error } = await supabase
      .from('properties')
      .update({
        status: 'active',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:user_id(id, full_name, phone, email),
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug)
      `)
      .single();

    if (error) throw new AppError(error.message, 400);

    // Gửi thông báo cho broker (fire-and-forget)
    notificationService.notifyPropertyApproved(id, property.title, property.user_id);

    return data as Property;
  }


  /**
   * Reject property (Admin only)
   */
  async rejectProperty(id: string, adminId: string, reason?: string) {
    // Check if property exists, is pending, and get broker info
    const { data: property } = await supabase
      .from('properties')
      .select('status, user_id, title')
      .eq('id', id)
      .single();

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    if (property.status !== 'pending') {
      throw new AppError('Only pending properties can be rejected', 400);
    }

    // Update property status to rejected
    const updateData: any = { status: 'rejected' };
    if (reason) {
      updateData.rejection_reason = reason;
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:user_id(id, full_name, phone, email),
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug)
      `)
      .single();

    if (error) throw new AppError(error.message, 400);

    // Gửi thông báo từ chối cho broker (fire-and-forget, kèm lý do)
    notificationService.notifyPropertyRejected(id, property.title, property.user_id, reason);

    return data as Property;
  }


  /**
   * Get featured properties
   */
  async getFeaturedProperties(limit: number = 6) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone, company_name),
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug, icon)
      `)
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 400);

    return data as Property[];
  }

  /**
   * Get related properties
   */
  async getRelatedProperties(propertyId: string, limit: number = 4) {
    // Get current property to find similar ones
    const { data: currentProperty } = await supabase
      .from('properties')
      .select('property_type, city, district, category_id')
      .eq('id', propertyId)
      .single();

    if (!currentProperty) return [];

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone),
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug)
      `)
      .eq('status', 'active')
      .neq('id', propertyId)
      .or(`property_type.eq.${currentProperty.property_type},city.eq.${currentProperty.city}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];

    return data as Property[];
  }

  /**
   * Add property images
   */
  async addPropertyImages(propertyId: string, images: Array<{ url: string; is_primary?: boolean }>) {
    const imageData = images.map((img, index) => ({
      property_id: propertyId,
      url: img.url,
      is_primary: img.is_primary || false,
      order_index: index
    }));

    const { data, error } = await supabase
      .from('property_images')
      .insert(imageData)
      .select();

    if (error) throw new AppError(error.message, 400);

    return data;
  }

  /**
   * Delete property image
   */
  async deletePropertyImage(imageId: string) {
    const { error } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);

    if (error) throw new AppError(error.message, 400);

    return { message: 'Image deleted successfully' };
  }

  /**
   * Get property statistics for dashboard
   */
  async getPropertyStats(userId?: string) {
    let query = supabase
      .from('properties')
      .select('status, listing_type');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 400);

    const stats = {
      total: data.length,
      active: data.filter(p => p.status === 'active').length,
      pending: data.filter(p => p.status === 'pending').length,
      sold: data.filter(p => p.status === 'sold').length,
      rented: data.filter(p => p.status === 'rented').length,
      for_sale: data.filter(p => p.listing_type === 'sale').length,
      for_rent: data.filter(p => p.listing_type === 'rent').length
    };

    return stats;
  }

  /**
   * Get nearby properties using Haversine formula
   * No PostGIS needed – works with plain latitude/longitude columns
   */
  async getNearbyProperties(options: {
    lat?: number;
    lng?: number;
    city?: string;
    radiusKm?: number;
    limit?: number;
    excludeId?: string;
  }) {
    const { lat, lng, city, radiusKm = 5, limit = 10, excludeId } = options;

    // Build base query
    let query = supabase
      .from('properties')
      .select(`
        *,
        user:user_id(id, full_name, phone, avatar_url),
        images:property_images(id, url, thumbnail_url, is_primary),
        category:categories(id, name, slug)
      `)
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    // If no lat/lng, fall back to city-based proximity
    if (!lat || !lng) {
      if (city) {
        query = query.ilike('city', `%${city}%`);
      }
      const { data, error } = await query.limit(limit);
      if (error) throw new AppError(error.message, 400);
      return data as Property[];
    }

    // Fetch a broader pool then filter by Haversine distance in JS
    // (Supabase doesn't support PostGIS here, so we over-fetch and filter)
    const { data, error } = await query.limit(200);
    if (error) throw new AppError(error.message, 400);

    // Haversine formula
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    return (data as Property[])
      .filter(p => {
        if (!p.latitude || !p.longitude) return false;
        return haversine(lat, lng, p.latitude, p.longitude) <= radiusKm;
      })
      .slice(0, limit);
  }
}

export default new PropertyService();