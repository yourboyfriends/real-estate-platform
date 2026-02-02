import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/helper';

interface ImageUploaderProps {
    images: File[];
    onImagesChange: (images: File[]) => void;
    maxImages?: number;
    maxSizeMB?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    images,
    onImagesChange,
    maxImages = 10,
    maxSizeMB = 5
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            return `${file.name} không phải là file ảnh`;
        }

        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `${file.name} vượt quá ${maxSizeMB}MB`;
        }

        return null;
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        setError('');
        const fileArray = Array.from(files);

        // Check max images
        if (images.length + fileArray.length > maxImages) {
            setError(`Chỉ được upload tối đa ${maxImages} ảnh`);
            return;
        }

        // Validate each file
        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        // Add new images
        onImagesChange([...images, ...fileArray]);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
        setError('');
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                    dragActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400',
                    images.length >= maxImages && 'opacity-50 cursor-not-allowed'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={images.length < maxImages ? openFileDialog : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                    disabled={images.length >= maxImages}
                />

                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                    Kéo thả ảnh vào đây hoặc click để chọn
                </p>
                <p className="text-sm text-gray-500">
                    Tối đa {maxImages} ảnh, mỗi ảnh không quá {maxSizeMB}MB
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    {images.length}/{maxImages} ảnh đã chọn
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((file, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Image Info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <div className="text-gray-300">
                                    {(file.size / 1024).toFixed(0)} KB
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
