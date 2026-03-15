import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontexts';
import { propertiesApi } from '../api/properties';
import { Property } from '../types';
import { Button } from '../components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
    MapPin,
    Bed,
    Bath,
    Maximize,
    Home,
    Eye,
    Phone,
    Share2,
    Heart,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Compass,
    FileText,
    Sofa,
    MessageCircle,
    CalendarDays,
} from 'lucide-react';
import { formatPrice, formatArea } from '../utils/helper';
import { AMENITIES_OPTIONS, DIRECTION_LABELS, LEGAL_STATUS_LABELS, FURNITURE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';


// Lazy load map (Leaflet không hỗ trợ SSR)
const NearbyAmenitiesMap = lazy(() => import('../components/map/NearbyAmenitiesMap'));


export const PropertyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);


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
                // Tải BĐS xung quanh
                loadNearbyProperties(response.data);
            }
        } catch (error) {
            console.error('Failed to load property:', error);
            toast.error('Không thể tải thông tin bất động sản');
        } finally {
            setIsLoading(false);
        }
    };

    const loadNearbyProperties = async (prop: Property) => {
        try {
            const response = await propertiesApi.getNearby(
                prop.latitude,
                prop.longitude,
                prop.address,
                prop.city,
                prop.id
            );
            if (response.success && response.data) {
                setNearbyProperties(response.data);
            }
        } catch (error) {
            // Không hiển thị lỗi, chỉ không có BĐS lân cận
            console.warn('Could not load nearby properties:', error);
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

    // Map amenities IDs to labels with icons
    const propertyAmenities = property.amenities?.map(amenityId =>
        AMENITIES_OPTIONS.find(opt => opt.id === amenityId)
    ).filter(Boolean) || [];

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="container mx-auto px-4">
                {/* Image Gallery */}
                <div className="relative mb-6 overflow-hidden rounded-lg">
                    <div className="aspect-video bg-gray-200">
                        {images.length > 0 ? (
                            <img
                                src={currentImage?.url}
                                alt={property.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-24 h-24 text-gray-400" />
                            </div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`h-2 w-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-primary-600' : 'bg-white/50'
                                            }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h1 className="mb-2 text-2xl font-bold">{property.title}</h1>
                                <p className="flex items-center text-gray-600">
                                    <MapPin className="mr-1 h-4 w-4" />
                                    {property.address}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                                >
                                    <Share2 className="h-5 w-5" />
                                </button>
                                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg">
                                    <Heart className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-wrap items-center gap-4">
                            <span className="text-3xl font-bold text-primary-600">
                                {formatPrice(property.price)}
                            </span>
                            <Badge variant="secondary">{formatArea(property.area)}</Badge>
                            <div className="flex items-center gap-1 text-gray-600">
                                <Eye className="h-4 w-4" />
                                {property.view_count} lượt xem
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                Đăng ngày {new Date(property.created_at).toLocaleDateString('vi-VN')}
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Property Details */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Thông tin chi tiết</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                    {property.bedrooms != null && (
                                        <div className="flex items-center gap-2">
                                            <Bed className="h-5 w-5 text-gray-500" />
                                            <span>{property.bedrooms} phòng ngủ</span>
                                        </div>
                                    )}
                                    {property.bathrooms != null && (
                                        <div className="flex items-center gap-2">
                                            <Bath className="h-5 w-5 text-gray-500" />
                                            <span>{property.bathrooms} phòng tắm</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Maximize className="h-5 w-5 text-gray-500" />
                                        <span>{formatArea(property.area)}</span>
                                    </div>
                                    {property.direction && (
                                        <div className="flex items-center gap-2">
                                            <Compass className="h-5 w-5 text-gray-500" />
                                            <span>Hướng {DIRECTION_LABELS[property.direction]}</span>
                                        </div>
                                    )}
                                    {property.legal_status && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-gray-500" />
                                            <span>{LEGAL_STATUS_LABELS[property.legal_status]}</span>
                                        </div>
                                    )}
                                    {property.furniture && (
                                        <div className="flex items-center gap-2">
                                            <Sofa className="h-5 w-5 text-gray-500" />
                                            <span>{FURNITURE_LABELS[property.furniture]}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Mô tả</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-line text-gray-600">
                                    {property.description || 'Chưa có mô tả'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Amenities */}
                        {propertyAmenities.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tiện ích</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {propertyAmenities.map((amenity) => (
                                            <Badge key={amenity!.id} variant="outline">
                                                <span className="mr-1">{amenity!.icon}</span>
                                                {amenity!.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* MAP SECTION */}

                    {/* Sidebar - Contact */}
                    <div>
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Thông tin liên hệ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {property.user && (
                                    <div className="mb-4 flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={property.user.avatar_url} />
                                            <AvatarFallback>{property.user.full_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{property.user.full_name}</p>
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                {property.user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <Button variant="primary" className="w-full">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Gọi điện
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            if (!user) {
                                                navigate('/login');
                                                return;
                                            }
                                            navigate(`/messages?to=${property.user_id}&property=${property.id}`);
                                        }}
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        {user ? 'Gửi tin nhắn' : 'Đăng nhập để nhắn tin'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                                        onClick={() => {
                                            if (!user) { navigate('/login'); return; }
                                            navigate(`/appointments?property=${property.id}&broker=${property.user_id}`);
                                        }}
                                    >
                                        <CalendarDays className="h-4 w-4 mr-2" />
                                        {user ? 'Đặt lịch hẹn' : 'Đăng nhập để đặt lịch'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* === BẢN ĐỒ TỔNG HỢP === */}
                {property.latitude && property.longitude && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            Vị trí & Tiện ích xung quanh
                        </h2>
                        <Suspense
                            fallback={
                                <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Đang tải bản đồ...</p>
                                    </div>
                                </div>
                            }
                        >
                            <NearbyAmenitiesMap
                                propertyLat={property.latitude}
                                propertyLng={property.longitude}
                                propertyName={property.title}
                                mainProperty={property}
                                nearbyProperties={nearbyProperties}
                            />
                        </Suspense>
                    </div>
                )}
            </div>
        </div>
    );
};
