import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesApi } from '../api/properties';
import { Property } from '../types';
import { Button } from '../components/common/Button';
import {
    MapPin,
    Bed,
    Bath,
    Maximize,
    Home,
    Eye,
    Phone,
    Mail,
    Share2,
    Heart,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { formatPrice, formatArea } from '../utils/helper';
import toast from 'react-hot-toast';

export const PropertyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (id) {
            loadProperty(id);
        }
    }, [id]);

    const loadProperty = async (propertyId: string) => {
        setIsLoading(true);
        try {
            const response = await propertiesApi.getById(propertyId);
            if (response.success && response.data) {
                setProperty(response.data);
            }
        } catch (error) {
            console.error('Failed to load property:', error);
            toast.error('Không thể tải thông tin bất động sản');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: property?.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Đã sao chép link!');
        }
    };

    const handleNextImage = () => {
        if (property?.images) {
            setCurrentImageIndex((prev) => (prev + 1) % property.images!.length);
        }
    };

    const handlePrevImage = () => {
        if (property?.images) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? property.images!.length - 1 : prev - 1
            );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-96 bg-gray-300 rounded-lg mb-6" />
                        <div className="h-8 bg-gray-300 rounded w-3/4 mb-4" />
                        <div className="h-4 bg-gray-300 rounded w-1/2 mb-8" />
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-32 bg-gray-300 rounded" />
                            <div className="h-32 bg-gray-300 rounded" />
                            <div className="h-32 bg-gray-300 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Không tìm thấy bất động sản
                    </h2>
                    <Button variant="primary" onClick={() => navigate('/properties')}>
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    const images = property.images || [];
    const currentImage = images[currentImageIndex];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Quay lại
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                            <div className="relative h-96 bg-gray-200">
                                {images.length > 0 ? (
                                    <>
                                        <img
                                            src={currentImage?.url}
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevImage}
                                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>
                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                                    {currentImageIndex + 1} / {images.length}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Home className="w-24 h-24 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {images.length > 1 && (
                                <div className="p-4 grid grid-cols-6 gap-2">
                                    {images.slice(0, 6).map((image, index) => (
                                        <button
                                            key={image.id}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`aspect-square rounded overflow-hidden ${index === currentImageIndex ? 'ring-2 ring-primary-600' : ''
                                                }`}
                                        >
                                            <img
                                                src={image.url}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Property Info */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            {/* Title and Price */}
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900 flex-1">
                                        {property.title}
                                    </h1>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={handleShare}
                                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-600 mb-4">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    <span>{property.address}, {property.district && `${property.district}, `}{property.city}</span>
                                </div>
                                <div className="text-3xl font-bold text-primary-600">
                                    {formatPrice(property.price)}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Maximize className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div className="text-sm text-gray-600">Diện tích</div>
                                    <div className="font-semibold">{formatArea(property.area)}</div>
                                </div>
                                {property.bedrooms && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center mb-2">
                                            <Bed className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div className="text-sm text-gray-600">Phòng ngủ</div>
                                        <div className="font-semibold">{property.bedrooms}</div>
                                    </div>
                                )}
                                {property.bathrooms && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center mb-2">
                                            <Bath className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div className="text-sm text-gray-600">Phòng tắm</div>
                                        <div className="font-semibold">{property.bathrooms}</div>
                                    </div>
                                )}
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Eye className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div className="text-sm text-gray-600">Lượt xem</div>
                                    <div className="font-semibold">{property.view_count}</div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">Mô tả</h2>
                                <div className="text-gray-700 whitespace-pre-line">
                                    {property.description || 'Chưa có mô tả'}
                                </div>
                            </div>

                            {/* Property Details */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3">Thông tin chi tiết</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Mã BĐS:</span>
                                        <span className="font-semibold">#{property.property_code}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Loại hình:</span>
                                        <span className="font-semibold capitalize">{property.property_type}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Giao dịch:</span>
                                        <span className="font-semibold">
                                            {property.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Trạng thái:</span>
                                        <span className="font-semibold capitalize">{property.status}</span>
                                    </div>
                                    {property.direction && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Hướng:</span>
                                            <span className="font-semibold capitalize">{property.direction}</span>
                                        </div>
                                    )}
                                    {property.furniture && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Nội thất:</span>
                                            <span className="font-semibold capitalize">{property.furniture}</span>
                                        </div>
                                    )}
                                    {property.floors && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-600">Số tầng:</span>
                                            <span className="font-semibold">{property.floors}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Ngày đăng:</span>
                                        <span className="font-semibold">
                                            {new Date(property.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Contact Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Liên hệ</h3>

                            {property.user && (
                                <div className="mb-4 pb-4 border-b">
                                    <div className="flex items-center mb-2">
                                        {property.user.avatar_url ? (
                                            <img
                                                src={property.user.avatar_url}
                                                alt={property.user.full_name}
                                                className="w-12 h-12 rounded-full mr-3"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                                                <span className="text-primary-600 font-semibold">
                                                    {property.user.full_name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-semibold">{property.user.full_name}</div>
                                            <div className="text-sm text-gray-600 capitalize">{property.user.role}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button variant="primary" className="w-full">
                                    <Phone className="w-5 h-5 mr-2" />
                                    Gọi điện
                                </Button>
                                <Button variant="outline" className="w-full">
                                    <Mail className="w-5 h-5 mr-2" />
                                    Gửi email
                                </Button>
                            </div>

                            {/* Contact Form */}
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-semibold mb-3">Gửi tin nhắn</h4>
                                <form className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Họ tên"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Số điện thoại"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <textarea
                                        rows={4}
                                        placeholder="Nội dung tin nhắn..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <Button type="submit" variant="primary" className="w-full">
                                        Gửi tin nhắn
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
