import React, { useState } from 'react';
import { Package, Plus, Pencil, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServicePackage {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  max_listings: number;
  boost_count: number;
  is_active: boolean;
  features: string[];
}

const INITIAL: ServicePackage[] = [
  { id: '1', name: 'Gói Miễn Phí',      price: 0,       duration_days: 30,  max_listings: 3,  boost_count: 0,   is_active: true,  features: ['3 tin đăng', '30 ngày', 'Hỗ trợ cơ bản'] },
  { id: '2', name: 'Gói Cơ Bản',        price: 199000,  duration_days: 60,  max_listings: 10, boost_count: 5,   is_active: true,  features: ['10 tin đăng', '60 ngày', '5 lượt đẩy tin', 'Ưu tiên hiển thị'] },
  { id: '3', name: 'Gói VIP',           price: 499000,  duration_days: 90,  max_listings: 50, boost_count: 20,  is_active: true,  features: ['50 tin đăng', '90 ngày', '20 lượt đẩy tin', 'Badge VIP'] },
  { id: '4', name: 'Gói Doanh Nghiệp',  price: 1499000, duration_days: 365, max_listings: -1, boost_count: 100, is_active: false, features: ['Không giới hạn tin', '365 ngày', '100 lượt đẩy tin', 'Account manager'] },
];

type FormState = Omit<ServicePackage, 'id' | 'features' | 'is_active'>;
const EMPTY_FORM: FormState = { name: '', price: 0, duration_days: 30, max_listings: 5, boost_count: 0 };

const PackageModal: React.FC<{
  open: boolean;
  editing: ServicePackage | null;
  form: FormState;
  setForm: (f: FormState) => void;
  onClose: () => void;
  onSave: () => void;
}> = ({ open, editing, form, setForm, onClose, onSave }) => {
  if (!open) return null;
  const field = (label: string, key: keyof FormState, type = 'text') => (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input
        type={type}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
        value={form[key] as number | string}
        onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
      />
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Sửa gói dịch vụ' : 'Tạo gói dịch vụ'}</h3>
        <div className="space-y-3">
          {field('Tên gói', 'name')}
          {field('Giá (VND)', 'price', 'number')}
          <div className="grid grid-cols-3 gap-3">
            {field('Thời hạn (ngày)', 'duration_days', 'number')}
            {field('Số tin tối đa (-1=∞)', 'max_listings', 'number')}
            {field('Lượt đẩy tin', 'boost_count', 'number')}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Hủy</button>
          <button disabled={!form.name} onClick={onSave} className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">Lưu</button>
        </div>
      </div>
    </div>
  );
};

const ServicePackages: React.FC = () => {
  const [packages, setPackages] = useState(INITIAL);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p: ServicePackage) => {
    setEditing(p);
    setForm({ name: p.name, price: p.price, duration_days: p.duration_days, max_listings: p.max_listings, boost_count: p.boost_count });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      setPackages(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
      toast.success('Đã cập nhật gói dịch vụ');
    } else {
      const newPkg: ServicePackage = { id: Date.now().toString(), ...form, is_active: true, features: [`${form.max_listings === -1 ? 'Không giới hạn' : form.max_listings} tin đăng`, `${form.duration_days} ngày`, `${form.boost_count} lượt đẩy tin`] };
      setPackages(prev => [...prev, newPkg]);
      toast.success('Đã tạo gói dịch vụ mới');
    }
    setModalOpen(false);
  };

  const toggle = (id: string) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
    toast.success('Đã cập nhật trạng thái');
  };

  return (
    <div className="space-y-4">
      <PackageModal open={modalOpen} editing={editing} form={form} setForm={setForm} onClose={() => setModalOpen(false)} onSave={handleSave} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-gray-900">Gói dịch vụ</span>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="h-4 w-4" /> Tạo gói mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {packages.map(pkg => (
          <div key={pkg.id} className={`bg-white rounded-xl border shadow-sm p-5 transition-opacity ${pkg.is_active ? '' : 'opacity-50'}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{pkg.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {pkg.is_active ? 'Active' : 'Tắt'}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-3">
              {pkg.price === 0 ? 'Miễn phí' : `${pkg.price.toLocaleString('vi-VN')}đ`}
            </p>
            <ul className="space-y-1 mb-4">
              {pkg.features.map((f, i) => (
                <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => openEdit(pkg)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Pencil className="h-3 w-3" /> Sửa
              </button>
              <button onClick={() => toggle(pkg.id)} className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${pkg.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                {pkg.is_active ? 'Tắt' : 'Kích hoạt'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicePackages;
