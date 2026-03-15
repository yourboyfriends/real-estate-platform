import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/authcontexts';
import { propertiesApi } from '../api/properties';
import { Property } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import AvatarUpload from '../components/profile/AvatarUpload';
import {
    User, Home, LogOut, Phone, Building2, FileText,
    Shield, CheckCircle2, XCircle, ChevronRight, Eye
} from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/helper';
import { PROPERTY_TYPES, LISTING_TYPES } from '../utils/constants';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'properties' | 'security';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Hồ sơ', icon: User },
    { id: 'properties', label: 'Tin đăng', icon: Home },
    { id: 'security', label: 'Bảo mật', icon: Shield },
];

const ROLE_LABELS: Record<string, string> = {
    admin: 'Quản trị viên',
    broker: 'Môi giới',
    customer: 'Khách hàng',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    active: { label: 'Đang hiển thị', className: 'bg-green-100 text-green-700' },
    pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
    rejected: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
    sold: { label: 'Đã bán', className: 'bg-gray-100 text-gray-600' },
    rented: { label: 'Đã cho thuê', className: 'bg-gray-100 text-gray-600' },
    expired: { label: 'Hết hạn', className: 'bg-gray-100 text-gray-500' },
    hidden: { label: 'Đã ẩn', className: 'bg-gray-100 text-gray-500' },
};

// ─── Profile tab ──────────────────────────────────────────────────────────────
interface ProfileFormState {
    full_name: string;
    phone: string;
    bio: string;
    company_name: string;
}

const ProfileTab: React.FC<{ onSaved: () => void }> = ({ onSaved }) => {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState<ProfileFormState>({
        full_name: user?.full_name ?? '',
        phone: user?.phone ?? '',
        bio: user?.bio ?? '',
        company_name: user?.company_name ?? '',
    });
    const [saving, setSaving] = useState(false);

    const set = (k: keyof ProfileFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name.trim()) { toast.error('Vui lòng nhập họ tên'); return; }
        setSaving(true);
        try {
            await updateUser(form);
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="full_name">Họ và tên <span className="text-red-500">*</span></Label>
                    <Input id="full_name" value={form.full_name} onChange={set('full_name')} placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="phone" value={form.phone} onChange={set('phone')} className="pl-9" placeholder="0901234567" />
                    </div>
                </div>
            </div>

            {user?.role !== 'customer' && (
                <div className="space-y-1.5">
                    <Label htmlFor="company_name">Công ty</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="company_name" value={form.company_name} onChange={set('company_name')} className="pl-9" placeholder="Công ty BĐS ABC" />
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="bio">Giới thiệu bản thân</Label>
                <textarea
                    id="bio"
                    value={form.bio}
                    onChange={set('bio')}
                    rows={3}
                    placeholder="Mô tả ngắn về bản thân..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm
                               shadow-sm placeholder:text-muted-foreground focus-visible:outline-none
                               focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="min-w-[130px]">
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </div>
        </form>
    );
};

// ─── Properties tab ───────────────────────────────────────────────────────────
const PropertiesTab: React.FC<{ userId: string }> = ({ userId }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        propertiesApi.getAll({ limit: 50 })
            .then(res => {
                if (res.success && res.data) {
                    setProperties(res.data.filter(p => p.user_id === userId));
                }
            })
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return (
        <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-2" />
            Đang tải...
        </div>
    );

    if (!properties.length) return (
        <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có tin đăng nào</p>
            <Button asChild className="mt-4" size="sm">
                <Link to="/properties/create">Đăng tin ngay</Link>
            </Button>
        </div>
    );

    return (
        <div className="space-y-3">
            {properties.map(p => {
                const status = STATUS_CONFIG[p.status] ?? { label: p.status, className: 'bg-gray-100 text-gray-500' };
                const thumb = p.images?.[0]?.url ?? p.images?.[0]?.image_url;
                return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100
                                               hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                        {/* Thumb */}
                        <div className="w-16 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {thumb
                                ? <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Home className="w-6 h-6" />
                                </div>
                            }
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs font-semibold text-primary-600">{formatPrice(p.price)}</span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">{PROPERTY_TYPES[p.property_type]}</span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">{LISTING_TYPES[p.listing_type]}</span>
                            </div>
                        </div>
                        {/* Status + action */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}>
                                {status.label}
                            </span>
                            <Link
                                to={`/properties/${p.id}`}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Xem"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Security tab ─────────────────────────────────────────────────────────────
const SecurityTab: React.FC<{ email: string; isVerified: boolean }> = ({ email, isVerified }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-500 mt-0.5">{email}</p>
            </div>
            {isVerified
                ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Đã xác thực
                </span>
                : <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <XCircle className="w-4 h-4" /> Chưa xác thực
                </span>
            }
        </div>
        <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">
            🔐 Tính năng đổi mật khẩu đang được phát triển
        </div>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
    const { user, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('profile');

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="space-y-4">
                    {/* Avatar card */}
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <AvatarUpload size={96} />
                            <h2 className="mt-4 text-base font-semibold text-gray-900">{user.full_name}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                            <span className="mt-2 inline-block text-[11px] px-2 py-0.5 rounded-full
                                            bg-primary-100 text-primary-700 font-medium">
                                {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                            {user.company_name && (
                                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />{user.company_name}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Nav */}
                    <Card>
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {TABS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setTab(id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                                                    text-sm font-medium transition-colors
                                                    ${tab === id
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <Icon className="w-4 h-4" /> {label}
                                        </span>
                                        <ChevronRight className="w-4 h-4 opacity-40" />
                                    </button>
                                ))}

                                <div className="border-t border-gray-100 pt-1 mt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                                   text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Đăng xuất
                                    </button>
                                </div>
                            </nav>
                        </CardContent>
                    </Card>
                </aside>

                {/* ── Main content ──────────────────────────────────────── */}
                <main>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                {TABS.find(t => t.id === tab)?.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tab === 'profile' && (
                                <ProfileTab onSaved={() => { }} />
                            )}
                            {tab === 'properties' && (
                                <PropertiesTab userId={user.id} />
                            )}
                            {tab === 'security' && (
                                <SecurityTab email={user.email} isVerified={user.is_verified} />
                            )}
                        </CardContent>
                    </Card>
                </main>

            </div>
        </div>
    );
};

export default ProfilePage;
