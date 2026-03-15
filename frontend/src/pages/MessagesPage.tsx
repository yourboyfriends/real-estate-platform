import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontexts';
import { messagesApi, Message, Conversation } from '../api/messages';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Send,
    Search,
    MessageCircle,
    ArrowLeft,
    Home,
    ImageIcon,
    X,
    Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays < 7) return `${diffDays} ngày`;
        return date.toLocaleDateString('vi-VN');
    } catch {
        return '';
    }
};

const formatDateTime = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ImageLightboxProps {
    src: string;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
    >
        <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={onClose}
        >
            <X className="h-6 w-6" />
        </button>
        <img
            src={src}
            alt="Xem ảnh"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        />
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const MessagesPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialPartnerId = searchParams.get('to');
    const initialPropertyId = searchParams.get('property');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const selectedConvRef = useRef<Conversation | null>(null);

    // Keep ref in sync with state (to avoid stale closure in polling)
    selectedConvRef.current = selectedConv;

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    };

    // ── Load conversations ──

    const loadConversations = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await messagesApi.getConversations();
            if (res.success && res.data) {
                setConversations(res.data);
                return res.data;
            }
        } catch (err) {
            console.error('Failed to load conversations', err);
        }
        return [];
    }, [isAuthenticated]);

    // ── Load messages for selected conversation ──

    const loadMessages = useCallback(async (partnerId: string) => {
        try {
            const res = await messagesApi.getMessages(partnerId);
            if (res.success && res.data) {
                setMessages(res.data);
                setTimeout(() => scrollToBottom(false), 50);
            }
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    }, []);

    // ── Initial load ──

    useEffect(() => {
        if (!isAuthenticated) return;

        const init = async () => {
            setLoading(true);
            const convList = await loadConversations();

            if (initialPartnerId) {
                const existing = (convList as Conversation[]).find(
                    (c) => c.partner_id === initialPartnerId
                );

                if (existing) {
                    setSelectedConv(existing);
                } else {
                    // New conversation from property detail page
                    const newConv: Conversation = {
                        partner_id: initialPartnerId,
                        full_name: 'Người dùng',
                        avatar_url: null,
                        last_message: '',
                        last_message_at: new Date().toISOString(),
                        unread_count: 0,
                        property_id: initialPropertyId,
                        property_title: null,
                        property_image: null,
                    };

                    // Try to resolve the name/property info from conversations
                    // (they'll appear correctly after first message is sent)
                    setSelectedConv(newConv);
                }
                setMobileShowChat(true);
            }

            setLoading(false);
        };

        init();
    }, [isAuthenticated, initialPartnerId, initialPropertyId, loadConversations]);

    // ── Load messages when conversation changes ──

    useEffect(() => {
        if (selectedConv) {
            loadMessages(selectedConv.partner_id);
        } else {
            setMessages([]);
        }
    }, [selectedConv, loadMessages]);

    // ── Polling for realtime updates (every 3s) ──

    useEffect(() => {
        if (!isAuthenticated) return;

        pollingRef.current = setInterval(async () => {
            const conv = selectedConvRef.current;
            if (conv) {
                // Refresh messages silently
                try {
                    const res = await messagesApi.getMessages(conv.partner_id);
                    if (res.success && res.data) {
                        setMessages((prev) => {
                            // Only update if new messages arrived
                            if (res.data!.length > prev.length) {
                                setTimeout(() => scrollToBottom(), 50);
                                return res.data!;
                            }
                            return prev;
                        });
                    }
                } catch { /* silent */ }
            }
            // Refresh conversation list silently
            loadConversations();
        }, 3000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isAuthenticated, loadConversations]);

    // ── Send message ──

    const sendMessage = async (imageUrl?: string) => {
        if (!selectedConv || (!newMessage.trim() && !imageUrl)) return;
        if (sending) return;

        setSending(true);
        try {
            const res = await messagesApi.sendMessage({
                receiver_id: selectedConv.partner_id,
                message: imageUrl ? newMessage.trim() : newMessage.trim(),
                property_id: selectedConv.property_id,
                image_url: imageUrl ?? null,
            });

            if (res.success && res.data) {
                setMessages((prev) => [...prev, res.data!]);
                setNewMessage('');
                setTimeout(() => scrollToBottom(), 50);

                // Update conversation list
                setConversations((prev) => {
                    const updated = prev.map((c) =>
                        c.partner_id === selectedConv.partner_id
                            ? {
                                ...c,
                                last_message: imageUrl ? '📷 Hình ảnh' : newMessage.trim(),
                                last_message_at: new Date().toISOString(),
                            }
                            : c
                    );
                    // If not in list yet, add it
                    if (!updated.find((c) => c.partner_id === selectedConv.partner_id)) {
                        updated.unshift({ ...selectedConv, last_message: newMessage.trim(), last_message_at: new Date().toISOString() });
                    }
                    return updated.sort(
                        (a, b) =>
                            new Date(b.last_message_at).getTime() -
                            new Date(a.last_message_at).getTime()
                    );
                });
            }
        } catch {
            toast.error('Không gửi được tin nhắn. Vui lòng thử lại.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── Image upload ──

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const url = await messagesApi.uploadImage(file);
            await sendMessage(url);
        } catch {
            toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
            setUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredConversations = conversations.filter((c) =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Guard: not logged in ──

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">Đăng nhập để nhắn tin</h2>
                    <p className="mb-4 text-gray-500">Bạn cần đăng nhập để sử dụng tính năng nhắn tin.</p>
                    <Button onClick={() => navigate('/login')}>Đăng nhập ngay</Button>
                </div>
            </div>
        );
    }

    // ── Render ──

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-50">
            {/* Lightbox */}
            {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}

            <div className="container mx-auto h-full px-4 py-4">
                <div
                    className="grid h-full overflow-hidden rounded-2xl border bg-white shadow-lg md:grid-cols-[320px_1fr]"
                >
                    {/* ── Sidebar: Conversation List ── */}
                    <div
                        className={`flex h-full flex-col border-r ${mobileShowChat ? 'hidden md:flex' : 'flex'
                            }`}
                    >
                        {/* Sidebar header */}
                        <div className="border-b px-4 py-4">
                            <h2 className="mb-3 text-xl font-bold text-gray-900">Tin nhắn</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Conversation list */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="space-y-4 p-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex animate-pulse items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-gray-200" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-24 rounded bg-gray-200" />
                                                <div className="h-3 w-40 rounded bg-gray-200" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-10 text-center text-gray-400">
                                    <MessageCircle className="mb-3 h-12 w-12 opacity-40" />
                                    <p className="font-medium">Chưa có cuộc trò chuyện</p>
                                    <p className="mt-1 text-sm">Tìm BĐS và nhắn tin cho người bán!</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <button
                                        key={conv.partner_id}
                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-orange-50 ${selectedConv?.partner_id === conv.partner_id
                                                ? 'border-r-2 border-orange-500 bg-orange-50'
                                                : ''
                                            }`}
                                        onClick={() => {
                                            setSelectedConv(conv);
                                            setMobileShowChat(true);
                                            // Clear unread badge locally
                                            setConversations((prev) =>
                                                prev.map((c) =>
                                                    c.partner_id === conv.partner_id
                                                        ? { ...c, unread_count: 0 }
                                                        : c
                                                )
                                            );
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={conv.avatar_url ?? undefined} />
                                                <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                                                    {conv.full_name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conv.unread_count > 0 && (
                                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="truncate font-semibold text-gray-900">
                                                    {conv.full_name}
                                                </span>
                                                <span className="flex-shrink-0 text-xs text-gray-400">
                                                    {formatTime(conv.last_message_at)}
                                                </span>
                                            </div>
                                            {conv.property_title && (
                                                <div className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
                                                    <Home className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{conv.property_title}</span>
                                                </div>
                                            )}
                                            <p
                                                className={`mt-0.5 truncate text-sm ${conv.unread_count > 0
                                                        ? 'font-semibold text-gray-900'
                                                        : 'text-gray-500'
                                                    }`}
                                            >
                                                {conv.last_message || 'Bắt đầu cuộc trò chuyện...'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Chat Area ── */}
                    <div
                        className={`flex h-full flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'
                            }`}
                    >
                        {selectedConv ? (
                            <>
                                {/* Chat header */}
                                <div className="flex items-center gap-3 border-b px-4 py-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setMobileShowChat(false)}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedConv.avatar_url ?? undefined} />
                                        <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                                            {selectedConv.full_name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-gray-900">
                                            {selectedConv.full_name}
                                        </p>
                                        {selectedConv.property_title && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Home className="h-3 w-3" />
                                                <span className="truncate">{selectedConv.property_title}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Property context banner */}
                                {selectedConv.property_id && (
                                    <div className="flex items-center gap-3 border-b bg-orange-50 px-4 py-2">
                                        {selectedConv.property_image ? (
                                            <img
                                                src={selectedConv.property_image}
                                                alt={selectedConv.property_title ?? ''}
                                                className="h-12 w-16 flex-shrink-0 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                                                <Home className="h-5 w-5 text-orange-400" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-gray-500">Đang hỏi về bất động sản</p>
                                            <p className="truncate font-semibold text-orange-600">
                                                {selectedConv.property_title ?? 'Bất động sản'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="flex-shrink-0 cursor-pointer text-xs hover:bg-orange-100"
                                            onClick={() =>
                                                selectedConv.property_id &&
                                                navigate(`/properties/${selectedConv.property_id}`)
                                            }
                                        >
                                            Xem BĐS
                                        </Badge>
                                    </div>
                                )}

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-4 py-4">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                                            <MessageCircle className="mb-3 h-12 w-12 opacity-30" />
                                            <p>Hãy gửi tin nhắn đầu tiên!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {messages.map((msg, idx) => {
                                                const isMine = msg.sender_id === user?.id;
                                                const prevMsg = messages[idx - 1];
                                                const showTimeDivider =
                                                    !prevMsg ||
                                                    new Date(msg.created_at).getTime() -
                                                    new Date(prevMsg.created_at).getTime() >
                                                    10 * 60 * 1000; // 10 minutes gap

                                                return (
                                                    <React.Fragment key={msg.id}>
                                                        {/* Time divider */}
                                                        {showTimeDivider && (
                                                            <div className="flex items-center justify-center py-2">
                                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
                                                                    {new Date(msg.created_at).toLocaleDateString('vi-VN', {
                                                                        weekday: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Message bubble */}
                                                        <div
                                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'
                                                                }`}
                                                        >
                                                            <div
                                                                className={`group flex max-w-[72%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'
                                                                    }`}
                                                            >
                                                                {/* Image */}
                                                                {msg.image_url && (
                                                                    <img
                                                                        src={msg.image_url}
                                                                        alt="Hình ảnh"
                                                                        className="max-h-64 cursor-pointer rounded-2xl object-cover shadow-sm transition-opacity hover:opacity-90"
                                                                        style={{ maxWidth: '260px' }}
                                                                        onClick={() => setLightboxSrc(msg.image_url!)}
                                                                    />
                                                                )}

                                                                {/* Text bubble */}
                                                                {msg.message && (
                                                                    <div
                                                                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMine
                                                                                ? 'rounded-br-md bg-orange-500 text-white'
                                                                                : 'rounded-bl-md bg-gray-100 text-gray-900'
                                                                            }`}
                                                                    >
                                                                        <p className="whitespace-pre-wrap break-words">
                                                                            {msg.message}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Timestamp */}
                                                                <span className="px-1 text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
                                                                    {formatDateTime(msg.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>

                                {/* Input area */}
                                <div className="border-t bg-white px-4 py-3">
                                    {/* Image upload preview indicator */}
                                    {uploadingImage && (
                                        <div className="mb-2 flex items-center gap-2 text-sm text-orange-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang tải ảnh lên...
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        {/* Image upload button */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleImageSelect}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="flex-shrink-0 text-gray-400 hover:text-orange-500"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImage || sending}
                                            title="Gửi hình ảnh"
                                        >
                                            {uploadingImage ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <ImageIcon className="h-5 w-5" />
                                            )}
                                        </Button>

                                        {/* Text input */}
                                        <Input
                                            placeholder="Nhập tin nhắn..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="flex-1"
                                            disabled={sending || uploadingImage}
                                        />

                                        {/* Send button */}
                                        <Button
                                            size="icon"
                                            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600"
                                            onClick={() => sendMessage()}
                                            disabled={!newMessage.trim() || sending || uploadingImage}
                                        >
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty state */
                            <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50">
                                    <MessageCircle className="h-12 w-12 text-orange-300" />
                                </div>
                                <h3 className="mb-1 text-lg font-semibold text-gray-700">
                                    Chọn cuộc trò chuyện
                                </h3>
                                <p className="text-sm">
                                    Chọn một cuộc trò chuyện bên trái để bắt đầu
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
