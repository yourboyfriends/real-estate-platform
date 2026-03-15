import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertiesApi } from '../api/properties';
import { Property, PropertyFilters } from '../types';
import { PropertyCard } from '../components/properties/PropertyCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Search, Filter, MapPin, Home, DollarSign, Maximize, ChevronLeft, ChevronRight, Map, List } from 'lucide-react';

const PropertyMap = lazy(() => import('../components/map/PropertyMap'));

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Căn hộ/Chung cư',
    house: 'Nhà riêng',
    villa: 'Biệt thự',
    land: 'Đất nền',
    office: 'Văn phòng',
    warehouse: 'Kho xưởng',
    shophouse: 'Shophouse'
};

const CITIES = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Biên Hòa',
    'Nha Trang',
    'Huế',
    'Vũng Tàu'
];

export const PropertiesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        total_pages: 0,
    });

    const [filters, setFilters] = useState<PropertyFilters>({
        page: Number(searchParams.get('page')) || 1,
        limit: 12,
        listing_type: searchParams.get('listing_type') as any,
        property_type: searchParams.get('property_type') || undefined,
        city: searchParams.get('city') || undefined,
        search: searchParams.get('search') || undefined,
        min_price: Number(searchParams.get('min_price')) || undefined,
        max_price: Number(searchParams.get('max_price')) || undefined,
        min_area: Number(searchParams.get('min_area')) || undefined,
        max_area: Number(searchParams.get('max_area')) || undefined,
        bedrooms: Number(searchParams.get('bedrooms')) || undefined,
    });

    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.min_price || 0,
        filters.max_price || 50000000000
    ]);
    const [areaRange, setAreaRange] = useState<[number, number]>([
        filters.min_area || 0,
        filters.max_area || 1000
    ]);

    useEffect(() => {
        loadProperties();
    }, [filters.page, filters.listing_type, filters.property_type, filters.city, filters.search, filters.min_price, filters.max_price, filters.min_area, filters.max_area, filters.bedrooms]);

    const loadProperties = async () => {
        setIsLoading(true);
        try {
            const response = await propertiesApi.getAll(filters);
            if (response.success && response.data) {
                setProperties(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Failed to load properties:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        const updatedFilters = {
            ...filters,
            page: 1,
            min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
            max_price: priceRange[1] < 50000000000 ? priceRange[1] : undefined,
            min_area: areaRange[0] > 0 ? areaRange[0] : undefined,
            max_area: areaRange[1] < 1000 ? areaRange[1] : undefined,
        };
        setFilters(updatedFilters);
        updateURLParams(updatedFilters);
    };

    const updateURLParams = (newFilters: PropertyFilters) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== 0) {
                params.set(key, String(value));
            }
        });
        setSearchParams(params);
    };

    const handlePageChange = (newPage: number) => {
        setFilters({ ...filters, page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatPrice = (price: number): string => {
        if (price >= 1000000000) {
            return `${(price / 1000000000).toFixed(1)} tỷ`;
        }
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(0)} triệu`;
        }
        return price.toLocaleString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Search Section */}
            <div className="bg-muted/30 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search Bar */}
                    <div className="flex flex-col gap-4 rounded-lg bg-background p-4 shadow-sm md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo địa điểm, tên dự án..."
                                className="pl-10"
                                value={filters.search || ''}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <Select
                            value={filters.listing_type || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, listing_type: value === 'all' ? undefined : value as any })}
                        >
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Loại tin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="sale">Mua bán</SelectItem>
                                <SelectItem value="rent">Cho thuê</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.property_type || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, property_type: value === 'all' ? undefined : value })}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Loại BĐS" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả loại</SelectItem>
                                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Bộ lọc
                        </Button>
                        <Button onClick={handleSearch} className="gap-2">
                            <Search className="h-4 w-4" />
                            Tìm kiếm
                        </Button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-4 grid gap-6 rounded-lg bg-background p-6 shadow-sm md:grid-cols-2">
                            {/* City Filter */}
                            <div>
                                <label className="mb-2 flex items-center text-sm font-medium">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Thành phố
                                </label>
                                <Select
                                    value={filters.city || 'all'}
                                    onValueChange={(value) => setFilters({ ...filters, city: value === 'all' ? undefined : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn thành phố" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả thành phố</SelectItem>
                                        {CITIES.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bedrooms Filter */}
                            <div>
                                <label className="mb-2 flex items-center text-sm font-medium">
                                    <Home className="mr-2 h-4 w-4" />
                                    Số phòng ngủ
                                </label>
                                <Select
                                    value={filters.bedrooms?.toString() || 'all'}
                                    onValueChange={(value) => setFilters({ ...filters, bedrooms: value === 'all' ? undefined : Number(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn số phòng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="1">1 phòng</SelectItem>
                                        <SelectItem value="2">2 phòng</SelectItem>
                                        <SelectItem value="3">3 phòng</SelectItem>
                                        <SelectItem value="4">4+ phòng</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Price Range */}
                            <div className="md:col-span-2">
                                <label className="mb-3 flex items-center text-sm font-medium">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Khoảng giá
                                </label>
                                <div className="space-y-4">
                                    <Slider
                                        value={priceRange}
                                        onValueChange={(value) => setPriceRange(value as [number, number])}
                                        max={50000000000}
                                        step={100000000}
                                        className="mt-2"
                                    />
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground">Từ</label>
                                            <Input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                placeholder="0"
                                                className="mt-1"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">{formatPrice(priceRange[0])}</p>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground">Đến</label>
                                            <Input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                placeholder="50000000000"
                                                className="mt-1"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">{formatPrice(priceRange[1])}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Area Range */}
                            <div className="md:col-span-2">
                                <label className="mb-3 flex items-center text-sm font-medium">
                                    <Maximize className="mr-2 h-4 w-4" />
                                    Diện tích (m²)
                                </label>
                                <div className="space-y-4">
                                    <Slider
                                        value={areaRange}
                                        onValueChange={(value) => setAreaRange(value as [number, number])}
                                        max={1000}
                                        step={10}
                                        className="mt-2"
                                    />
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground">Từ</label>
                                            <Input
                                                type="number"
                                                value={areaRange[0]}
                                                onChange={(e) => setAreaRange([Number(e.target.value), areaRange[1]])}
                                                placeholder="0"
                                                className="mt-1"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">{areaRange[0]} m²</p>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground">Đến</label>
                                            <Input
                                                type="number"
                                                value={areaRange[1]}
                                                onChange={(e) => setAreaRange([areaRange[0], Number(e.target.value)])}
                                                placeholder="1000"
                                                className="mt-1"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">{areaRange[1]} m²</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kết quả tìm kiếm</h1>
                        <p className="text-muted-foreground">Tìm thấy {pagination.total} bất động sản</p>
                    </div>
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Danh sách
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'map'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Map className="w-4 h-4" />
                            Bản đồ
                        </button>
                    </div>
                </div>

                {/* Map View */}
                {viewMode === 'map' && !isLoading && (
                    <div className="mb-8">
                        {(() => {
                            const propsWithCoords = properties.filter(p => p.latitude && p.longitude);
                            const center = propsWithCoords.length > 0
                                ? { lat: propsWithCoords[0].latitude!, lng: propsWithCoords[0].longitude! }
                                : { lat: 21.0285, lng: 105.8542 }; // Hà Nội default
                            return (
                                <>
                                    <Suspense fallback={
                                        <div className="h-[600px] bg-gray-100 rounded-xl flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Đang tải bản đồ...</p>
                                            </div>
                                        </div>
                                    }>
                                        <PropertyMap
                                            center={center}
                                            nearbyProperties={properties}
                                            height="600px"
                                            zoom={12}
                                        />
                                    </Suspense>
                                    {propsWithCoords.length < properties.length && (
                                        <p className="mt-2 text-xs text-gray-400 text-right">
                                            Hiển thị {propsWithCoords.length}/{properties.length} BĐS có tọa độ trên bản đồ
                                        </p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* List View */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-300 h-56 rounded-t-lg" />
                                <div className="bg-white p-4 rounded-b-lg">
                                    <div className="h-4 bg-gray-300 rounded mb-2" />
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-300 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Không tìm thấy bất động sản
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Thử điều chỉnh bộ lọc để tìm kiếm kết quả phù hợp hơn
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                {[...Array(pagination.total_pages)].map((_, i) => {
                                    const page = i + 1;
                                    if (
                                        page === 1 ||
                                        page === pagination.total_pages ||
                                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === pagination.page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                                        return <span key={page} className="px-2">...</span>;
                                    }
                                    return null;
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.total_pages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
