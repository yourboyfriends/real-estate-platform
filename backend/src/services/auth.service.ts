import { supabase } from '../config/database';
import { User } from '../types';
import { AppError } from '../utils/errorHandler';

export class AuthService {
  async register(
    email: string,
    password: string,
    full_name: string,
    role: string = 'customer'
  ): Promise<User> {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }
    
    // For now, store plain password (will add bcrypt later)
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: password,
        full_name,
        role,
        is_active: true,
        is_verified: false
      })
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        avatar_url,
        is_verified,
        is_active,
        created_at,
        updated_at
      `)
      .single();
    
    if (error) throw new AppError(error.message, 400);
    
    return data as User;
  }
  
  async login(email: string, password: string): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        avatar_url,
        bio,
        company_name,
        is_verified,
        is_active,
        created_at,
        updated_at,
        password_hash
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (error || !user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Check password (temporary - will use bcrypt later)
    if (user.password_hash !== password) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
  
  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        avatar_url,
        bio,
        company_name,
        address,
        is_verified,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();
    
    if (error) throw new AppError('User not found', 404);
    
    return data as User;
  }
  
  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        avatar_url,
        bio,
        company_name,
        address,
        is_verified,
        is_active,
        created_at,
        updated_at
      `)
      .single();
    
    if (error) throw new AppError(error.message, 400);
    
    return data as User;
  }
}

export default new AuthService();