export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'broker' | 'customer';
  phone?: string;
  avatar_url?: string;
  bio?: string;
  company_name?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  property_code: string;
  user_id: string;
  title: string;
  description?: string;
  listing_type: 'sale' | 'rent';
  property_type: 'apartment' | 'house' | 'villa' | 'land' | 'office' | 'warehouse' | 'shophouse';
  status: 'active' | 'pending' | 'sold' | 'rented' | 'expired' | 'hidden' | 'rejected';
  price: number;
  area: number;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  direction?: 'east' | 'west' | 'south' | 'north' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  legal_status?: 'red_book' | 'pink_book' | 'waiting' | 'other';
  furniture?: 'full' | 'partial' | 'none';
  amenities?: string[];
  view_count: number;
  is_featured: boolean;
  created_at: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  user?: User;
  images?: PropertyImage[];
  category?: Category;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  image_url: string;
  is_primary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
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
  author?: User;
  category?: Category;
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  category_id?: string;
  tag?: string;
  status?: 'draft' | 'published';
  search?: string;
  sort?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PropertyFilters {
  page?: number;
  limit?: number;
  listing_type?: 'sale' | 'rent';
  property_type?: string;
  city?: string;
  district?: string;
  search?: string;
  sort?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id: string | null;
  message: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  partner_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  property_id: string | null;
  property_title: string | null;
  property_image: string | null;
}