import React, { useState } from 'react';
import { Save, Clock, Mail, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    free_listing_days: 30,
    max_images: 10,
    max_file_size_mb: 5,
    auto_approve: false,
    maintenance_mode: false,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_email: '',
    contact_email: 'admin@batdongsan.vn',
    contact_phone: '1900 1234',
  });

  const set = (key: string, val: string | number | boolean) => setSettings(s => ({ ...s, [key]: val }));

  const Section: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon className="h-4 w-4 text-green-600" />
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Field: React.FC<{ label: string; children: React.ReactNode; desc?: string }> = ({ label, children, desc }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      {desc && <p className="text-xs text-gray-400 mb-2">{desc}</p>}
      {children}
    </div>
  );

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300';

  return (
    <div className="space-y-5 max-w-3xl">
      <Section title="Cấu hình tin đăng" icon={Clock}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Thời hạn tin miễn phí (ngày)">
            <input type="number" className={inputClass} value={settings.free_listing_days} onChange={e => set('free_listing_days', Number(e.target.value))} />
          </Field>
          <Field label="Số ảnh tối đa / tin">
            <input type="number" className={inputClass} value={settings.max_images} onChange={e => set('max_images', Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Kích thước file tối đa (MB)">
          <input type="number" className={inputClass} value={settings.max_file_size_mb} style={{ maxWidth: '200px' }} onChange={e => set('max_file_size_mb', Number(e.target.value))} />
        </Field>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Tự động duyệt tin</p>
            <p className="text-xs text-gray-400">Tin mới sẽ active ngay mà không cần admin duyệt</p>
          </div>
          <button
            onClick={() => set('auto_approve', !settings.auto_approve)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.auto_approve ? 'bg-green-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.auto_approve ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </Section>

      <Section title="Cấu hình Email SMTP" icon={Mail}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Host">
            <input className={inputClass} value={settings.smtp_host} onChange={e => set('smtp_host', e.target.value)} />
          </Field>
          <Field label="SMTP Port">
            <input type="number" className={inputClass} value={settings.smtp_port} onChange={e => set('smtp_port', Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Email gửi thông báo">
          <input type="email" className={inputClass} placeholder="noreply@batdongsan.vn" value={settings.smtp_email} onChange={e => set('smtp_email', e.target.value)} />
        </Field>
      </Section>

      <Section title="Thông tin liên hệ & Hệ thống" icon={Settings}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email liên hệ">
            <input type="email" className={inputClass} value={settings.contact_email} onChange={e => set('contact_email', e.target.value)} />
          </Field>
          <Field label="Hotline">
            <input className={inputClass} value={settings.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
          <div>
            <p className="text-sm font-medium text-red-900">Chế độ bảo trì</p>
            <p className="text-xs text-red-400">Tạm ngừng truy cập hệ thống cho người dùng thường</p>
          </div>
          <button
            onClick={() => set('maintenance_mode', !settings.maintenance_mode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </Section>

      <button
        onClick={() => toast.success('Đã lưu cấu hình hệ thống')}
        className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
      >
        <Save className="h-4 w-4" /> Lưu tất cả cấu hình
      </button>
    </div>
  );
};

export default SystemSettings;
