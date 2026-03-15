import { Link } from 'react-router-dom';
import { Property } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Home, Bed, Bath, Maximize, Eye, Calendar, Heart } from 'lucide-react';
import { formatPrice, formatArea } from '../../utils/helper';
import { cn } from '../../lib/utils';



// ─── Types ─────────────────────────────────────────────────────────────────────
export interface PropertyCardProps {
    property: Property;
    /** 'default' = card dọc (lưới), 'horizontal' = card ngang (danh sách) */
    variant?: 'default' | 'horizontal';
    onFavorite?: (id: string) => void;
    isFavorited?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getStatusBadge = (status: Property['status']) => {
    switch (status) {
        case 'sold': return <Badge variant="secondary">Đã bán</Badge>;
        case 'rented': return <Badge variant="secondary">Đã cho thuê</Badge>;
        case 'pending': return <Badge className="bg-yellow-500 text-white">Chờ duyệt</Badge>;
        case 'rejected': return <Badge className="bg-red-500 text-white">Bị từ chối</Badge>;
        default: return null;
    }
};

// ─── Component ─────────────────────────────────────────────────────────────────
export const PropertyCard = ({
    property,
    variant = 'default',
    onFavorite,
    isFavorited = false,
}: PropertyCardProps) => {
    const primaryImage = property.images?.find(img => img.is_primary) ?? property.images?.[0];
    const imgSrc = primaryImage?.url || primaryImage?.image_url;

    // ── Shared: image block ─────────────────────────────────────────────────────
    const ImageBlock = ({ className = '' }: { className?: string }) => (
        <div className={cn('relative overflow-hidden bg-muted', className)}>
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt={property.title}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
            ) : (
                <div className="flex items-center justify-center w-full h-full">
                    <Home className="w-12 h-12 text-muted-foreground opacity-40" />
                </div>
            )}

            {/* Left badges */}
            <div className="absolute flex gap-1.5 left-3 top-3">
                <Badge className={cn(
                    'font-semibold',
                    property.listing_type === 'sale'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                )}>
                    {property.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}
                </Badge>
                {property.is_featured && (
                    <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Nổi bật</Badge>
                )}
            </div>

            {/* Right: status */}
            {property.status !== 'active' && (
                <div className="absolute right-3 top-3">{getStatusBadge(property.status)}</div>
            )}
        </div>
    );

    // ── Shared: details row ─────────────────────────────────────────────────────
    const DetailRow = () => (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                {formatArea(property.area)}
            </span>
            {property.bedrooms && (
                <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms} PN
                </span>
            )}
            {property.bathrooms && (
                <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms} WC
                </span>
            )}
        </div>
    );

    // ── Variant: horizontal ─────────────────────────────────────────────────────
    if (variant === 'horizontal') {
        return (
            <div className={cn(
                'group flex overflow-hidden transition-all border rounded-xl bg-card hover:shadow-md',
                property.listing_type === 'sale' ? 'border-t-[3px] border-t-blue-500' : 'border-t-[3px] border-t-emerald-500'
            )}>
                {/* Image */}
                <Link to={`/properties/${property.id}`} className="relative flex-shrink-0 w-56 sm:w-64">
                    <ImageBlock className="aspect-[4/3] h-full" />
                </Link>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4 min-w-0">
                    {/* Price */}
                    <div className="mb-1">
                        <span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span>
                        {property.area > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                {formatPrice(Math.round(property.price / property.area))}/m²
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <Link to={`/properties/${property.id}`}>
                        <h3 className="mb-1.5 text-sm font-semibold line-clamp-2 text-foreground hover:text-primary transition-colors lg:text-base">
                            {property.title}
                        </h3>
                    </Link>

                    {/* Location */}
                    <div className="flex items-center mb-2 text-sm text-muted-foreground">
                        <MapPin className="flex-shrink-0 w-4 h-4 mr-1" />
                        <span className="line-clamp-1">
                            {property.district && `${property.district}, `}{property.city}
                        </span>
                    </div>

                    {/* Details */}
                    <DetailRow />

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />{property.view_count || 0}
                            </span>
                            {property.created_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(property.created_at).toLocaleDateString('vi-VN')}
                                </span>
                            )}
                        </div>
                        {onFavorite && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn('h-8 w-8', isFavorited && 'text-red-500')}
                                onClick={e => { e.preventDefault(); onFavorite(property.id); }}
                            >
                                <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Variant: default (vertical card) ────────────────────────────────────────
    return (
        <Link
            to={`/properties/${property.id}`}
            className={cn(
                'flex flex-col overflow-hidden transition-all border group rounded-xl bg-card hover:shadow-lg',
                property.listing_type === 'sale' ? 'border-t-[3px] border-t-blue-500' : 'border-t-[3px] border-t-emerald-500'
            )}
        >
            {/* Image */}
            <div className="relative">
                <ImageBlock className="aspect-[4/3]" />
                {/* Floating favorite button */}
                {onFavorite && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => { e.preventDefault(); onFavorite(property.id); }}
                        className={cn(
                            'absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm',
                            isFavorited && 'text-red-500'
                        )}
                    >
                        <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4">
                {/* Price */}
                <div className="mb-2">
                    <span className="text-xl font-bold text-primary">{formatPrice(property.price)}</span>
                    {property.area > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                            {formatPrice(Math.round(property.price / property.area))}/m²
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="mb-2 text-sm font-semibold line-clamp-2 text-foreground transition-colors group-hover:text-primary lg:text-base">
                    {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center mb-3 text-sm text-muted-foreground">
                    <MapPin className="flex-shrink-0 w-4 h-4 mr-1" />
                    <span className="line-clamp-1">
                        {property.district && `${property.district}, `}{property.city}
                    </span>
                </div>

                {/* Details */}
                <DetailRow />

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {property.view_count !== undefined && (
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />{property.view_count || 0}
                            </span>
                        )}
                        {property.created_at && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(property.created_at).toLocaleDateString('vi-VN')}
                            </span>
                        )}
                    </div>
                    {property.property_code && (
                        <span>#{property.property_code}</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default PropertyCard;
