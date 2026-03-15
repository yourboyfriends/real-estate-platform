import React, { useState } from 'react';
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Report {
  id: string;
  reporter_name: string;
  property_title: string;
  reason: string;
  detail: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

// Mock data — will be replaced when backend reports table is created
const MOCK_REPORTS: Report[] = [
  {
    id: '1', reporter_name: 'Nguyễn Văn A', property_title: 'Căn hộ cao cấp Quận 7',
    reason: 'Thông tin sai lệch', detail: 'Giá niêm yết không đúng thực tế, ảnh sử dụng ảnh dự án khác.',
    status: 'pending', created_at: '2026-03-08',
  },
  {
    id: '2', reporter_name: 'Trần Thị B', property_title: 'Nhà phố Thủ Đức',
    reason: 'Nghi ngờ lừa đảo', detail: 'Số điện thoại không liên lạc được.',
    status: 'pending', created_at: '2026-03-07',
  },
  {
    id: '3', reporter_name: 'Lê Văn C', property_title: 'Đất nền Long An',
    reason: 'Nội dung trùng lặp', detail: 'Tin này đăng lại nhiều lần với các tài khoản khác nhau.',
    status: 'resolved', created_at: '2026-03-05',
  },
];

const STATUS_CFG = {
  pending:   { label: 'Chờ xử lý', bg: 'bg-amber-100', text: 'text-amber-800' },
  resolved:  { label: 'Đã xử lý',  bg: 'bg-green-100', text: 'text-green-800' },
  dismissed: { label: 'Bác bỏ',    bg: 'bg-gray-100',  text: 'text-gray-600' },
};

const FILTER_OPTIONS = ['all', 'pending', 'resolved', 'dismissed'] as const;

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [filter,  setFilter]  = useState<string>('all');
  const [detail,  setDetail]  = useState<Report | null>(null);

  const act = (id: string, action: 'resolved' | 'dismissed') => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status: action } : r)));
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Chi tiết báo cáo</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CFG[detail.status].bg} ${STATUS_CFG[detail.status].text}`}>
                {STATUS_CFG[detail.status].label}
              </span>
            </div>
            <div><p className="text-xs text-gray-400">Tin bị báo cáo</p><p className="font-medium text-gray-900">{detail.property_title}</p></div>
            <div><p className="text-xs text-gray-400">Người báo cáo</p><p className="text-gray-700">{detail.reporter_name}</p></div>
            <div><p className="text-xs text-gray-400">Lý do</p><p className="font-semibold text-gray-900">{detail.reason}</p></div>
            <div><p className="text-xs text-gray-400">Chi tiết</p><p className="text-gray-700 text-sm">{detail.detail}</p></div>
            {detail.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { act(detail.id, 'resolved'); setDetail(null); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600"
                >
                  <CheckCircle className="h-4 w-4" /> Xử lý
                </button>
                <button
                  onClick={() => { act(detail.id, 'dismissed'); setDetail(null); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
                >
                  <XCircle className="h-4 w-4" /> Bác bỏ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-gray-900">Báo cáo vi phạm</span>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} chờ</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}
            >
              {f === 'all' ? 'Tất cả' : STATUS_CFG[f as keyof typeof STATUS_CFG]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium">Người báo cáo</th>
              <th className="text-left px-4 py-3 font-medium">Tin bị báo cáo</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Lý do</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Ngày</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Không có báo cáo nào</td></tr>
            ) : (
              filtered.map(r => {
                const st = STATUS_CFG[r.status];
                return (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.reporter_name}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{r.property_title}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{r.reason}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{r.created_at}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Xem chi tiết" onClick={() => setDetail(r)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button title="Xử lý" onClick={() => act(r.id, 'resolved')} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button title="Bác bỏ" onClick={() => act(r.id, 'dismissed')} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsManagement;
