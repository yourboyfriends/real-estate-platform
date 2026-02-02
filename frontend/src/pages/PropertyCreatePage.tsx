import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { propertiesApi } from '../api/properties';
import { categoriesApi } from '../api/categories';
import { Category } from '../types';
import { ImageUploader } from '../components/properties/ImageUploader';
import { Button } from '../components/common/Button';
import { Home, MapPin, DollarSign, Ruler, BedDouble, Bath, FileText, Tag } from 'lucide-react';

export const PropertyCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [images, setImages] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        listing_type: '',
        property_type: '',
        category_id: '',
        price: '',
        area: '',
        bedrooms: '',
        bathrooms: '',
        address: '',
        city: '',
        district: '',
        ward: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            toast.error('Không thể tải danh mục');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề');
            return false;
        }
        if (!formData.description.trim()) {
            toast.error('Vui lòng nhập mô tả');
            return false;
        }
        if (!formData.listing_type) {
            toast.error('Vui lòng chọn loại tin');
            return false;
        }
        if (!formData.property_type) {
            toast.error('Vui lòng chọn loại bất động sản');
            return false;
        }
        if (!formData.category_id) {
            toast.error('Vui lòng chọn danh mục');
            return false;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            toast.error('Vui lòng nhập giá hợp lệ');
            return false;
        }
        if (!formData.area || parseFloat(formData.area) <= 0) {
            toast.error('Vui lòng nhập diện tích hợp lệ');
            return false;
        }
        if (!formData.address.trim()) {
            toast.error('Vui lòng nhập địa chỉ');
            return false;
        }
        if (!formData.city.trim()) {
            toast.error('Vui lòng nhập thành phố');
            return false;
        }
        if (images.length === 0) {
            toast.error('Vui lòng upload ít nhất 1 ảnh');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            // Create property
            const propertyData = {
                title: formData.title,
                description: formData.description,
                listing_type: formData.listing_type as 'sale' | 'rent',
                property_type: formData.property_type as 'apartment' | 'house' | 'villa' | 'land' | 'office' | 'warehouse' | 'shophouse',
                category_id: formData.category_id,
                price: parseFloat(formData.price),
                area: parseFloat(formData.area),
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
                address: formData.address,
                city: formData.city,
                district: formData.district || undefined,
                ward: formData.ward || undefined,
                status: 'pending' as const,
            };

            const response = await propertiesApi.create(propertyData);

            if (response.success && response.data) {
                // Upload images
                if (images.length > 0) {
                    await propertiesApi.uploadImages(response.data.id, images);
                }

                toast.success('Đăng tin thành công! Tin của bạn đang chờ admin duyệt.');
                navigate('/my-properties');
            }
        } catch (error: any) {
            console.error('Failed to create property:', error);
            toast.error(error.response?.data?.message || 'Không thể đăng tin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng tin bất động sản</h1>
                    <p className="text-gray-600">
                        Điền đầy đủ thông tin để đăng tin. Tin của bạn sẽ được admin duyệt trước khi hiển thị công khai.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            Thông tin cơ bản
                        </h2>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu đề <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="VD: Bán căn hộ 2 phòng ngủ view biển"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Listing Type */}
                        <div>
                            <label htmlFor="listing_type" className="block text-sm font-medium text-gray-700 mb-2">
                                Loại tin <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="listing_type"
                                name="listing_type"
                                value={formData.listing_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            >
                                <option value="">Chọn loại tin</option>
                                <option value="sale">Bán</option>
                                <option value="rent">Cho thuê</option>
                            </select>
                        </div>

                        {/* Property Type */}
                        <div>
                            <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-2">
                                Loại bất động sản <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="property_type"
                                name="property_type"
                                value={formData.property_type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            >
                                <option value="">Chọn loại bất động sản</option>
                                <option value="apartment">Chung cư</option>
                                <option value="house">Nhà riêng</option>
                                <option value="villa">Biệt thự</option>
                                <option value="land">Đất nền</option>
                                <option value="office">Văn phòng</option>
                                <option value="warehouse">Kho xưởng</option>
                                <option value="shophouse">Shophouse</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Danh mục <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                                    required
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả chi tiết <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={6}
                                placeholder="Mô tả chi tiết về bất động sản: vị trí, tiện ích, nội thất..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Chi tiết bất động sản
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Price */}
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá (VNĐ) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="5000000000"
                                        min="0"
                                        step="1000000"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Area */}
                            <div>
                                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                                    Diện tích (m²) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        id="area"
                                        name="area"
                                        value={formData.area}
                                        onChange={handleInputChange}
                                        placeholder="80"
                                        min="0"
                                        step="0.1"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div>
                                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                                    Số phòng ngủ
                                </label>
                                <div className="relative">
                                    <BedDouble className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        id="bedrooms"
                                        name="bedrooms"
                                        value={formData.bedrooms}
                                        onChange={handleInputChange}
                                        placeholder="2"
                                        min="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Bathrooms */}
                            <div>
                                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
                                    Số phòng tắm
                                </label>
                                <div className="relative">
                                    <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        id="bathrooms"
                                        name="bathrooms"
                                        value={formData.bathrooms}
                                        onChange={handleInputChange}
                                        placeholder="2"
                                        min="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Vị trí
                        </h2>

                        <div className="space-y-4">
                            {/* Address */}
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                    Địa chỉ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="123 Đường ABC"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* City */}
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                        Thành phố <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Hà Nội"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* District */}
                                <div>
                                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                                        Quận/Huyện
                                    </label>
                                    <input
                                        type="text"
                                        id="district"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        placeholder="Cầu Giấy"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Ward */}
                                <div>
                                    <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phường/Xã
                                    </label>
                                    <input
                                        type="text"
                                        id="ward"
                                        name="ward"
                                        value={formData.ward}
                                        onChange={handleInputChange}
                                        placeholder="Dịch Vọng"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Hình ảnh <span className="text-red-500">*</span>
                        </h2>
                        <ImageUploader
                            images={images}
                            onImagesChange={setImages}
                            maxImages={10}
                            maxSizeMB={5}
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/properties')}
                            disabled={loading}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Đang đăng tin...' : 'Đăng tin'}
                        </Button>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Lưu ý:</strong> Tin đăng của bạn sẽ ở trạng thái "Chờ duyệt" và được admin xem xét trước khi hiển thị công khai.
                            Bạn có thể theo dõi trạng thái tin đăng tại trang "Tin của tôi".
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
