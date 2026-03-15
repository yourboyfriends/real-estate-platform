import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { AMENITIES_OPTIONS } from '../../utils/constants';

interface AmenitiesSectionProps {
    amenities: string[];
    onToggle: (id: string) => void;
}

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({ amenities, onToggle }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Tiện ích
            </CardTitle>
            <CardDescription>Chọn các tiện ích có sẵn tại bất động sản</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {AMENITIES_OPTIONS.map((a) => {
                    const checked = amenities.includes(a.id);
                    return (
                        <div
                            key={a.id}
                            onClick={() => onToggle(a.id)}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5
                                       transition-all select-none
                                       ${checked
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                                }`}
                        >
                            <Checkbox
                                id={a.id}
                                checked={checked}
                                onCheckedChange={() => onToggle(a.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                                htmlFor={a.id}
                                className="flex cursor-pointer items-center gap-1.5 text-sm font-normal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span>{a.icon}</span>
                                <span>{a.label}</span>
                            </Label>
                        </div>
                    );
                })}
            </div>
            {amenities.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                    Đã chọn <strong>{amenities.length}</strong> tiện ích
                </p>
            )}
        </CardContent>
    </Card>
);

export default AmenitiesSection;
