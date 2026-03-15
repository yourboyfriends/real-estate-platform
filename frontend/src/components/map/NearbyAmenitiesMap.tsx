/**
 * UNIFIED MAP — Bản đồ tổng hợp
 *
 * Hiển thị trên 1 bản đồ duy nhất:
 *  🔴 Marker đỏ  → BĐS đang xem
 *  🔵 Marker xanh → BĐS lân cận (từ API properties)
 *  🟡 Marker màu  → Tiện ích (trường, bệnh viện, siêu thị...)
 *
 * Sidebar bên trái:
 *  - Nút chọn bán kính tìm kiếm tiện ích
 *  - Checkbox filter loại tiện ích
 *  - Danh sách tiện ích kèm khoảng cách
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink } from 'lucide-react';

import {
    fetchMultipleAmenities,
    AMENITY_CATEGORIES,
    getCategoryByType,
    type AmenityType,
} from '../../utils/overpassAPI';
import {
    addDistanceToAmenities,
    sortByDistance,
    type AmenityWithDistance,
} from '../../utils/distance';
import { cn } from '../../lib/utils';
import { Property } from '../../types';
import { formatPrice } from '../../utils/helper';

// ─── Leaflet icon fix (Vite bundler) ─────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Leaflet Icons ────────────────────────────────────────────────────────────────

/** Marker BĐS đang xem — đỏ, lớn, nổi bật */
const PRIMARY_ICON = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/** Marker BĐS lân cận — xanh dương, nhỏ hơn */
const NEARBY_ICON = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowSize: [32, 32],
});

/** Tạo circular icon cho tiện ích — màu theo loại */
function createAmenityIcon(type: string): L.DivIcon {
    const cat = getCategoryByType(type);
    return L.divIcon({
        html: `<div style="
      background:${cat?.color ?? '#6b7280'};
      width:28px;height:28px;border-radius:50%;
      border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;box-shadow:0 2px 5px rgba(0,0,0,0.3);
    ">${cat?.icon ?? '📍'}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────────

/** Auto-recenter map khi center prop thay đổi */
const SetMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
    return null;
};

/** Popup nội dung cho BĐS */
const PropertyPopup: React.FC<{ property: Property; isMain: boolean }> = ({ property, isMain }) => {
    const img = property.images?.find(i => i.is_primary)?.url
        || property.images?.[0]?.url
        || property.images?.[0]?.image_url;

    return (
        <div style={{ minWidth: 200 }}>
            {img && <img src={img} alt={property.title} className="w-full h-24 object-cover rounded mb-2" />}
            <p className={`text-xs font-semibold mb-0.5 ${isMain ? 'text-red-600' : 'text-blue-600'}`}>
                {isMain ? '📍 BĐS này' : '🏠 BĐS lân cận'}
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
                {property.title}
            </p>
            <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                {[property.address, property.district, property.city].filter(Boolean).join(', ')}
            </p>
            <p className="text-sm font-bold text-primary mb-2">
                {formatPrice(property.price)}
                <span className="text-xs font-normal text-gray-500 ml-1">· {property.area} m²</span>
            </p>
            {!isMain && (
                <a
                    href={`/properties/${property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                >
                    <ExternalLink className="w-3 h-3" /> Xem chi tiết
                </a>
            )}
        </div>
    );
};

// ─── Types ────────────────────────────────────────────────────────────────────────

interface Props {
    propertyLat: number;
    propertyLng: number;
    propertyName?: string;
    mainProperty?: Property;
    nearbyProperties?: Property[];
}

// ─── Config ───────────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [500, 1000, 2000, 3000, 5000];

// ─── Main Component ───────────────────────────────────────────────────────────────

const NearbyAmenitiesMap: React.FC<Props> = ({
    propertyLat,
    propertyLng,
    propertyName = 'Bất động sản',
    mainProperty,
    nearbyProperties = [],
}) => {
    // ── State ────────────────────────────────────────────────────────────────────
    const [amenities, setAmenities] = useState<AmenityWithDistance[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<AmenityType[]>(['school', 'supermarket', 'hospital']);
    const [radius, setRadius] = useState(1000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNearbyBDS, setShowNearbyBDS] = useState(true);

    // ── Fetch amenities ──────────────────────────────────────────────────────────
    const loadAmenities = useCallback(async () => {
        if (!propertyLat || !propertyLng || selectedTypes.length === 0) {
            setAmenities([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const raw = await fetchMultipleAmenities(propertyLat, propertyLng, radius, selectedTypes);
            const withDist = addDistanceToAmenities(raw, propertyLat, propertyLng);
            setAmenities(sortByDistance(withDist));
        } catch {
            setError('Không thể tải dữ liệu tiện ích. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [propertyLat, propertyLng, radius, selectedTypes]);

    useEffect(() => { loadAmenities(); }, [loadAmenities]);

    // ── Derived ──────────────────────────────────────────────────────────────────
    const countByType = useMemo(() => {
        const m: Record<string, number> = {};
        for (const a of amenities) m[a.type] = (m[a.type] ?? 0) + 1;
        return m;
    }, [amenities]);

    // Số BĐS lân cận hợp lệ (có tọa độ, khác BĐS chính)
    const validNearby = nearbyProperties.filter(
        p => p.latitude && p.longitude && p.id !== mainProperty?.id
    );

    // ── Handlers ─────────────────────────────────────────────────────────────────
    function toggleType(type: AmenityType) {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

            {/* ══════════════ SIDEBAR ══════════════ */}
            <div className="space-y-3">

                {/* Toggle BĐS lân cận */}
                {validNearby.length > 0 && (
                    <div className="rounded-xl border bg-card p-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showNearbyBDS}
                                onChange={e => setShowNearbyBDS(e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                            <span className="text-sm flex-1">BĐS lân cận</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                {validNearby.length}
                            </span>
                        </label>
                    </div>
                )}

                {/* Bán kính tiện ích */}
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-medium mb-2">
                        Bán kính tiện ích:{' '}
                        <span className="text-primary font-bold">
                            {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                        </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {RADIUS_OPTIONS.map(r => (
                            <button
                                key={r}
                                onClick={() => setRadius(r)}
                                className={cn(
                                    'px-3 py-1 text-xs rounded-full border transition-colors',
                                    radius === r
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-muted border-border'
                                )}
                            >
                                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter loại tiện ích */}
                <div className="rounded-xl border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-3">Loại tiện ích</h3>
                    <div className="space-y-1.5">
                        {AMENITY_CATEGORIES.map(cat => {
                            const checked = selectedTypes.includes(cat.type as AmenityType);
                            const count = countByType[cat.type] ?? 0;
                            return (
                                <label
                                    key={cat.type}
                                    className="flex items-center gap-2.5 cursor-pointer rounded-lg p-1.5 hover:bg-muted transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleType(cat.type as AmenityType)}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    <span className="text-lg leading-none">{cat.icon}</span>
                                    <span className="text-sm flex-1">{cat.label}</span>
                                    {count > 0 && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                            {count}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Danh sách tiện ích */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <h3 className="text-sm font-semibold">Tiện ích lân cận</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{amenities.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                        {loading && (
                            <div className="p-5 text-center text-sm text-muted-foreground">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                Đang tìm kiếm...
                            </div>
                        )}
                        {!loading && error && (
                            <div className="p-4 text-center">
                                <p className="text-sm text-red-500 mb-2">{error}</p>
                                <button onClick={loadAmenities} className="text-xs text-primary hover:underline">
                                    Thử lại
                                </button>
                            </div>
                        )}
                        {!loading && !error && amenities.length === 0 && (
                            <p className="p-5 text-center text-sm text-muted-foreground">
                                Không tìm thấy tiện ích nào.<br />Thử tăng bán kính hoặc thêm loại.
                            </p>
                        )}
                        {!loading && amenities.map((a, i) => {
                            const cat = getCategoryByType(a.type);
                            return (
                                <div key={`${a.id}-${i}`} className="flex items-start gap-3 p-3 hover:bg-muted/50">
                                    <span className="text-xl flex-shrink-0 mt-0.5">{cat?.icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{a.name}</p>
                                        {a.address && (
                                            <p className="text-xs text-muted-foreground truncate">{a.address}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {a.distanceFormatted} · ~{a.walkingTime} phút đi bộ
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ══════════════ BẢN ĐỒ ══════════════ */}
            {/* isolation: isolate ngăn Leaflet z-index tràn lên navbar */}
            <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden" style={{ isolation: 'isolate' }}>
                {/* Header + legend */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2">
                    <h3 className="text-sm font-semibold">Bản đồ vị trí & tiện ích</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> BĐS này
                        </span>
                        {showNearbyBDS && validNearby.length > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> BĐS lân cận
                            </span>
                        )}
                        {amenities.length > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tiện ích
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ height: '520px', position: 'relative' }}>
                    <MapContainer
                        center={[propertyLat, propertyLng]}
                        zoom={14}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                    >
                        <SetMapView center={[propertyLat, propertyLng]} zoom={14} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Vòng tròn bán kính tiện ích */}
                        <Circle
                            center={[propertyLat, propertyLng]}
                            radius={radius}
                            pathOptions={{
                                color: '#ef4444', fillColor: '#ef4444',
                                fillOpacity: 0.07, weight: 1.5, dashArray: '6, 8',
                            }}
                        />

                        {/* 🔴 Marker BĐS chính */}
                        <Marker position={[propertyLat, propertyLng]} icon={PRIMARY_ICON}>
                            <Popup maxWidth={260}>
                                {mainProperty
                                    ? <PropertyPopup property={mainProperty} isMain />
                                    : <strong>{propertyName}</strong>
                                }
                            </Popup>
                        </Marker>

                        {/* 🔵 Markers BĐS lân cận */}
                        {showNearbyBDS && validNearby.map(prop => (
                            <Marker
                                key={prop.id}
                                position={[prop.latitude!, prop.longitude!]}
                                icon={NEARBY_ICON}
                            >
                                <Popup maxWidth={240}>
                                    <PropertyPopup property={prop} isMain={false} />
                                </Popup>
                            </Marker>
                        ))}

                        {/* 🟡 Markers tiện ích */}
                        {amenities.map((a, i) => (
                            <Marker
                                key={`am-${a.id}-${i}`}
                                position={[a.lat, a.lng]}
                                icon={createAmenityIcon(a.type)}
                            >
                                <Popup>
                                    <div style={{ minWidth: 180 }}>
                                        <p className="font-semibold text-sm mb-1">{a.name}</p>
                                        <p className="text-xs text-gray-500 mb-1">{getCategoryByType(a.type)?.label}</p>
                                        {a.address && <p className="text-xs text-gray-400 mb-1">📍 {a.address}</p>}
                                        <p className="text-xs bg-blue-50 rounded px-2 py-1">
                                            🚶 <strong>{a.distanceFormatted}</strong> · {a.walkingTime} phút đi bộ
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default NearbyAmenitiesMap;
