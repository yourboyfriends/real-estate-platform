import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { propertiesApi } from '../api/properties';
import { categoriesApi } from '../api/categories';
import { Category } from '../types';
import { Button } from '../components/common/Button';

// Section components
import BasicInfoSection from '../components/post-property/BasicInfoSection';
import DetailSection from '../components/post-property/DetailSection';
import AmenitiesSection from '../components/post-property/AmenitiesSection';
import LocationSection from '../components/post-property/LocationSection';
import ImageUploadSection from '../components/post-property/ImageUploadSection';

// ─── Types 

interface FormData {
    title: string;
    description: string;
    listing_type: string;
    property_type: string;
    category_id: string;
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    floors: string;
    direction: string;
    legal_status: string;
    furniture: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    latitude: string;
    longitude: string;
}

const INITIAL_FORM: FormData = {
    title: '', description: '', listing_type: '', property_type: '',
    category_id: '', price: '', area: '', bedrooms: '', bathrooms: '',
    floors: '', direction: '', legal_status: '', furniture: '',
    address: '', city: '', district: '', ward: '', latitude: '', longitude: '',
};

// ─── Progress Steps ────────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Cơ bản', description: 'Loại tin, tiêu đề, mô tả' },
    { label: 'Chi tiết', description: 'Diện tích, giá, phòng' },
    { label: 'Vị trí', description: 'Địa chỉ & bản đồ' },
    { label: 'Tiện ích', description: 'Amenities' },
    { label: 'Hình ảnh', description: 'Upload ảnh' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const PropertyCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

    useEffect(() => {
        categoriesApi.getAll()
            .then(res => { if (res.success && res.data) setCategories(res.data); })
            .catch(() => toast.error('Không thể tải danh mục'));
    }, []);

    // ── Unified field updater 
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ── Amenity toggle ─────────────────────────────────────────────────────────
    const toggleAmenity = (id: string) => {
        setAmenities(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    // ── Validation ─────────────────────────────────────────────────────────────
    const validate = (): boolean => {
        if (!formData.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return false; }
        if (!formData.description.trim()) { toast.error('Vui lòng nhập mô tả'); return false; }
        if (!formData.listing_type) { toast.error('Vui lòng chọn loại tin'); return false; }
        if (!formData.property_type) { toast.error('Vui lòng chọn loại bất động sản'); return false; }
        if (!formData.category_id) { toast.error('Vui lòng chọn danh mục'); return false; }
        if (!formData.price || parseFloat(formData.price) <= 0) { toast.error('Vui lòng nhập giá hợp lệ'); return false; }
        if (!formData.area || parseFloat(formData.area) <= 0) { toast.error('Vui lòng nhập diện tích'); return false; }
        if (!formData.address.trim()) { toast.error('Vui lòng nhập địa chỉ'); return false; }
        if (!formData.city.trim()) { toast.error('Vui lòng nhập thành phố'); return false; }
        if (images.length === 0) { toast.error('Vui lòng upload ít nhất 1 ảnh'); return false; }
        return true;
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                listing_type: formData.listing_type as 'sale' | 'rent',
                property_type: formData.property_type as
                    'apartment' | 'house' | 'villa' | 'land' | 'office' | 'warehouse' | 'shophouse',
                category_id: formData.category_id,
                price: parseFloat(formData.price),
                area: parseFloat(formData.area),
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
                floors: formData.floors ? parseInt(formData.floors) : undefined,
                direction: (formData.direction || undefined) as any,
                legal_status: (formData.legal_status || undefined) as any,
                furniture: (formData.furniture || undefined) as any,
                amenities: amenities.length > 0 ? amenities : undefined,
                address: formData.address,
                city: formData.city,
                district: formData.district || undefined,
                ward: formData.ward || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                status: 'pending' as const,
            };

            const res = await propertiesApi.create(payload);
            if (res.success && res.data) {
                if (images.length > 0) {
                    await propertiesApi.uploadImages(res.data.id, images);
                }
                toast.success('Đăng tin thành công! Đang chờ admin duyệt.');
                navigate('/my-properties');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể đăng tin');
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen py-10 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-10 h-10 transition-colors bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Đăng tin bất động sản</h1>
                        <p className="text-sm text-gray-500">
                            Điền đầy đủ thông tin để tin đăng được duyệt nhanh chóng
                        </p>
                    </div>
                </div>

                {/* ── Progress Steps ── */}
                <div className="p-4 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, i) => {
                            const done = i < currentStep;
                            const active = i === currentStep;
                            return (
                                <React.Fragment key={i}>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(i)}
                                        className="flex flex-col items-center gap-1 group"
                                    >
                                        <div className={`flex items-center justify-center w-9 h-9 rounded-full
                                                         font-bold text-sm transition-all
                                            ${done
                                                ? 'bg-green-500 text-white shadow-md'
                                                : active
                                                    ? 'bg-primary-600 text-white shadow-md ring-4 ring-primary-100'
                                                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                            }`}>
                                            {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                        </div>
                                        <span className={`hidden md:block text-xs font-medium transition-colors
                                            ${active ? 'text-primary-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                                            {step.label}
                                        </span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors
                                            ${i < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-center text-gray-400">
                        Bước {currentStep + 1}/5 — {STEPS[currentStep].description}
                    </p>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Step 0: Basic Info */}
                    {currentStep === 0 && (
                        <BasicInfoSection
                            title={formData.title}
                            listingType={formData.listing_type}
                            propertyType={formData.property_type}
                            categoryId={formData.category_id}
                            description={formData.description}
                            categories={categories}
                            onChange={handleChange}
                        />
                    )}

                    {/* Step 1: Detail (price, area, rooms) */}
                    {currentStep === 1 && (
                        <DetailSection
                            price={formData.price}
                            area={formData.area}
                            bedrooms={formData.bedrooms}
                            bathrooms={formData.bathrooms}
                            floors={formData.floors}
                            direction={formData.direction}
                            legalStatus={formData.legal_status}
                            furniture={formData.furniture}
                            onChange={handleChange}
                        />
                    )}

                    {/* Step 2: Location + Map — must use && not 'hidden' so
                        MapContainer always mounts with real pixel dimensions.
                        display:none → Leaflet gets 0×0 → NaN coordinates → crash */}
                    {currentStep === 2 && (
                        <LocationSection
                            address={formData.address}
                            city={formData.city}
                            district={formData.district}
                            ward={formData.ward}
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onChange={handleChange}
                        />
                    )}

                    {/* Step 3: Amenities */}
                    {currentStep === 3 && (
                        <AmenitiesSection amenities={amenities} onToggle={toggleAmenity} />
                    )}

                    {/* Step 4: Images */}
                    {currentStep === 4 && (
                        <ImageUploadSection images={images} onImagesChange={setImages} />
                    )}

                    {/* ── Navigation ── */}
                    <div className="flex gap-3 pt-2">
                        {currentStep > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep(s => s - 1)}
                                disabled={loading}
                                className="px-6"
                            >
                                ← Quay lại
                            </Button>
                        )}

                        {currentStep < STEPS.length - 1 ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setCurrentStep(s => s + 1)}
                                className="flex-1"
                            >
                                Tiếp theo →
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={loading}
                                disabled={loading}
                                className="flex-1 gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {loading ? 'Đang đăng tin...' : 'Đăng tin'}
                            </Button>
                        )}
                    </div>

                    {/* Info note */}
                    <div className="p-4 text-sm text-blue-800 border border-blue-200 bg-blue-50 rounded-xl">
                        <strong>💡 Lưu ý:</strong> Tin đăng của bạn sẽ ở trạng thái &ldquo;Chờ duyệt&rdquo; và được
                        admin xem xét trước khi hiển thị công khai. Bạn có thể theo dõi tại trang &ldquo;Tin của tôi&rdquo;.
                    </div>
                </form>
            </div>
        </div>
    );
};
