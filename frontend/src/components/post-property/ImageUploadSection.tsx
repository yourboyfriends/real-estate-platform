import React from 'react';
import { ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ImageUploader } from '../properties/ImageUploader';

interface ImageUploadSectionProps {
    images: File[];
    onImagesChange: (images: File[]) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ images, onImagesChange }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary-600" />
                Hình ảnh <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription>
                Tải lên ít nhất 3 hình ảnh · Tối đa 10 ảnh · Mỗi ảnh &lt; 5MB
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ImageUploader
                images={images}
                onImagesChange={onImagesChange}
                maxImages={10}
                maxSizeMB={5}
            />
        </CardContent>
    </Card>
);

export default ImageUploadSection;
