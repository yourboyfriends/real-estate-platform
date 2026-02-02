import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string, role?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = () => {
    try {
      const userId = localStorage.getItem('userId');
      const savedUser = localStorage.getItem('user');
      
      if (userId && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        const userData = response.data;
        
        setUser(userData);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast.success('Đăng nhập thành công!');
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại!';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    full_name: string, 
    role: string = 'customer'
  ) => {
    try {
      const response = await authApi.register({ 
        email, 
        password, 
        full_name, 
        role 
      });
      
      if (response.success && response.data) {
        const userData = response.data;
        
        setUser(userData);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast.success('Đăng ký thành công!');
      } else {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại!';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    toast.success('Đã đăng xuất!');
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(data);
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Cập nhật thông tin thành công!');
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Cập nhật thất bại!';
      toast.error(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export { AuthContext };