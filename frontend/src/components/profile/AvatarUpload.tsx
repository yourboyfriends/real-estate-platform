/**
 * AvatarUpload – Upload avatar lên Supabase Storage qua backend
 * - Hiển thị: ảnh nếu có avatar_url, ngược lại hiện chữ cái đầu tên
 * - Upload flow: chọn file → POST /auth/avatar → URL lưu DB → updateUser
 */
import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/authcontexts';
import api from '../../api/axios';
import { ApiResponse, User } from '../../types';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
    size?: number; // px, default 96
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ size = 96 }) => {
    const { user, updateUser } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const initials = (user?.full_name ?? 'U')
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Chỉ chấp nhận file ảnh');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File quá lớn — tối đa 5MB');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await api.post<ApiResponse<User>>('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success && res.data.data) {
                // avatar_url is already saved in DB — just sync local state
                await updateUser({ avatar_url: res.data.data.avatar_url });
            }
        } catch {
            toast.error('Upload avatar thất bại, thử lại nhé');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="relative inline-block" style={{ width: size, height: size }}>
            {/* Avatar / initials */}
            <div
                className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center
                           overflow-hidden border-4 border-white shadow-lg"
            >
                {user?.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span
                        className="text-primary-700 font-bold select-none"
                        style={{ fontSize: size * 0.34 }}
                    >
                        {initials}
                    </span>
                )}
            </div>

            {/* Spinner / camera overlay */}
            {uploading ? (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2
                        className="text-white animate-spin"
                        style={{ width: size * 0.3, height: size * 0.3 }}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700
                               border-2 border-white flex items-center justify-center transition-colors shadow-md"
                    title="Đổi ảnh đại diện"
                >
                    <Camera className="w-4 h-4 text-white" />
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default AvatarUpload;
