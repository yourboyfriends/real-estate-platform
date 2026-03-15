import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '../../types';
import { ExternalLink } from 'lucide-react';

// Fix leaflet default marker icons (common issue with webpack/vite bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icon: BĐS hiện tại (đỏ)
const primaryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Custom icon: BĐS xung quanh (xanh dương)
const nearbyIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowSize: [32, 32],
});

// Helper: format giá
const formatPrice = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} triệu`;
    return price.toLocaleString('vi-VN') + ' đ';
};

// Helper: lấy ảnh chính
const getPrimaryImage = (property: Property) => {
    const primary = property.images?.find((img) => img.is_primary);
    return primary?.url || primary?.image_url || property.images?.[0]?.url || null;
};

// Component auto-set view khi center thay đổi
const SetMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

interface PropertyMapProps {
    /** Tọa độ trung tâm (BĐS chính) */
    center: { lat: number; lng: number };
    /** BĐS chính (hiển thị marker đỏ) */
    mainProperty?: Property;
    /** BĐS xung quanh (hiển thị marker xanh) */
    nearbyProperties?: Property[];
    height?: string;
    zoom?: number;
    className?: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
    center,
    mainProperty,
    nearbyProperties = [],
    height = '420px',
    zoom = 15,
    className = '',
}) => {
    return (
        <div
            className={`relative rounded-xl overflow-hidden border border-gray-200 shadow-md ${className}`}
            style={{ height }}
        >
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <SetMapView center={[center.lat, center.lng]} zoom={zoom} />

                {/* OpenStreetMap tile layer */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker BĐS chính */}
                {mainProperty && (
                    <Marker position={[center.lat, center.lng]} icon={primaryIcon}>
                        <Popup maxWidth={260}>
                            <PropertyPopupContent property={mainProperty} isMain />
                        </Popup>
                    </Marker>
                )}

                {/* Markers BĐS xung quanh */}
                {nearbyProperties.map((prop) => {
                    if (!prop.latitude || !prop.longitude) return null;
                    if (prop.id === mainProperty?.id) return null;
                    return (
                        <Marker
                            key={prop.id}
                            position={[prop.latitude, prop.longitude]}
                            icon={nearbyIcon}
                        >
                            <Popup maxWidth={240}>
                                <PropertyPopupContent property={prop} isMain={false} />
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000] text-xs flex flex-col gap-1.5">
                {mainProperty && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">BĐS này</span>
                    </div>
                )}
                {nearbyProperties.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="text-gray-700">BĐS lân cận ({nearbyProperties.filter(p => p.id !== mainProperty?.id && p.latitude && p.longitude).length})</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Component Popup nội dung
const PropertyPopupContent: React.FC<{ property: Property; isMain: boolean }> = ({ property, isMain }) => {
    const image = getPrimaryImage(property);
    return (
        <div className="min-w-[200px]">
            {image && (
                <img
                    src={image}
                    alt={property.title}
                    className="w-full h-28 object-cover rounded mb-2"
                />
            )}
            <div className={`text-xs font-semibold mb-0.5 ${isMain ? 'text-red-600' : 'text-blue-600'}`}>
                {isMain ? '📍 BĐS này' : '🏠 BĐS lân cận'}
            </div>
            <div className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                {property.title}
            </div>
            <div className="text-xs text-gray-500 mb-1 line-clamp-1">
                {[property.address, property.district, property.city].filter(Boolean).join(', ')}
            </div>
            <div className="text-sm font-bold text-primary-600 mb-2">
                {formatPrice(property.price)}
                <span className="text-xs font-normal text-gray-500 ml-1">· {property.area} m²</span>
            </div>
            <a
                href={`/properties/${property.id}`}
                className="flex items-center gap-1 text-xs text-white bg-primary-600 hover:bg-primary-700 px-2 py-1 rounded transition-colors"
                target="_blank"
                rel="noopener noreferrer"
            >
                <ExternalLink className="w-3 h-3" />
                Xem chi tiết
            </a>
        </div>
    );
};

export default PropertyMap;
