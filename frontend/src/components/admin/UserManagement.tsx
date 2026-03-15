import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, AdminUser } from '../../api/admin';
import { Search, Shield, Lock, Unlock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import toast from 'react-hot-toast';

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  admin:    { label: 'Admin',    bg: 'bg-red-100',    text: 'text-red-700' },
  broker:   { label: 'Môi giới', bg: 'bg-blue-100',   text: 'text-blue-700' },
  customer: { label: 'Khách',    bg: 'bg-gray-100',   text: 'text-gray-700' },
};

// ── Confirm modal ─────────────────────────────────────────────────────────────

const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ open, title, message, confirmLabel, confirmClass = 'bg-green-600 text-white hover:bg-green-700', onConfirm, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Hủy</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded-lg font-medium ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

// ── Role change modal ─────────────────────────────────────────────────────────

const RoleModal: React.FC<{
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (role: string) => void;
}> = ({ user, onClose, onConfirm }) => {
  const [role, setRole] = useState(user?.role ?? 'customer');
  useEffect(() => { if (user) setRole(user.role); }, [user]);
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-1">Thay đổi role</h3>
        <p className="text-sm text-gray-500 mb-4">{user.full_name} — {user.email}</p>
        <div className="space-y-2 mb-5">
          {(['customer', 'broker', 'admin'] as const).map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${role === r ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" className="accent-green-600" checked={role === r} onChange={() => setRole(r)} />
              <span className="text-sm font-medium capitalize">{ROLE_CONFIG[r].label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Hủy</button>
          <button onClick={() => onConfirm(role)} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">Cập nhật</button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [lockTarget, setLockTarget] = useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(search || undefined, page);
      if (res.success && res.data) {
        setUsers(res.data.users);
        setTotal(res.data.total);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search]);

  const handleToggleLock = async () => {
    if (!lockTarget) return;
    try {
      const res = await adminApi.updateUser(lockTarget.id, { is_active: !lockTarget.is_active });
      if (res.success) {
        toast.success(lockTarget.is_active ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        setLockTarget(null);
        load();
      }
    } catch { toast.error('Không thể cập nhật'); }
  };

  const handleChangeRole = async (role: string) => {
    if (!roleTarget) return;
    try {
      const res = await adminApi.updateUser(roleTarget.id, { role });
      if (res.success) {
        toast.success('Đã cập nhật role');
        setRoleTarget(null);
        load();
      }
    } catch { toast.error('Không thể cập nhật role'); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <ConfirmModal
        open={!!lockTarget}
        title={lockTarget?.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        message={`Bạn chắc muốn ${lockTarget?.is_active ? 'khóa' : 'mở khóa'} tài khoản "${lockTarget?.full_name}"?`}
        confirmLabel={lockTarget?.is_active ? 'Khóa' : 'Mở khóa'}
        confirmClass={lockTarget?.is_active ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}
        onConfirm={handleToggleLock}
        onClose={() => setLockTarget(null)}
      />
      <RoleModal user={roleTarget} onClose={() => setRoleTarget(null)} onConfirm={handleChangeRole} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
          placeholder="Tìm theo tên, email, SĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="h-4 w-4" />
        <span>Tổng cộng <strong className="text-gray-900">{total}</strong> người dùng</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium">Người dùng</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Tin đăng</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-50 animate-pulse">
                  <td className="px-4 py-3"><div className="flex gap-2 items-center"><div className="w-8 h-8 rounded-full bg-gray-200" /><div className="h-3 w-28 bg-gray-200 rounded" /></div></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 w-36 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 w-8 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Không tìm thấy người dùng</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-green-100 text-green-600 text-xs font-bold">
                          {u.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 leading-tight">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.phone ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_CONFIG[u.role]?.bg} ${ROLE_CONFIG[u.role]?.text}`}>
                      <Shield className="h-2.5 w-2.5" />
                      {ROLE_CONFIG[u.role]?.label ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{u.property_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => setLockTarget(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                      >
                        {u.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                      <button
                        title="Đổi role"
                        onClick={() => setRoleTarget(u)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Trang {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
