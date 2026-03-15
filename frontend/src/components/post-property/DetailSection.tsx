import React from 'react';
import { FileText, BedDouble, Bath, Ruler, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
    DIRECTION_LABELS, LEGAL_STATUS_LABELS, FURNITURE_LABELS,
} from '../../utils/constants';

interface DetailSectionProps {
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    floors: string;
    direction: string;
    legalStatus: string;
    furniture: string;
    onChange: (field: string, value: string) => void;
}

const DetailSection: React.FC<DetailSectionProps> = ({
    price, area, bedrooms, bathrooms, floors, direction, legalStatus, furniture, onChange,
}) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" />
                Thông tin chi tiết
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
            {/* Price + Area */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="price">
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                            Giá (VNĐ) <span className="text-red-500">*</span>
                        </span>
                    </Label>
                    <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => onChange('price', e.target.value)}
                        placeholder="5,000,000,000"
                        min="0"
                        step="1000000"
                    />
                    {price && (
                        <p className="text-xs text-primary-600 font-medium">
                            ≈ {formatVND(parseFloat(price))}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="area">
                        <span className="flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5 text-gray-400" />
                            Diện tích (m²) <span className="text-red-500">*</span>
                        </span>
                    </Label>
                    <Input
                        id="area"
                        type="number"
                        value={area}
                        onChange={(e) => onChange('area', e.target.value)}
                        placeholder="80"
                        min="0"
                        step="0.1"
                    />
                </div>
            </div>

            {/* Bedrooms / Bathrooms / Floors */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                    <Label htmlFor="bedrooms">
                        <span className="flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                            Phòng ngủ
                        </span>
                    </Label>
                    <Input
                        id="bedrooms"
                        type="number"
                        value={bedrooms}
                        onChange={(e) => onChange('bedrooms', e.target.value)}
                        placeholder="2"
                        min="0"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="bathrooms">
                        <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-gray-400" />
                            Phòng tắm
                        </span>
                    </Label>
                    <Input
                        id="bathrooms"
                        type="number"
                        value={bathrooms}
                        onChange={(e) => onChange('bathrooms', e.target.value)}
                        placeholder="2"
                        min="0"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="floors">Số tầng</Label>
                    <Input
                        id="floors"
                        type="number"
                        value={floors}
                        onChange={(e) => onChange('floors', e.target.value)}
                        placeholder="3"
                        min="0"
                    />
                </div>
            </div>

            {/* Direction / Legal / Furniture */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                    <Label>Hướng nhà</Label>
                    <Select value={direction} onValueChange={(v) => onChange('direction', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn hướng" /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(DIRECTION_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label>Pháp lý</Label>
                    <Select value={legalStatus} onValueChange={(v) => onChange('legal_status', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn pháp lý" /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(LEGAL_STATUS_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label>Nội thất</Label>
                    <Select value={furniture} onValueChange={(v) => onChange('furniture', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn nội thất" /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(FURNITURE_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
    </Card>
);

function formatVND(n: number): string {
    if (!n || isNaN(n)) return '';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ VNĐ`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu VNĐ`;
    return n.toLocaleString('vi-VN') + ' VNĐ';
}

export default DetailSection;
