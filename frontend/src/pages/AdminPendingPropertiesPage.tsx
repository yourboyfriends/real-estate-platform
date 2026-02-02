import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { propertiesApi } from '../api/properties';
import { Property } from '../types';
import { Button } from '../components/common/Button';
import {
    Home,
    CheckCircle,
    XCircle,
    Eye,
    User,
    MapPin,
    Ruler,
    Calendar,
    AlertCircle
} from 'lucide-react';

export const AdminPendingPropertiesPage: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadPendingProperties();
    }, []);

    const loadPendingProperties = async () => {
        try {
            setLoading(true);
            const response = await propertiesApi.getPendingProperties();
            if (response.success && response.data) {
                setProperties(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load pending properties:', error);
            toast.error('Không thể tải danh sách tin chờ duyệt');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (property: Property) => {
        if (!window.confirm(`Duyệt tin "${property.title}"?`)) return;

        try {
            setProcessing(property.id);
            await propertiesApi.approveProperty(property.id);
            toast.success('Đã duyệt tin thành công');
            loadPendingProperties();
        } catch (error: any) {
            console.error('Failed to approve property:', error);
            toast.error('Không thể duyệt tin');
        } finally {
            setProcessing(null);
        }
    };

    const openRejectModal = (property: Property) => {
        setSelectedProperty(property);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!selectedProperty) return;

        if (!rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setProcessing(selectedProperty.id);
            await propertiesApi.rejectProperty(selectedProperty.id, rejectionReason);
            toast.success('Đã từ chối tin');
            setShowRejectModal(false);
            setSelectedProperty(null);
            setRejectionReason('');
            loadPendingProperties();
        } catch (error: any) {
            console.error('Failed to reject property:', error);
            toast.error('Không thể từ chối tin');
        } finally {
            setProcessing(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Duyệt tin bất động sản
                            </h1>
                            <p className="text-gray-600">
                                Xem xét và duyệt các tin đăng đang chờ
                            </p>
                        </div>
                        <div className="bg-yellow-100 px-6 py-3 rounded-lg">
                            <p className="text-sm text-yellow-800 font-medium">
                                Tin chờ duyệt
                            </p>
                            <p className="text-3xl font-bold text-yellow-900">
                                {properties.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Properties List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-600">Đang tải...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Không có tin chờ duyệt
                        </h3>
                        <p className="text-gray-600">
                            Tất cả tin đăng đã được xem xét
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {properties.map(property => (
                            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Image */}
                                    <div className="lg:w-80 h-64 lg:h-auto bg-gray-200 flex-shrink-0">
                                        {property.images && property.images.length > 0 ? (
                                            <img
                                                src={property.images[0].image_url}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Home className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6">
                                        {/* Title and Price */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {property.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Broker ID: {property.user_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-3xl font-bold text-primary-600">
                                                    {formatPrice(property.price)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Property Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Ruler className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Diện tích</p>
                                                    <p className="font-semibold">{property.area} m²</p>
                                                </div>
                                            </div>

                                            {property.bedrooms && (
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Home className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Phòng ngủ</p>
                                                        <p className="font-semibold">{property.bedrooms}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {property.bathrooms && (
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Home className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Phòng tắm</p>
                                                        <p className="font-semibold">{property.bathrooms}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Ngày đăng</p>
                                                    <p className="font-semibold text-sm">
                                                        {new Date(property.created_at).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {property.description}
                                        </p>

                                        {/* Location */}
                                        <div className="flex items-start gap-2 text-gray-700 mb-6">
                                            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    {property.address}
                                                    {property.ward && `, ${property.ward}`}
                                                    {property.district && `, ${property.district}`}
                                                    , {property.city}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Category */}
                                        {property.category && (
                                            <div className="mb-6">
                                                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                                    {property.category.name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-4 border-t">
                                            <Link to={`/properties/${property.id}`} target="_blank">
                                                <Button
                                                    variant="outline"
                                                    size="md"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                    Xem chi tiết
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="primary"
                                                size="md"
                                                onClick={() => handleApprove(property)}
                                                disabled={processing === property.id}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                {processing === property.id ? 'Đang duyệt...' : 'Duyệt tin'}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="md"
                                                onClick={() => openRejectModal(property)}
                                                disabled={processing === property.id}
                                                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                Từ chối
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedProperty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Từ chối tin đăng
                            </h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Tin: <strong>{selectedProperty.title}</strong>
                        </p>

                        <div className="mb-6">
                            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                placeholder="Nhập lý do từ chối để broker có thể chỉnh sửa..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedProperty(null);
                                    setRejectionReason('');
                                }}
                                disabled={processing === selectedProperty.id}
                                className="flex-1"
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleReject}
                                disabled={processing === selectedProperty.id || !rejectionReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                {processing === selectedProperty.id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
