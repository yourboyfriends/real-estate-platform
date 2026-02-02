import { Link } from 'react-router-dom';
import { Property } from '../../types';
import { Badge } from '../ui/badge';
import { MapPin, Home, Bed, Bath, Maximize, Eye, Calendar } from 'lucide-react';
import { formatPrice, formatArea } from '../../utils/helper';

interface PropertyCardProps {
    property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
    const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0];

    const getStatusBadge = () => {
        switch (property.status) {
            case 'sold':
                return <Badge variant="secondary">Đã bán</Badge>;
            case 'rented':
                return <Badge variant="secondary">Đã cho thuê</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500">Đang xử lý</Badge>;
            default:
                return null;
        }
    };

    return (
        <Link
            to={`/properties/${property.id}`}
            className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {primaryImage ? (
                    <img
                        src={primaryImage.url || primaryImage.image_url}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Home className="h-16 w-16 text-muted-foreground" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute left-3 top-3 flex gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                        {property.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}
                    </Badge>
                    {property.is_featured && (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                            Nổi bật
                        </Badge>
                    )}
                </div>

                {/* Status Badge */}
                {property.status !== 'active' && (
                    <div className="absolute right-3 top-3">
                        {getStatusBadge()}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Price */}
                <div className="mb-2 text-2xl font-bold text-primary">
                    {formatPrice(property.price)}
                </div>

                {/* Title */}
                <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {property.title}
                </h3>

                {/* Location */}
                <div className="mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                        {property.district && `${property.district}, `}{property.city}
                    </span>
                </div>

                {/* Property Details */}
                <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <Maximize className="mr-1 h-4 w-4" />
                        <span>{formatArea(property.area)}</span>
                    </div>
                    {property.bedrooms && (
                        <div className="flex items-center">
                            <Bed className="mr-1 h-4 w-4" />
                            <span>{property.bedrooms}</span>
                        </div>
                    )}
                    {property.bathrooms && (
                        <div className="flex items-center">
                            <Bath className="mr-1 h-4 w-4" />
                            <span>{property.bathrooms}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {property.views !== undefined && (
                            <div className="flex items-center">
                                <Eye className="mr-1 h-3 w-3" />
                                <span>{property.views}</span>
                            </div>
                        )}
                        {property.created_at && (
                            <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                <span>{new Date(property.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        )}
                    </div>
                    {property.property_code && (
                        <span className="text-xs">#{property.property_code}</span>
                    )}
                </div>
            </div>
        </Link>
    );
};
