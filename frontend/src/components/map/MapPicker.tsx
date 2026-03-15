import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Navigation, Search } from 'lucide-react';
import { useGeocoding } from '../../hooks/useGeocoding';
import { propertiesApi } from '../../api/properties';
import { Property } from '../../types';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icon đánh dấu vị trí đã chọn (màu xanh lá)
const pickerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Icon BĐS xung quanh (màu xanh dương)
const nearbyIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowSize: [32, 32],
});

const formatPrice = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} triệu`;
    return price.toLocaleString('vi-VN') + ' đ';
};

// Mặc định: Hà Nội
const DEFAULT_CENTER: [number, number] = [21.0285, 105.8542];
const DEFAULT_ZOOM = 13;

export interface MapCoordinates {
    lat: number;
    lng: number;
}

// ── FlyTo controller (child inside MapContainer) ──────────────────────────────
interface FlyToProps {
    target: [number, number] | null;
    zoom?: number;
}
const FlyToController: React.FC<FlyToProps> = ({ target, zoom = 16 }) => {
    const map = useMap();
    useEffect(() => {
        if (!target || isNaN(target[0]) || isNaN(target[1])) return;
        // Use rAF so the browser has painted and the container has real pixel
        // dimensions before Leaflet tries to project/unproject coordinates.
        // flyTo() spawns its own rAF which reads the container while it may
        // still be 0×0 — that's the root cause of the NaN crash.
        const raf = requestAnimationFrame(() => {
            try {
                map.invalidateSize(); // re-measure container
                map.setView(target, zoom, { animate: true, duration: 0.8 });
            } catch {
                // ignore if map removed from DOM
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [target, zoom, map]);
    return null;
};

// ── Draggable marker ──────────────────────────────────────────────────────────
interface DragMarkerProps {
    position: [number, number];
    onDrag: (lat: number, lng: number) => void;
}
const DraggableMarker: React.FC<DragMarkerProps> = ({ position, onDrag }) => {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const pos = marker.getLatLng();
                onDrag(pos.lat, pos.lng);
            }
        },
    };
    return (
        <Marker
            draggable
            eventHandlers={eventHandlers}
            position={position}
            icon={pickerIcon}
            ref={markerRef}
        />
    );
};

// ── Click handler ─────────────────────────────────────────────────────────────
const ClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            if (!isNaN(lat) && !isNaN(lng)) {
                onClick(lat, lng);
            }
        },
    });
    return null;
};

// ── Main props ────────────────────────────────────────────────────────────────
interface MapPickerProps {
    initialLat?: number;
    initialLng?: number;
    /** Set this from outside to fly the map to a geocoded location */
    centerTarget?: [number, number] | null;
    onChange: (coords: MapCoordinates, address?: string) => void;
    height?: string;
    className?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
    initialLat,
    initialLng,
    centerTarget,
    onChange,
    height = '380px',
    className = '',
}) => {
    const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
    const [fetchingAddress, setFetchingAddress] = useState(false);
    const [displayAddress, setDisplayAddress] = useState<string>('');
    const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    const { reverseGeocode } = useGeocoding();

    // When external centerTarget changes (e.g. cascade geocode), fly the map there
    useEffect(() => {
        if (centerTarget && !isNaN(centerTarget[0]) && !isNaN(centerTarget[1])) {
            setSelectedPosition(centerTarget);
            setFlyTarget(centerTarget);
        }
    }, [centerTarget]);

    // Close dropdown on outside click
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // ── Position select (click or drag) ─────────────────────────────────────
    const handlePositionSelect = useCallback(
        async (lat: number, lng: number) => {
            setSelectedPosition([lat, lng]);
            setFlyTarget([lat, lng]);
            setFetchingAddress(true);
            const address = await reverseGeocode(lat, lng);
            setDisplayAddress(address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            onChange({ lat, lng }, address ?? undefined);
            setFetchingAddress(false);

            // Fetch nearby properties (fire-and-forget)
            propertiesApi.getNearby(lat, lng)
                .then(res => { if (res.success && res.data) setNearbyProperties(res.data); })
                .catch(() => { /* ignore */ });
        },
        [onChange, reverseGeocode]
    );

    // Sync initial coords
    useEffect(() => {
        if (initialLat && initialLng && !selectedPosition) {
            setSelectedPosition([initialLat, initialLng]);
        }
    }, [initialLat, initialLng]);

    // ── Search with Nominatim ────────────────────────────────────────────────
    const fetchSuggestions = async (q: string) => {
        if (q.trim().length < 4) { setSuggestions([]); return; }
        setSearching(true);
        setSearchError('');
        try {
            const params = new URLSearchParams({
                q, format: 'json', countrycodes: 'vn', limit: '6', 'accept-language': 'vi,en',
            });
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                { headers: { 'User-Agent': 'RealEstateApp/1.0' } }
            );
            const data = await res.json();
            if (data.length === 0) {
                setSearchError('Không tìm thấy địa chỉ');
                setSuggestions([]);
            } else {
                setSuggestions(data);
                setShowSuggestions(true);
            }
        } catch {
            setSearchError('Lỗi kết nối');
        } finally {
            setSearching(false);
        }
    };

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        setSearchError('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 800);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            fetchSuggestions(searchQuery.trim());
        }
    };

    const handleSelectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
        const lat = parseFloat(s.lat);
        const lng = parseFloat(s.lon);
        setSearchQuery(s.display_name);
        setSuggestions([]);
        setShowSuggestions(false);
        handlePositionSelect(lat, lng);
    };

    // ── GPS ──────────────────────────────────────────────────────────────────
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => handlePositionSelect(pos.coords.latitude, pos.coords.longitude),
            () => { }
        );
    };

    const center: [number, number] = selectedPosition ?? DEFAULT_CENTER;

    return (
        <div className={`space-y-3 ${className}`}>

            {/* ── Search bar ── */}
            <div ref={searchWrapperRef} className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchInput}
                            onKeyDown={handleSearchKeyDown}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            placeholder="Tìm địa chỉ... VD: 123 Nguyễn Huệ, Quận 1"
                            autoComplete="off"
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                                       focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                        {searching && (
                            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (debounceRef.current) clearTimeout(debounceRef.current);
                            fetchSuggestions(searchQuery.trim());
                        }}
                        disabled={searching || searchQuery.trim().length < 4}
                        className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg font-medium
                                   hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                                   transition-colors flex items-center gap-1.5"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Tìm
                    </button>
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        title="Vị trí hiện tại"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 font-medium
                                   border border-primary-300 bg-primary-50 hover:bg-primary-100
                                   rounded-lg transition-colors"
                    >
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">GPS</span>
                    </button>
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-white border
                                    border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 border-b">
                            {suggestions.length} kết quả — chọn một địa chỉ:
                        </div>
                        <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-primary-50 transition-colors flex items-start gap-2"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-800 leading-snug line-clamp-2">
                                            {s.display_name}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                            {parseFloat(s.lat).toFixed(5)}, {parseFloat(s.lon).toFixed(5)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search error */}
                {searchError && !searching && (
                    <p className="mt-1 text-xs text-red-500">{searchError}</p>
                )}
            </div>

            {/* Info bar */}
            <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-green-600" />
                    {selectedPosition ? (
                        <span>
                            <span className="font-medium text-gray-700">
                                {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                            </span>
                            {fetchingAddress && (
                                <Loader2 className="w-3 h-3 ml-2 animate-spin inline" />
                            )}
                        </span>
                    ) : (
                        <span className="italic text-gray-400 text-xs">
                            Tìm kiếm hoặc nhấp vào bản đồ để chọn vị trí
                        </span>
                    )}
                </p>
            </div>

            {/* Map */}
            <div
                className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300
                           hover:border-primary-400 transition-colors cursor-crosshair"
                style={{ height }}
            >
                <MapContainer
                    center={center}
                    zoom={selectedPosition ? 15 : DEFAULT_ZOOM}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* FlyTo controller */}
                    <FlyToController target={flyTarget} />

                    <ClickHandler onClick={handlePositionSelect} />

                    {/* Nearby property markers (blue) */}
                    {nearbyProperties.map((prop) => {
                        if (!prop.latitude || !prop.longitude) return null;
                        const img = prop.images?.find(i => i.is_primary)?.url
                            || prop.images?.[0]?.url
                            || prop.images?.[0]?.image_url;
                        return (
                            <Marker
                                key={prop.id}
                                position={[prop.latitude, prop.longitude]}
                                icon={nearbyIcon}
                            >
                                <Popup maxWidth={220}>
                                    <div className="min-w-[180px]" style={{ minWidth: 180 }}>
                                        {img && (
                                            <img src={img} alt={prop.title}
                                                style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
                                        )}
                                        <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginBottom: 2 }}>
                                            🏠 BĐS lân cận
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.3, marginBottom: 4 }}>
                                            {prop.title}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                                            {formatPrice(prop.price)}
                                            <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>
                                                · {prop.area} m²
                                            </span>
                                        </div>
                                        <a href={`/properties/${prop.id}`} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                fontSize: 11, color: '#fff', background: '#2563eb',
                                                padding: '3px 8px', borderRadius: 4, textDecoration: 'none'
                                            }}>
                                            Xem chi tiết ↗
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Main position marker (green) */}
                    {selectedPosition && (
                        <DraggableMarker
                            position={selectedPosition}
                            onDrag={handlePositionSelect}
                        />
                    )}
                </MapContainer>

                {/* Instruction overlay */}
                {!selectedPosition && (
                    <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg text-center">
                            <MapPin className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-700">Tìm kiếm hoặc nhấp vào bản đồ</p>
                            <p className="text-xs text-gray-500">để đặt vị trí bất động sản</p>
                        </div>
                    </div>
                )}

                {/* Legend */}
                {selectedPosition && (
                    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000] text-xs flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">Vị trí đã chọn</span>
                        </div>
                        {nearbyProperties.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                                <span className="text-gray-700">BĐS lân cận ({nearbyProperties.filter(p => p.latitude && p.longitude).length})</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reverse geocoded address */}
            {displayAddress && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="font-medium text-gray-700">Địa chỉ gần nhất: </span>
                    {displayAddress}
                </p>
            )}
        </div>
    );
};

export default MapPicker;
