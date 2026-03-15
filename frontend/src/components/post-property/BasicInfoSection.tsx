import React from 'react';
import { Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import { Category } from '../../types';

interface BasicInfoSectionProps {
    title: string;
    listingType: string;
    propertyType: string;
    categoryId: string;
    description: string;
    categories: Category[];
    onChange: (field: string, value: string) => void;
}

const LISTING_TYPES = [
    { value: 'sale', label: ' Bán' },
    { value: 'rent', label: ' Cho thuê' },
];

const PROPERTY_TYPES = [
    { value: 'apartment', label: ' Căn hộ / Chung cư' },
    { value: 'house', label: ' Nhà riêng' },
    { value: 'villa', label: ' Biệt thự' },
    { value: 'land', label: ' Đất nền' },
    { value: 'office', label: ' Văn phòng' },
    { value: 'warehouse', label: ' Kho xưởng' },
    { value: 'shophouse', label: ' Shophouse' },
];

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
    title, listingType, propertyType, categoryId, description, categories, onChange,
}) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary-600" />
                Thông tin cơ bản
            </CardTitle>
            <CardDescription>Nhập thông tin cơ bản về bất động sản</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
            {/* Listing type + Property type */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="listing_type">
                        Loại tin đăng <span className="text-red-500">*</span>
                    </Label>
                    <Select value={listingType} onValueChange={(v) => onChange('listing_type', v)}>
                        <SelectTrigger id="listing_type">
                            <SelectValue placeholder="Chọn loại tin" />
                        </SelectTrigger>
                        <SelectContent>
                            {LISTING_TYPES.map(item => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="property_type">
                        Loại bất động sản <span className="text-red-500">*</span>
                    </Label>
                    <Select value={propertyType} onValueChange={(v) => onChange('property_type', v)}>
                        <SelectTrigger id="property_type">
                            <SelectValue placeholder="Chọn loại BĐS" />
                        </SelectTrigger>
                        <SelectContent>
                            {PROPERTY_TYPES.map(item => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
                <Label htmlFor="category_id">
                    Danh mục <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={(v) => onChange('category_id', v)}>
                    <SelectTrigger id="category_id">
                        <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
                <Label htmlFor="title">
                    Tiêu đề tin đăng <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => onChange('title', e.target.value)}
                    placeholder="VD: Bán căn hộ 2PN Vinhomes Central Park, view sông"
                />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label htmlFor="description">
                    Mô tả chi tiết <span className="text-red-500">*</span>
                </Label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => onChange('description', e.target.value)}
                    rows={5}
                    placeholder="Mô tả chi tiết về bất động sản: vị trí nổi bật, nội thất, tiện ích xung quanh..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
        </CardContent>
    </Card>
);

export default BasicInfoSection;
