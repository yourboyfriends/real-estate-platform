import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/authcontexts';
import { notificationsApi, type Notification, type NotificationType } from '../api/notifications';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Bell, CheckCircle, XCircle, Clock, MessageSquare,
    Home, Eye, Trash2, Check, ChevronRight, AlertTriangle,
    Info, BellOff,
} from 'lucide-react';

// ─── Types & Config ──────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'approved' | 'rejected';

interface NotificationIconConfig {
    icon: typeof CheckCircle;
    colorClass: string;
    bgClass: string;
}

const ICON_MAP: Record<NotificationType | 'system', NotificationIconConfig> = {
    property_approved: { icon: CheckCircle, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-900/30' },
    property_rejected: { icon: XCircle, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-900/30' },
    property_expiring: { icon: AlertTriangle, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30' },
    new_contact: { icon: MessageSquare, colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
    system: { icon: Info, colorClass: 'text-muted-foreground', bgClass: 'bg-muted' },
};

const TAB_FILTERS: Record<Tab, (n: Notification) => boolean> = {
    all: () => true,
    unread: (n) => !n.is_read,
    approved: (n) => n.type === 'property_approved',
    rejected: (n) => n.type === 'property_rejected',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Mock data (dùng khi chưa có backend) ────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1', type: 'property_approved', title: 'Tin đăng đã được duyệt',
        message: 'Tin đăng "Căn hộ cao cấp Vinhomes Central Park" đã được phê duyệt và đang hiển thị trên hệ thống.',
        property_id: '1', property_title: 'Căn hộ cao cấp Vinhomes Central Park', is_read: false,
        created_at: '2024-01-20T10:30:00Z',
    },
    {
        id: '2', type: 'property_rejected', title: 'Tin đăng bị từ chối',
        message: 'Tin đăng "Nhà phố liền kề Ecopark" đã bị từ chối.',
        property_id: '2', property_title: 'Nhà phố liền kề Ecopark',
        rejection_reason: 'Hình ảnh không rõ ràng, không phản ánh đúng thực tế bất động sản. Vui lòng cập nhật hình ảnh chất lượng cao hơn và chụp từ nhiều góc độ khác nhau.',
        is_read: false, created_at: '2024-01-19T15:45:00Z',
    },
    {
        id: '3', type: 'property_approved', title: 'Tin đăng đã được duyệt',
        message: 'Tin đăng "Căn hộ cho thuê Masteri Thảo Điền" đã được phê duyệt và đang hiển thị trên hệ thống.',
        property_id: '4', property_title: 'Căn hộ cho thuê Masteri Thảo Điền', is_read: true,
        created_at: '2024-01-18T09:00:00Z',
    },
    {
        id: '4', type: 'property_rejected', title: 'Tin đăng bị từ chối',
        message: 'Tin đăng "Đất nền Bình Dương" đã bị từ chối.',
        property_id: '5', property_title: 'Đất nền Bình Dương',
        rejection_reason: 'Thông tin pháp lý không đầy đủ. Cần bổ sung giấy tờ chứng minh quyền sở hữu đất (Sổ đỏ/Sổ hồng) và thông tin quy hoạch khu vực.',
        is_read: true, created_at: '2024-01-17T14:20:00Z',
    },
    {
        id: '5', type: 'property_expiring', title: 'Tin đăng sắp hết hạn',
        message: 'Tin đăng "Biệt thự Phú Mỹ Hưng" sẽ hết hạn trong 3 ngày. Hãy gia hạn để tiếp tục hiển thị.',
        property_id: '3', property_title: 'Biệt thự Phú Mỹ Hưng', is_read: false,
        created_at: '2024-01-16T08:00:00Z',
    },
    {
        id: '6', type: 'new_contact', title: 'Liên hệ mới',
        message: 'Bạn nhận được 1 liên hệ mới cho tin "Căn hộ cao cấp Vinhomes Central Park" từ Trần Văn B (0901234567).',
        property_id: '1', property_title: 'Căn hộ cao cấp Vinhomes Central Park', is_read: true,
        created_at: '2024-01-15T16:30:00Z',
    },
    {
        id: '7', type: 'property_rejected', title: 'Tin đăng bị từ chối',
        message: 'Tin đăng "Phòng trọ Quận 1" đã bị từ chối.',
        property_id: '6', property_title: 'Phòng trọ Quận 1',
        rejection_reason: 'Giá đăng không hợp lý so với thị trường khu vực. Mô tả tin đăng chứa thông tin sai lệch về diện tích và tiện ích.',
        is_read: false, created_at: '2024-01-14T11:10:00Z',
    },
];

// ─── Sub-component: Notification Card ────────────────────────────────────────────

interface NotificationCardProps {
    notification: Notification;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (path: string) => void;
}

const NotificationCard = ({ notification, isExpanded, onToggle, onDelete, onNavigate }: NotificationCardProps) => {
    const config = ICON_MAP[notification.type] ?? ICON_MAP.system;
    const Icon = config.icon;
    const isRejected = notification.type === 'property_rejected';
    const isApproved = notification.type === 'property_approved';
    const isExpiring = notification.type === 'property_expiring';

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${!notification.is_read
                ? 'border-l-4 border-l-primary bg-primary/[0.02]'
                : 'opacity-80'
                }`}
            onClick={() => onToggle(notification.id)}
        >
            <CardContent className="p-4">
                <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bgClass}`}>
                        <Icon className={`h-5 w-5 ${config.colorClass}`} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                    </p>
                                    {!notification.is_read && (
                                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1">
                                <span className="whitespace-nowrap text-xs text-muted-foreground">
                                    {timeAgo(notification.created_at)}
                                </span>
                                <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>

                        {/* Expanded: rejected */}
                        {isRejected && isExpanded && (
                            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-destructive">
                                    <AlertTriangle className="h-4 w-4" /> Lý do từ chối
                                </div>
                                <p className="text-sm text-muted-foreground">{notification.rejection_reason}</p>
                                <div className="mt-3">
                                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(`/properties/${notification.property_id}/edit`); }}>
                                        Chỉnh sửa &amp; gửi lại <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Expanded: approved */}
                        {isApproved && isExpanded && (
                            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" /> Tin đã được duyệt thành công
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Tin đăng của bạn đang được hiển thị công khai trên hệ thống.
                                </p>
                                <div className="mt-3">
                                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(`/properties/${notification.property_id}`); }}>
                                        <Eye className="h-3 w-3" /> Xem tin đăng
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Expanded: expiring */}
                        {isExpiring && isExpanded && (
                            <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                    <Clock className="h-4 w-4" /> Tin sắp hết hạn
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Hãy gia hạn tin đăng để tiếp tục tiếp cận khách hàng tiềm năng.
                                </p>
                                <div className="mt-3">
                                    <Button size="sm" className="gap-1 text-xs">
                                        Gia hạn ngay <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Collapsed: property link shortcut */}
                        {notification.property_title && !isExpanded && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                                <Home className="h-3 w-3" />
                                {notification.property_title}
                                <ChevronRight className="h-3 w-3" />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ─── Empty State ─────────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<Tab, string> = {
    all: 'Bạn chưa có thông báo nào',
    unread: 'Bạn đã đọc tất cả thông báo',
    approved: 'Chưa có tin đăng nào được duyệt',
    rejected: 'Không có tin đăng nào bị từ chối',
};

// ─── Main Page ────────────────────────────────────────────────────────────────────

export const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();


    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/login');
    }, [authLoading, isAuthenticated, navigate]);

    // Tải thông báo — fallback về mock khi API chưa có
    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await notificationsApi.getAll();
            if (res.success && res.data?.notifications) {
                setNotifications(res.data.notifications);
            } else {
                setNotifications(MOCK_NOTIFICATIONS);
            }
        } catch {
            // Backend chưa có endpoint — dùng mock data
            setNotifications(MOCK_NOTIFICATIONS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    // ── Derived values ────────────────────────────────────────────────────────
    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.is_read).length,
        [notifications]
    );

    const filteredNotifications = useMemo(
        () => notifications.filter(TAB_FILTERS[activeTab]),
        [notifications, activeTab]
    );

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleToggle = useCallback((id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
        // Đánh dấu đã đọc (optimistic update)
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        // Gọi API (fire-and-forget)
        notificationsApi.markAsRead(id).catch(() => { });
    }, []);

    const handleMarkAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        notificationsApi.markAllAsRead().catch(() => {
            toast.error('Không thể đánh dấu tất cả đã đọc');
        });
        toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    }, []);

    const handleDelete = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        notificationsApi.delete(id).catch(() => {
            toast.error('Không thể xóa thông báo');
        });
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Bell className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Thông báo</h1>
                            <p className="text-sm text-muted-foreground">
                                {unreadCount > 0
                                    ? `Bạn có ${unreadCount} thông báo chưa đọc`
                                    : 'Tất cả thông báo đã được đọc'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
                            <Check className="h-4 w-4" /> Đánh dấu tất cả đã đọc
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
                    <TabsList className="mb-4 grid w-full grid-cols-4">
                        <TabsTrigger value="all">
                            Tất cả
                            {notifications.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                                    {notifications.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="unread">
                            Chưa đọc
                            {unreadCount > 0 && (
                                <Badge className="ml-1 h-5 min-w-5 px-1 text-xs">{unreadCount}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
                        <TabsTrigger value="rejected">Từ chối</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
                                ))}
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            <div className="space-y-3">
                                {filteredNotifications.map((n) => (
                                    <NotificationCard
                                        key={n.id}
                                        notification={n}
                                        isExpanded={expandedId === n.id}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onNavigate={navigate}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <BellOff className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-lg font-medium">Không có thông báo</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {EMPTY_MESSAGES[activeTab]}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default NotificationsPage;
