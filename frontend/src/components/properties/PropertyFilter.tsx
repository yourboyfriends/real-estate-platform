import React from 'react';
import { PropertyFilters } from '../../types';
import { Search, X } from 'lucide-react';

interface PropertyFilterProps {
    filters: PropertyFilters;
    onFilterChange: (filters: PropertyFilters) => void;
    onReset: () => void;
}

export const PropertyFilter: React.FC<PropertyFilterProps> = ({
    filters,
    onFilterChange,
    onReset,
}) => {
    const handleChange = (key: keyof PropertyFilters, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Vũng Tàu'];
    const propertyTypes = [
        { value: 'apartment', label: 'Căn hộ' },
        { value: 'house', label: 'Nhà riêng' },
        { value: 'villa', label: 'Biệt thự' },
        { value: 'land', label: 'Đất nền' },
        { value: 'office', label: 'Văn phòng' },
        { value: 'warehouse', label: 'Kho xưởng' },
        { value: 'shophouse', label: 'Shophouse' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                <button
                    onClick={onReset}
                    className="text-sm text-gray-600 hover:text-primary-600 flex items-center"
                >
                    <X className="w-4 h-4 mr-1" />
                    Xóa bộ lọc
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tìm kiếm
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                            placeholder="Tìm theo địa chỉ, tiêu đề..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Listing Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại giao dịch
                    </label>
                    <select
                        value={filters.listing_type || ''}
                        onChange={(e) => handleChange('listing_type', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="sale">Bán</option>
                        <option value="rent">Cho thuê</option>
                    </select>
                </div>

                {/* Property Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại hình
                    </label>
                    <select
                        value={filters.property_type || ''}
                        onChange={(e) => handleChange('property_type', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        {propertyTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thành phố
                    </label>
                    <select
                        value={filters.city || ''}
                        onChange={(e) => handleChange('city', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Min Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá từ (triệu)
                    </label>
                    <input
                        type="number"
                        value={filters.min_price || ''}
                        onChange={(e) => handleChange('min_price', e.target.value ? Number(e.target.value) * 1000000 : undefined)}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Max Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá đến (triệu)
                    </label>
                    <input
                        type="number"
                        value={filters.max_price || ''}
                        onChange={(e) => handleChange('max_price', e.target.value ? Number(e.target.value) * 1000000 : undefined)}
                        placeholder="Không giới hạn"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Min Area */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diện tích từ (m²)
                    </label>
                    <input
                        type="number"
                        value={filters.min_area || ''}
                        onChange={(e) => handleChange('min_area', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Max Area */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diện tích đến (m²)
                    </label>
                    <input
                        type="number"
                        value={filters.max_area || ''}
                        onChange={(e) => handleChange('max_area', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Không giới hạn"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Bedrooms */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số phòng ngủ
                    </label>
                    <select
                        value={filters.bedrooms || ''}
                        onChange={(e) => handleChange('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                    </select>
                </div>

                {/* Bathrooms */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số phòng tắm
                    </label>
                    <select
                        value={filters.bathrooms || ''}
                        onChange={(e) => handleChange('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
