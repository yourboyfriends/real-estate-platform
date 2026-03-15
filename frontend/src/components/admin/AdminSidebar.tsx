import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Building2, FolderTree, Package,
  Flag, Settings, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Tổng quan',         icon: LayoutDashboard },
  { id: 'users',     label: 'Người dùng',         icon: Users },
  { id: 'properties',label: 'Tin đăng',           icon: Building2 },
  { id: 'categories',label: 'Danh mục',           icon: FolderTree },
  { id: 'packages',  label: 'Gói dịch vụ',        icon: Package },
  { id: 'reports',   label: 'Báo cáo vi phạm',    icon: Flag },
  { id: 'settings',  label: 'Cấu hình hệ thống',  icon: Settings },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-gray-900 flex flex-col transition-all duration-300 min-h-screen flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <Shield className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h2 className="font-bold text-white text-sm leading-tight">Admin Panel</h2>
            <p className="text-xs text-gray-400">Quản trị hệ thống</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
