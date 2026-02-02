export interface User {
  token: any;
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'broker' | 'customer';
  phone?: string;
  avatar_url?: string;
  bio?: string;
  company_name?: string;
  address?: string;
  social_links?: Record<string, string>;
  is_verified: boolean;
  is_active: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;

}

export interface Property {
  id: string;
  property_code: string;
  user_id: string;
  category_id?: string;
  location_id?: string;
  project_id?: string;

  title: string;
  description?: string;
  listing_type: 'sale' | 'rent';
  property_type: 'apartment' | 'house' | 'villa' | 'land' | 'office' | 'warehouse' | 'shophouse';
  status: 'active' | 'pending' | 'sold' | 'rented' | 'expired' | 'hidden' | 'rejected';

  price: number;
  price_unit: string;
  area: number;
  land_area?: number;

  address: string;
  ward?: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;

  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  direction?: string;
  legal_status?: string;
  furniture?: 'full' | 'partial' | 'none';

  amenities?: string[];
  video_url?: string;
  virtual_tour_url?: string;

  view_count: number;
  contact_count: number;
  favorite_count: number;

  published_at?: string;
  expires_at?: string;
  is_featured: boolean;

  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  images?: PropertyImage[];
  category?: Category;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  thumbnail_url?: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface BlogPost {
  id: string;
  author_id: string;
  category_id?: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  view_count?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  author?: User;
  category?: Category;
}

export interface Contact {
  id: string;
  user_id?: string;
  property_id: string;
  seller_id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested';
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  pros?: string[];
  cons?: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PropertyFilters extends PaginationParams {
  listing_type?: 'sale' | 'rent';
  property_type?: string;
  city?: string;
  district?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string;
  search?: string;
}

export interface BlogFilters extends PaginationParams {
  category_id?: string;
  tag?: string;
  status?: 'draft' | 'published';
  search?: string;
}
