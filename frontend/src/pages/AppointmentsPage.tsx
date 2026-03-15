import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontexts';
import { appointmentsApi, Appointment, AppointmentStatus } from '../api/appointments';
import { propertiesApi } from '../api/properties';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
    CalendarDays, Clock, MapPin, Phone, Mail, User,
    MessageSquare, CheckCircle2, XCircle, Clock4,
    Trash2, Home, AlertCircle, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Property } from '../types';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

type StatusKey = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; text: string; icon: React.FC<any> }> = {
    pending: { label: 'Chờ xác nhận', bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock4 },
    confirmed: { label: 'Đã xác nhận', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
    rejected: { label: 'Đã từ chối', bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    cancelled: { label: 'Đã hủy', bg: 'bg-gray-100', text: 'text-gray-600', icon: XCircle },
    completed: { label: 'Hoàn thành', bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle2 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatVNDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

// ─── RejectModal ──────────────────────────────────────────────────────────────

interface RejectModalProps {
    appointmentId: string | null;
    onClose: () => void;
    onConfirm: (id: string, reason: string) => void;
}

const RejectModal: React.FC<RejectModalProps> = ({ appointmentId, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!appointmentId) setReason('');
    }, [appointmentId]);

    if (!appointmentId) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-1 text-lg font-bold text-gray-900">Từ chối lịch hẹn</h3>
                <p className="mb-4 text-sm text-gray-500">Vui lòng nhập lý do để khách hàng biết</p>
                <textarea
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    rows={3}
                    maxLength={500}
                    placeholder="Ví dụ: Bất động sản đã có người đặt cọc..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <div className="mt-4 flex gap-3 justify-end">
                    <Button variant="outline" onClick={onClose}>Hủy</Button>
                    <Button
                        className="bg-red-500 hover:bg-red-600 text-white"
                        disabled={!reason.trim()}
                        onClick={() => onConfirm(appointmentId, reason.trim())}
                    >
                        Xác nhận từ chối
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
};

// ─── AppointmentCard ──────────────────────────────────────────────────────────

interface AppointmentCardProps {
    apt: Appointment;
    currentUserId: string;
    onConfirm: (id: string) => void;
    onReject: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
    apt, currentUserId, onConfirm, onReject, onCancel, onDelete,
}) => {
    const isBroker = apt.broker_id === currentUserId;

    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-0">
                {/* Property image strip */}
                {apt.property?.primary_image && (
                    <img
                        src={apt.property.primary_image}
                        alt={apt.property.title}
                        className="h-32 w-full object-cover"
                    />
                )}
                <div className="p-4 space-y-3">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="truncate font-semibold text-gray-900">
                                {apt.property?.title ?? 'Bất động sản'}
                            </h3>
                            {apt.property?.address && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 truncate">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    {apt.property.address}
                                </p>
                            )}
                        </div>
                        <StatusBadge status={apt.status} />
                    </div>

                    <Separator />

                    {/* Date & time */}
                    <div className="flex gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
                            {formatVNDate(apt.appointment_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-orange-500" />
                            {apt.appointment_time.slice(0, 5)}
                        </span>
                    </div>

                    {/* Parties */}
                    {isBroker ? (
                        <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm">
                            <span className="text-gray-500">Khách hàng: </span>
                            <span className="font-medium text-gray-900">{apt.full_name}</span>
                            <span className="ml-2 text-gray-500">— {apt.phone}</span>
                        </div>
                    ) : apt.broker_profile ? (
                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={apt.broker_profile.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-bold">
                                    {apt.broker_profile.full_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">Môi giới</p>
                                <p className="truncate text-sm font-medium text-gray-900">{apt.broker_profile.full_name}</p>
                            </div>
                        </div>
                    ) : null}

                    {/* Rejection reason */}
                    {apt.status === 'rejected' && apt.rejection_reason && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-xs font-semibold text-red-700">Lý do từ chối:</p>
                            <p className="mt-0.5 text-xs text-red-600">{apt.rejection_reason}</p>
                        </div>
                    )}

                    {/* Note */}
                    {apt.message && (
                        <p className="text-xs text-gray-400 italic line-clamp-2">"{apt.message}"</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        {isBroker && apt.status === 'pending' && (
                            <>
                                <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => onConfirm(apt.id)}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Xác nhận
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50" onClick={() => onReject(apt.id)}>
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Từ chối
                                </Button>
                            </>
                        )}
                        {!isBroker && apt.status === 'pending' && (
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => onCancel(apt.id)}>
                                Hủy lịch hẹn
                            </Button>
                        )}
                        {['cancelled', 'rejected', 'completed'].includes(apt.status) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onDelete(apt.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AppointmentsPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialPropertyId = searchParams.get('property');
    const initialBrokerId = searchParams.get('broker');

    // ── State ──
    const [activeTab, setActiveTab] = useState(initialPropertyId ? 'book' : 'list');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    // Form fields
    const [propertyInfo, setPropertyInfo] = useState<Property | null>(null);
    const [brokerName, setBrokerName] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [fullName, setFullName] = useState(user?.full_name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [noteMsg, setNoteMsg] = useState('');

    // ── Pre-fill user info once available ──
    useEffect(() => {
        if (user) {
            setFullName(user.full_name ?? '');
            setPhone(user.phone ?? '');
            setEmail(user.email ?? '');
        }
    }, [user]);

    // ── Load property info from URL param ──
    useEffect(() => {
        if (!initialPropertyId) return;
        propertiesApi.getById(initialPropertyId).then((res) => {
            if (res.success && res.data) {
                setPropertyInfo(res.data);
            }
        }).catch(() => { });

        // Try to get broker name if we have a broker id
        // (it will appear in the broker_profile after first fetch, skip for now)
    }, [initialPropertyId]);

    // ── Load appointments ──
    const loadAppointments = useCallback(async () => {
        if (!isAuthenticated) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await appointmentsApi.getAll();
            if (res.success && res.data) setAppointments(res.data);
        } catch { /* silent */ }
        setLoading(false);
    }, [isAuthenticated]);

    useEffect(() => { loadAppointments(); }, [loadAppointments]);

    // ── Book appointment ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!selectedDate || !selectedTime) {
            toast.error('Vui lòng chọn ngày và giờ hẹn');
            return;
        }
        if (!initialPropertyId || !(initialBrokerId || propertyInfo?.user_id)) {
            toast.error('Thiếu thông tin bất động sản hoặc môi giới');
            return;
        }

        setSubmitting(true);
        try {
            const res = await appointmentsApi.create({
                property_id: initialPropertyId,
                broker_id: initialBrokerId ?? propertyInfo!.user_id,
                appointment_date: selectedDate,
                appointment_time: selectedTime,
                full_name: fullName,
                phone,
                email: email || undefined,
                message: noteMsg || undefined,
            });

            if (res.success) {
                toast.success('Đặt lịch thành công! Đang chờ xác nhận từ môi giới.');
                setSelectedDate('');
                setSelectedTime('');
                setNoteMsg('');
                setActiveTab('list');
                loadAppointments();
            } else {
                toast.error(res.message ?? 'Không thể đặt lịch');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Đã xảy ra lỗi, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Status actions ──
    const handleConfirm = async (id: string) => {
        try {
            const res = await appointmentsApi.updateStatus(id, 'confirmed');
            if (res.success) { toast.success('Đã xác nhận lịch hẹn'); loadAppointments(); }
        } catch { toast.error('Không thể xác nhận'); }
    };

    const handleRejectConfirm = async (id: string, reason: string) => {
        try {
            const res = await appointmentsApi.updateStatus(id, 'rejected', reason);
            if (res.success) { toast.success('Đã từ chối lịch hẹn'); setRejectingId(null); loadAppointments(); }
        } catch { toast.error('Không thể từ chối'); }
    };

    const handleCancel = async (id: string) => {
        try {
            const res = await appointmentsApi.updateStatus(id, 'cancelled');
            if (res.success) { toast.success('Đã hủy lịch hẹn'); loadAppointments(); }
        } catch { toast.error('Không thể hủy'); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await appointmentsApi.delete(id);
            if (res.success) { toast.success('Đã xóa lịch hẹn'); loadAppointments(); }
        } catch { toast.error('Không thể xóa'); }
    };

    // ── Filtered list ──
    const filtered = filterStatus === 'all'
        ? appointments
        : appointments.filter((a) => a.status === filterStatus);

    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    void pendingCount; // used for potential future badge display

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Reject modal */}
            <RejectModal
                appointmentId={rejectingId}
                onClose={() => setRejectingId(null)}
                onConfirm={handleRejectConfirm}
            />

            {/* Hero */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white py-10">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="h-8 w-8" />
                        <div>
                            <h1 className="text-2xl font-bold">Đặt lịch hẹn xem bất động sản</h1>
                            <p className="mt-1 text-orange-100 text-sm">
                                Đặt lịch trực tiếp với môi giới để tham quan căn nhà yêu thích
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="book" className="gap-2">
                            <CalendarDays className="h-4 w-4" /> Đặt lịch mới
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-2">
                            <Clock className="h-4 w-4" /> Lịch hẹn của tôi
                            {appointments.length > 0 && (
                                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                                    {appointments.length > 9 ? '9+' : appointments.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── TAB: ĐẶT LỊCH ── */}
                    <TabsContent value="book">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Form */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-gray-900">
                                            <CalendarDays className="h-5 w-5 text-orange-500" />
                                            Thông tin đặt lịch
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Date & Time */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                        <CalendarDays className="h-3.5 w-3.5" /> Ngày hẹn *
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={(e) => setSelectedDate(e.target.value)}
                                                        min={getTodayStr()}
                                                        required
                                                        className="cursor-pointer"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" /> Giờ hẹn *
                                                    </label>
                                                    <Select value={selectedTime} onValueChange={setSelectedTime} required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn khung giờ" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TIME_SLOTS.map((t) => (
                                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Contact info */}
                                            <div className="space-y-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    Thông tin liên hệ
                                                </p>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                            <User className="h-3.5 w-3.5" /> Họ tên *
                                                        </label>
                                                        <Input
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            placeholder="Nguyễn Văn A"
                                                            required
                                                            maxLength={100}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                            <Phone className="h-3.5 w-3.5" /> Số điện thoại *
                                                        </label>
                                                        <Input
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            placeholder="0901234567"
                                                            required
                                                            maxLength={15}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                        <Mail className="h-3.5 w-3.5" /> Email
                                                    </label>
                                                    <Input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="email@example.com"
                                                        maxLength={255}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                        <MessageSquare className="h-3.5 w-3.5" /> Ghi chú
                                                    </label>
                                                    <textarea
                                                        value={noteMsg}
                                                        onChange={(e) => setNoteMsg(e.target.value)}
                                                        placeholder="Ví dụ: Tôi muốn xem phòng ngủ chính và khu vực bếp..."
                                                        rows={3}
                                                        maxLength={500}
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                                size="lg"
                                                disabled={submitting || !isAuthenticated}
                                            >
                                                {submitting ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                                                ) : !isAuthenticated ? (
                                                    'Đăng nhập để đặt lịch'
                                                ) : (
                                                    <><CalendarDays className="mr-2 h-4 w-4" /> Xác nhận đặt lịch</>
                                                )}
                                            </Button>

                                            {!isAuthenticated && (
                                                <p className="text-center text-sm text-gray-500">
                                                    <button type="button" className="text-orange-500 font-medium hover:underline" onClick={() => navigate('/login')}>
                                                        Đăng nhập
                                                    </button>{' '}để đặt lịch hẹn
                                                </p>
                                            )}
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Property card */}
                                {propertyInfo ? (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-sm">
                                                <Home className="h-4 w-4 text-orange-500" /> Bất động sản
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {propertyInfo.images && propertyInfo.images.length > 0 && (
                                                <img
                                                    src={propertyInfo.images[0].url}
                                                    alt={propertyInfo.title}
                                                    className="h-36 w-full rounded-lg object-cover"
                                                />
                                            )}
                                            <h3 className="line-clamp-2 font-semibold text-sm text-gray-900">
                                                {propertyInfo.title}
                                            </h3>
                                            <p className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                                {propertyInfo.address}
                                                {propertyInfo.district && `, ${propertyInfo.district}`}
                                                {propertyInfo.city && `, ${propertyInfo.city}`}
                                            </p>
                                            <button
                                                type="button"
                                                className="text-xs text-orange-500 hover:underline"
                                                onClick={() => navigate(`/properties/${propertyInfo.id}`)}
                                            >
                                                Xem chi tiết BĐS →
                                            </button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                            <Home className="mb-3 h-10 w-10 opacity-40" />
                                            <p className="text-sm font-medium">Chưa chọn bất động sản</p>
                                            <p className="mt-1 text-xs">Đặt lịch từ trang chi tiết BĐS để tự động điền thông tin</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => navigate('/properties')}
                                            >
                                                Xem BĐS
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Note card */}
                                <Card className="border-orange-200 bg-orange-50">
                                    <CardContent className="py-4">
                                        <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm text-orange-800">
                                            <AlertCircle className="h-4 w-4" /> Lưu ý
                                        </h4>
                                        <ul className="space-y-1 text-xs text-orange-700">
                                            <li>• Lịch hẹn cần môi giới xác nhận trước</li>
                                            <li>• Bạn sẽ nhận thông báo khi có phản hồi</li>
                                            <li>• Chỉ hủy được khi lịch chưa được xác nhận</li>
                                            <li>• Vui lòng đến đúng giờ hẹn đã chọn</li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── TAB: DANH SÁCH LỊCH HẸN ── */}
                    <TabsContent value="list">
                        {!isAuthenticated ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <User className="mb-4 h-12 w-12 text-gray-300" />
                                    <p className="mb-4 text-gray-500">Vui lòng đăng nhập để xem lịch hẹn</p>
                                    <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
                                </CardContent>
                            </Card>
                        ) : loading ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="animate-pulse">
                                        <div className="h-32 bg-gray-200" />
                                        <CardContent className="py-4 space-y-3">
                                            <div className="h-4 w-3/4 rounded bg-gray-200" />
                                            <div className="h-3 w-1/2 rounded bg-gray-200" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : appointments.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <CalendarDays className="mb-4 h-14 w-14 text-gray-300" />
                                    <p className="mb-1 text-lg font-semibold text-gray-700">Chưa có lịch hẹn nào</p>
                                    <p className="mb-5 text-sm text-gray-400">Hãy tìm bất động sản ưa thích và đặt lịch hẹn!</p>
                                    <Button
                                        className="bg-orange-500 hover:bg-orange-600 text-white"
                                        onClick={() => navigate('/properties')}
                                    >
                                        Khám phá BĐS
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-5">
                                {/* Filter bar */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {(['all', 'pending', 'confirmed', 'rejected', 'cancelled', 'completed'] as const).map((s) => {
                                        const count = s === 'all' ? appointments.length : appointments.filter(a => a.status === s).length;
                                        const isActive = filterStatus === s;
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => setFilterStatus(s)}
                                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${isActive
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
                                                    }`}
                                            >
                                                {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s]?.label ?? s} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                {filtered.length === 0 ? (
                                    <p className="py-10 text-center text-gray-400">Không có lịch hẹn nào trong mục này</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {filtered.map((apt) => (
                                            <AppointmentCard
                                                key={apt.id}
                                                apt={apt}
                                                currentUserId={user!.id}
                                                onConfirm={handleConfirm}
                                                onReject={setRejectingId}
                                                onCancel={handleCancel}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AppointmentsPage;
