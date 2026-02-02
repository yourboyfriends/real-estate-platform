import React from 'react';
import { cn } from '../../utils/helper';

interface StatusBadgeProps {
    status: 'active' | 'pending' | 'sold' | 'rented' | 'expired' | 'hidden' | 'rejected';
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const statusConfig = {
        active: {
            label: 'Đang hiển thị',
            className: 'bg-green-100 text-green-800 border-green-200',
            icon: '✓'
        },
        pending: {
            label: 'Chờ duyệt',
            className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: '⏳'
        },
        rejected: {
            label: 'Từ chối',
            className: 'bg-red-100 text-red-800 border-red-200',
            icon: '✗'
        },
        sold: {
            label: 'Đã bán',
            className: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: '🏷️'
        },
        rented: {
            label: 'Đã cho thuê',
            className: 'bg-purple-100 text-purple-800 border-purple-200',
            icon: '🏷️'
        },
        expired: {
            label: 'Hết hạn',
            className: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: '⌛'
        },
        hidden: {
            label: 'Đã ẩn',
            className: 'bg-gray-100 text-gray-600 border-gray-200',
            icon: '👁️'
        }
    };

    const config = statusConfig[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border',
                config.className,
                className
            )}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
};
