import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, AdminProperty } from '../../api/admin';
import { Search, Eye, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helper';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: 'Chờ duyệt', bg: 'bg-amber-100',  text: 'text-amber-800' },
  active:   { label: 'Active',    bg: 'bg-green-100',  text: 'text-green-800' },
  rejected: { label: 'Từ chối',  bg: 'bg-red-100',    text: 'text-red-800' },
  sold:     { label: 'Đã bán',   bg: 'bg-blue-100',   text: 'text-blue-800' },
  expired:  { label: 'Hết hạn',  bg: 'bg-gray-100',   text: 'text-gray-600' },
  hidden:   { label: 'Ẩn',       bg: 'bg-gray-100',   text: 'text-gray-600' },
};

const STATUS_FILTERS = ['all', 'pending', 'active', 'rejected', 'expired'] as const;

// ── Reject reason modal ───────────────────────────────────────────────────────

const RejectModal: React.FC<{
  propertyId: string | null;
  propertyTitle: string;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}> = ({ propertyId, propertyTitle, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  useEffect(() => { if (!propertyId) setReason(''); }, [propertyId]);
  if (!propertyId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-1">Từ chối tin đăng</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{propertyTitle}</p>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 mb-4"
          rows={3}
          placeholder="Lý do từ chối (bắt buộc)..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Hủy</button>
          <button
            disabled={!reason.trim()}
            onClick={() => onConfirm(propertyId, reason)}
            className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const PropertyManagementAdmin: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage]             = useState(1);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [rejectTitle, setRejectTitle] = useState('');
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllProperties(
        statusFilter === 'all' ? undefined : statusFilter,
        search || undefined,
        page
      );
      if (res.success && res.data) {
        setProperties(res.data.properties);
        setTotal(res.data.total);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      const res = await adminApi.approveProperty(id);
      if (res.success) { toast.success('Đã duyệt tin'); load(); }
    } catch { toast.error('Không thể duyệt'); }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await adminApi.rejectProperty(id, reason);
      if (res.success) { toast.success('Đã từ chối'); setRejectId(null); load(); }
    } catch { toast.error('Không thể từ chối'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa vĩnh viễn tin này?')) return;
    try {
      const res = await adminApi.deleteProperty(id);
      if (res.success) { toast.success('Đã xóa tin'); load(); }
    } catch { toast.error('Không thể xóa'); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <RejectModal
        propertyId={rejectId}
        propertyTitle={rejectTitle}
        onClose={() => setRejectId(null)}
        onConfirm={handleReject}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="Tìm tiêu đề..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
              }`}
            >
              {s === 'all' ? 'Tất cả' : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-auto">Tổng: <strong>{total}</strong></span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium">Tin đăng</th>
              <th className="text-left px-4 py-3 font-medium">Môi giới</th>
              <th className="text-left px-4 py-3 font-medium">Giá</th>
              <th className="text-left px-4 py-3 font-medium">Lượt xem</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-50 animate-pulse">
                  <td className="px-4 py-3"><div className="flex gap-2 items-center"><div className="w-12 h-10 bg-gray-200 rounded-lg" /><div><div className="h-3 w-36 bg-gray-200 rounded mb-1" /><div className="h-2.5 w-24 bg-gray-200 rounded" /></div></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-8 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : properties.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Không có tin đăng nào</td></tr>
            ) : (
              properties.map(p => {
                const st = STATUS_MAP[p.status] ?? STATUS_MAP.expired;
                return (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.city}{p.district && `, ${p.district}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {p.broker ? (
                        <>
                          <p className="font-medium text-gray-800">{p.broker.full_name}</p>
                          <p className="text-gray-400">{p.broker.phone ?? p.broker.email}</p>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-semibold text-xs">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.view_count}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/properties/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Xem"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {p.status === 'pending' && (
                          <>
                            <button
                              title="Duyệt"
                              onClick={() => handleApprove(p.id)}
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              title="Từ chối"
                              onClick={() => { setRejectId(p.id); setRejectTitle(p.title); }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          title="Xóa"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Trang {page}/{totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagementAdmin;
