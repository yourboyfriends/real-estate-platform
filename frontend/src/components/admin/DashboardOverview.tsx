import React, { useEffect, useState } from 'react';
import { adminApi, AdminStats } from '../../api/admin';
import { Users, Building2, Clock4, CheckCircle, Eye, TrendingUp } from 'lucide-react';

const StatCard: React.FC<{
  label: string;
  value: number | string;
  sub?: string;
  icon: React.FC<any>;
  color: string;
}> = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('vi-VN')}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(res => { if (res.success && res.data) setStats(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-24 animate-pulse">
            <div className="flex gap-4 items-center h-full">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-gray-500 text-center py-8">Không thể tải thống kê</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={stats.total_users}
          sub={`+${stats.new_users_this_month} tháng này`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Tổng tin đăng"
          value={stats.total_properties}
          sub={`${stats.active_properties} đang active`}
          icon={Building2}
          color="bg-green-600"
        />
        <StatCard
          label="Chờ duyệt"
          value={stats.pending_properties}
          sub="Cần xem xét"
          icon={Clock4}
          color="bg-amber-500"
        />
        <StatCard
          label="Đã duyệt"
          value={stats.active_properties}
          sub={`${stats.rejected_properties} từ chối`}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Top properties by views */}
      {stats.top_properties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Top tin đăng nhiều lượt xem nhất</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Tiêu đề</th>
                <th className="text-left px-5 py-3 font-medium">Thành phố</th>
                <th className="text-right px-5 py-3 font-medium">Lượt xem</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_properties.map((p, idx) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-400 font-mono">#{idx + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{p.title}</td>
                  <td className="px-5 py-3 text-gray-500">{p.city}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                      <Eye className="h-3.5 w-3.5" />
                      {p.view_count.toLocaleString('vi-VN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
