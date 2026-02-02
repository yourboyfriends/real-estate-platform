import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { propertiesApi } from '../api/properties';
import { Property } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import {
    Home,
    Plus,
    Edit,
    Trash2,
    Eye,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react';

export const MyPropertiesPage: React.FC = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            setLoading(true);
            const response = await propertiesApi.getMyProperties();
            if (response.success && response.data) {
                setProperties(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load properties:', error);
            toast.error('Không thể tải danh sách tin đăng');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa tin này?')) return;

        try {
            setDeleting(id);
            await propertiesApi.delete(id);
            toast.success('Đã xóa tin đăng');
            loadProperties();
        } catch (error: any) {
            console.error('Failed to delete property:', error);
            toast.error('Không thể xóa tin đăng');
        } finally {
            setDeleting(null);
        }
    };

    // Calculate statistics
    const stats = {
        total: properties.length,
        pending: properties.filter(p => p.status === 'pending').length,
        active: properties.filter(p => p.status === 'active').length,
        rejected: properties.filter(p => p.status === 'rejected').length,
    };

    // Filter properties
    const filteredProperties = filter === 'all'
        ? properties
        : properties.filter(p => p.status === filter);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tin đăng của tôi</h1>
                        <p className="text-gray-600">Quản lý tất cả tin đăng bất động sản của bạn</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/properties/create')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Đăng tin mới
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tổng số tin</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Home className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Chờ duyệt</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Đang hiển thị</p>
                                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Bị từ chối</p>
                                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-4 font-medium transition-colors ${filter === 'all'
                                ? 'border-b-2 border-primary-600 text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Tất cả ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-6 py-4 font-medium transition-colors ${filter === 'pending'
                                ? 'border-b-2 border-primary-600 text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Chờ duyệt ({stats.pending})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-6 py-4 font-medium transition-colors ${filter === 'active'
                                ? 'border-b-2 border-primary-600 text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Đang hiển thị ({stats.active})
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-6 py-4 font-medium transition-colors ${filter === 'rejected'
                                ? 'border-b-2 border-primary-600 text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Bị từ chối ({stats.rejected})
                        </button>
                    </div>
                </div>

                {/* Properties List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-600">Đang tải...</p>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {filter === 'all' ? 'Chưa có tin đăng nào' : `Không có tin ${filter === 'pending' ? 'chờ duyệt' : filter === 'active' ? 'đang hiển thị' : 'bị từ chối'}`}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {filter === 'all' ? 'Bắt đầu đăng tin bất động sản đầu tiên của bạn' : 'Thử chọn bộ lọc khác'}
                        </p>
                        {filter === 'all' && (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/properties/create')}
                                className="inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Đăng tin ngay
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredProperties.map(property => (
                            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0">
                                        {property.images && property.images.length > 0 ? (
                                            <img
                                                src={property.images[0].image_url}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Home className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                    {property.title}
                                                </h3>
                                                <StatusBadge status={property.status} />
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-2xl font-bold text-primary-600">
                                                    {formatPrice(property.price)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {property.area} m²
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-3 line-clamp-2">
                                            {property.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                            <span>📍 {property.city}</span>
                                            <span>📅 {formatDate(property.created_at)}</span>
                                            {property.views !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {property.views} lượt xem
                                                </span>
                                            )}
                                        </div>

                                        {/* Rejection Reason */}
                                        {property.status === 'rejected' && property.rejection_reason && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800 mb-1">
                                                            Lý do từ chối:
                                                        </p>
                                                        <p className="text-sm text-red-700">
                                                            {property.rejection_reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Link to={`/properties/${property.id}`}>
                                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    Xem
                                                </Button>
                                            </Link>

                                            {(property.status === 'pending' || property.status === 'rejected') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/properties/${property.id}/edit`)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Sửa
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(property.id)}
                                                disabled={deleting === property.id}
                                                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {deleting === property.id ? 'Đang xóa...' : 'Xóa'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
