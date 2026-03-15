import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, AdminCategory } from '../../api/admin';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';

type CatForm = { name: string; slug: string; description: string; icon: string };
const EMPTY: CatForm = { name: '', slug: '', description: '', icon: '' };

// ── Category modal ────────────────────────────────────────────────────────────

const CatModal: React.FC<{
  open: boolean;
  editing: AdminCategory | null;
  form: CatForm;
  setForm: (f: CatForm) => void;
  onClose: () => void;
  onSave: () => void;
}> = ({ open, editing, form, setForm, onClose, onSave }) => {
  if (!open) return null;
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tên danh mục *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Căn hộ chung cư"
              value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm({ ...form, name, slug: editing ? form.slug : slugify(name) });
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Slug *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 font-mono"
              placeholder="can-ho-chung-cu"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Mô tả</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Mô tả ngắn..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Icon</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="building2 (tên Lucide icon)"
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Hủy</button>
          <button
            disabled={!form.name || !form.slug}
            onClick={onSave}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      if (res.success && res.data) setCategories(res.data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '', icon: cat.icon ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      let res;
      if (editing) {
        res = await adminApi.updateCategory(editing.id, form);
      } else {
        res = await adminApi.createCategory(form);
      }
      if (res.success) {
        toast.success(editing ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
        setModalOpen(false);
        load();
      } else {
        toast.error(res.message ?? 'Lỗi lưu danh mục');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await adminApi.deleteCategory(cat.id);
      if (res.success) { toast.success('Đã xóa danh mục'); load(); }
      else toast.error(res.message ?? 'Không thể xóa');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không thể xóa danh mục');
    }
  };

  const handleToggleActive = async (cat: AdminCategory) => {
    try {
      const res = await adminApi.updateCategory(cat.id, { is_active: !cat.is_active });
      if (res.success) { toast.success('Đã cập nhật trạng thái'); load(); }
    } catch { toast.error('Lỗi cập nhật'); }
  };

  return (
    <div className="space-y-4">
      <CatModal open={modalOpen} editing={editing} form={form} setForm={setForm} onClose={() => setModalOpen(false)} onSave={handleSave} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-gray-900">Danh mục loại hình BĐS</span>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{categories.length}</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">STT</th>
                <th className="text-left px-4 py-3 font-medium">Tên</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Icon</th>
                <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chưa có danh mục nào</td></tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr key={cat.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{cat.icon ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${cat.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {cat.is_active ? 'Hoạt động' : 'Tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
