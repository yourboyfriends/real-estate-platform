import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontexts';
import AdminSidebar from '../components/admin/AdminSidebar';
import DashboardOverview from '../components/admin/DashboardOverview';
import UserManagement from '../components/admin/UserManagement';
import PropertyManagementAdmin from '../components/admin/PropertyManagementAdmin';
import CategoryManagement from '../components/admin/CategoryManagement';
import ServicePackages from '../components/admin/ServicePackages';
import ReportsManagement from '../components/admin/ReportsManagement';
import SystemSettings from '../components/admin/SystemSettings';
import { Shield } from 'lucide-react';

const TAB_TITLES: Record<string, string> = {
  dashboard:  'Tổng quan hệ thống',
  users:      'Quản lý người dùng',
  properties: 'Quản lý tin đăng',
  categories: 'Quản lý danh mục',
  packages:   'Quản lý gói dịch vụ',
  reports:    'Báo cáo vi phạm',
  settings:   'Cấu hình hệ thống',
};

export const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Guard: not logged in or not admin
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Không có quyền truy cập</h2>
        <p className="text-gray-500 text-sm">Trang này chỉ dành cho quản trị viên.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <DashboardOverview />;
      case 'users':      return <UserManagement />;
      case 'properties': return <PropertyManagementAdmin />;
      case 'categories': return <CategoryManagement />;
      case 'packages':   return <ServicePackages />;
      case 'reports':    return <ReportsManagement />;
      case 'settings':   return <SystemSettings />;
      default:           return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{TAB_TITLES[activeTab]}</h1>
            <p className="text-xs text-gray-400">Xin chào, {user.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="h-3 w-3" /> Admin
            </span>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              ← Về trang chủ
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
