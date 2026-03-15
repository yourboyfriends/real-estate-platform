/**
 * AddressGeocodingInput – Split Layout
 *
 * Layout: [Ô nhập liệu + thông tin] | [Drag handle] | [Bản đồ Leaflet]
 *
 * Tính năng:
 *  - Nhập địa chỉ → debounce → Nominatim API → gợi ý dropdown → flyTo
 *  - Bản đồ có marker có thể kéo (draggable) để sửa vị trí chính xác
 *  - Drag handle để resize bản đồ rộng/hẹp
 *  - Hiển thị các BĐS xung quanh (marker xanh) qua propertiesApi.getNearby
 *  - Bản đồ luôn hiển thị, không cần chọn mới mở
 */
import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import {
    MapPin,
    Search,
    Loader2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    GripVertical,
} from 'lucide-react';
import { propertiesApi } from '../../api/properties';
import { Property } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NominatimResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        county?: string;
        suburb?: string;
        quarter?: string;
    };
}

export interface LocationData {
    address: string;
    latitude: number;
    longitude: number;
    displayName: string;
    city?: string;
    district?: string;
    ward?: string;
}

interface AddressGeocodingInputProps {
    onLocationChange: (data: LocationData) => void;
    defaultValue?: string;
    label?: string;
    required?: boolean;
}

// ─── Parse Nominatim result ───────────────────────────────────────────────────

function parseLocation(result: NominatimResult): LocationData {
    const a = result.address ?? {};
    const rawCity = a.city ?? a.town ?? a.state ?? a.county ?? '';
    return {
        address: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        city: rawCity.replace('Thành phố ', '').replace('Tỉnh ', ''),
        district: a.county ?? a.suburb ?? '',
        ward: a.quarter ?? a.village ?? a.suburb ?? '',
    };
}

// ─── Format VND ──────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} triệu`;
    return price.toLocaleString('vi-VN');
}

// ─── Default Vietnam center ───────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = [16.047079, 108.206230]; // Đà Nẵng
const DEFAULT_ZOOM = 6;

// ─── Main Component ───────────────────────────────────────────────────────────

const AddressGeocodingInput: React.FC<AddressGeocodingInputProps> = ({
    onLocationChange,
    defaultValue = '',
    label = 'Địa chỉ',
    required = false,
}) => {
    // ── State ─────────────────────────────────────────────────────────────────
    const [query, setQuery] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [selected, setSelected] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [nearbyProps, setNearbyProps] = useState<Property[]>([]);

    // Resizable split: leftPct = % width of left panel (form)
    const [leftPct, setLeftPct] = useState(42);
    const isDraggingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Leaflet refs
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);           // L.Map
    const pinMarkerRef = useRef<any>(null);     // L.Marker (draggable)
    const nearbyLayerRef = useRef<any>(null);   // L.LayerGroup

    // Misc refs
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // ── Close dropdown on outside click ──────────────────────────────────────
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // ── Init Leaflet map (once) ───────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        let L: any;
        const init = async () => {
            L = await import('leaflet');

            // Fix default icon
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(mapContainerRef.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Nearby layer group
            nearbyLayerRef.current = L.layerGroup().addTo(map);

            mapRef.current = map;
        };

        init();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                pinMarkerRef.current = null;
                nearbyLayerRef.current = null;
            }
        };
    }, []);

    // ── Resize observer: invalidate map size when panel resizes ──────────────
    useEffect(() => {
        if (!mapContainerRef.current) return;
        const ro = new ResizeObserver(() => {
            mapRef.current?.invalidateSize();
        });
        ro.observe(mapContainerRef.current);
        return () => ro.disconnect();
    }, []);

    // ── Place / move draggable pin ────────────────────────────────────────────
    const placePinOnMap = useCallback(async (lat: number, lng: number, loc: LocationData, zoom = 15) => {
        const map = mapRef.current;
        if (!map) return;

        const L = (await import('leaflet')).default ?? (await import('leaflet'));

        // Red pulsing icon for selected property
        const redIcon = L.divIcon({
            html: `<div style="
                background:#e8354a;
                width:26px;height:26px;border-radius:50%;
                border:3px solid #fff;
                box-shadow:0 3px 12px rgba(232,53,74,0.55);
                cursor:grab;
            "></div>
            <div style="
                position:absolute;top:-4px;left:50%;transform:translateX(-50%);
                width:34px;height:34px;border-radius:50%;
                border:2px solid rgba(232,53,74,0.35);
                animation:geocodePulse 2s infinite;
                pointer-events:none;
            "></div>
            <style>
                @keyframes geocodePulse{0%,100%{transform:translateX(-50%) scale(1);opacity:0.7;}50%{transform:translateX(-50%) scale(1.4);opacity:0;}}
            </style>`,
            className: '',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
        });

        if (!pinMarkerRef.current) {
            const marker = L.marker([lat, lng], { icon: redIcon, draggable: true }).addTo(map);
            marker.bindPopup(`
                <div style="min-width:160px;font-size:13px">
                    <strong style="display:block;margin-bottom:4px">📍 Vị trí được chọn</strong>
                    <span style="color:#666;font-size:11px">${loc.address.slice(0, 80)}...</span>
                    <br/><span style="font-family:monospace;font-size:10px;color:#888">
                        ${lat.toFixed(5)}, ${lng.toFixed(5)}
                    </span>
                </div>
            `);

            marker.on('dragend', (e: any) => {
                const { lat: newLat, lng: newLng } = e.target.getLatLng();
                const updated: LocationData = { ...loc, latitude: newLat, longitude: newLng };
                setSelected(updated);
                onLocationChange(updated);
                // Fetch nearby for new position
                fetchNearby(newLat, newLng);
            });

            pinMarkerRef.current = marker;
        } else {
            pinMarkerRef.current.setLatLng([lat, lng]);
            pinMarkerRef.current.setIcon(redIcon);
        }

        map.flyTo([lat, lng], zoom, { duration: 1.0 });
    }, [onLocationChange]);

    // ── Fetch nearby properties ───────────────────────────────────────────────
    const fetchNearby = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await propertiesApi.getNearby(lat, lng, undefined, undefined, undefined);
            if (res?.data) setNearbyProps(res.data);
        } catch {
            // silently ignore – not critical
        }
    }, []);

    // ── Draw nearby markers on map ────────────────────────────────────────────
    useEffect(() => {
        if (!nearbyLayerRef.current || !mapRef.current) return;
        const layer = nearbyLayerRef.current;
        layer.clearLayers();

        if (nearbyProps.length === 0) return;

        const L_promise = import('leaflet');
        L_promise.then((mod) => {
            const L = mod.default ?? mod;

            const blueIcon = L.divIcon({
                html: `<div style="
                    background:#3b82f6;width:16px;height:16px;border-radius:50%;
                    border:2px solid #fff;box-shadow:0 2px 6px rgba(59,130,246,0.5);
                "></div>`,
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });

            nearbyProps.forEach((p) => {
                if (!p.latitude || !p.longitude) return;
                const thumb =
                    (p as any).images?.find((i: any) => i.is_primary)?.thumbnail_url ??
                    (p as any).images?.[0]?.thumbnail_url ?? '';

                const marker = L.marker([p.latitude, p.longitude], { icon: blueIcon });
                marker.bindPopup(`
                    <div style="min-width:200px;font-size:12px">
                        ${thumb ? `<img src="${thumb}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:6px"/>` : ''}
                        <strong style="font-size:13px;line-height:1.3;display:block">${p.title}</strong>
                        <span style="color:#e8354a;font-weight:600;display:block;margin:3px 0">
                            ${formatPrice(p.price)} VNĐ
                        </span>
                        <span style="color:#888">${p.area} m² · ${p.city}</span>
                        <br/>
                        <a href="/properties/${p.id}" target="_blank"
                           style="display:inline-block;margin-top:6px;padding:3px 8px;background:#e8354a;
                                  color:#fff;border-radius:4px;text-decoration:none;font-size:11px">
                            Xem chi tiết →
                        </a>
                    </div>
                `, { maxWidth: 220 });
                marker.addTo(layer);
            });
        });
    }, [nearbyProps]);

    // ── Nominatim search ──────────────────────────────────────────────────────
    const searchAddress = useCallback(async (q: string) => {
        if (q.trim().length < 5) { setSuggestions([]); return; }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                q,
                format: 'json',
                countrycodes: 'vn',
                limit: '6',
                addressdetails: '1',
                'accept-language': 'vi,en',
            });
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                { headers: { 'User-Agent': 'RealEstateApp/1.0', 'Accept-Language': 'vi,en' } }
            );
            const data: NominatimResult[] = await res.json();
            if (data.length === 0) {
                setError('Không tìm thấy địa chỉ. Hãy nhập chi tiết hơn.');
                setSuggestions([]);
            } else {
                setSuggestions(data);
                setShowSuggestions(true);
                setError(null);
            }
        } catch {
            setError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Handle input change with debounce ─────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setError(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length >= 5) {
            debounceRef.current = setTimeout(() => searchAddress(val), 900);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            searchAddress(query.trim());
        }
    };

    // ── Select suggestion ─────────────────────────────────────────────────────
    const handleSelect = (result: NominatimResult) => {
        const loc = parseLocation(result);
        setQuery(result.display_name);
        setSelected(loc);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationChange(loc);
        placePinOnMap(loc.latitude, loc.longitude, loc, 15);
        fetchNearby(loc.latitude, loc.longitude);
    };

    // ── Apply manual coords ───────────────────────────────────────────────────
    const handleApplyManual = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (isNaN(lat) || isNaN(lng)) return;
        const loc: LocationData = {
            address: query || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            latitude: lat,
            longitude: lng,
            displayName: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
        setSelected(loc);
        onLocationChange(loc);
        placePinOnMap(lat, lng, loc, 15);
        fetchNearby(lat, lng);
    };

    // ── Drag-to-resize handle ─────────────────────────────────────────────────
    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;

        const onMove = (ev: MouseEvent) => {
            if (!containerRef.current || !isDraggingRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((ev.clientX - rect.left) / rect.width) * 100;
            setLeftPct(Math.min(75, Math.max(25, pct)));
        };

        const onUp = () => {
            isDraggingRef.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-2">
            {/* Label */}
            <label className="block text-sm font-medium text-gray-700">
                <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    {label}
                    {required && <span className="text-red-500">*</span>}
                    <span className="text-xs font-normal text-gray-400">
                        — nhập rồi chọn gợi ý · kéo ghim để sửa vị trí chính xác
                    </span>
                </span>
            </label>

            {/* ── Split container ── */}
            <div
                ref={containerRef}
                className="flex rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                style={{ height: '420px', minHeight: '300px' }}
            >
                {/* ── LEFT: form panel ── */}
                <div
                    className="flex flex-col overflow-y-auto bg-white"
                    style={{ width: `${leftPct}%`, minWidth: '240px' }}
                >
                    {/* Search input */}
                    <div ref={wrapperRef} className="relative p-3 border-b border-gray-100">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder="Nhập địa chỉ, tên đường, quận..."
                                    autoComplete="off"
                                    className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-xs
                                               focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                                {loading && (
                                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-500 animate-spin" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => searchAddress(query.trim())}
                                disabled={loading || query.trim().length < 5}
                                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium
                                           hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                                           transition-colors flex items-center gap-1"
                            >
                                {loading
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Search className="w-3.5 h-3.5" />
                                }
                                Tìm
                            </button>
                        </div>

                        {/* Suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 top-full left-3 right-3 mt-0.5 bg-white border
                                            border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 border-b">
                                    {suggestions.length} kết quả – chọn địa chỉ:
                                </div>
                                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.place_id}
                                            type="button"
                                            onClick={() => handleSelect(s)}
                                            className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3 h-3 text-primary-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-800 leading-snug line-clamp-2">
                                                        {s.display_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        {parseFloat(s.lat).toFixed(4)}, {parseFloat(s.lon).toFixed(4)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && !loading && (
                        <div className="mx-3 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg
                                        text-xs text-red-600 flex items-center gap-1.5">
                            <span>❌</span> {error}
                        </div>
                    )}

                    {/* Selected info */}
                    {selected && (
                        <div className="m-3 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-xs font-semibold text-green-700">Đã xác định vị trí</span>
                            </div>
                            <div className="space-y-1 pl-5 text-xs">
                                {selected.city && (
                                    <div className="text-gray-700">
                                        <span className="text-gray-500">Thành phố:</span>{' '}
                                        <span className="font-medium">{selected.city}</span>
                                    </div>
                                )}
                                {selected.district && (
                                    <div className="text-gray-700">
                                        <span className="text-gray-500">Quận/Huyện:</span>{' '}
                                        <span className="font-medium">{selected.district}</span>
                                    </div>
                                )}
                                {selected.ward && (
                                    <div className="text-gray-700">
                                        <span className="text-gray-500">Phường/Xã:</span>{' '}
                                        <span className="font-medium">{selected.ward}</span>
                                    </div>
                                )}
                                <div className="text-gray-500 font-mono text-[10px]">
                                    📍 {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nearby count */}
                    {nearbyProps.length > 0 && (
                        <div className="mx-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                            🏠 <strong>{nearbyProps.length}</strong> BĐS xung quanh (●&nbsp;xanh trên bản đồ)
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mx-3 mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] text-gray-500 space-y-1">
                        <p className="font-medium text-gray-600">Hướng dẫn:</p>
                        <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                            <li>Nhập địa chỉ đầy đủ → chọn gợi ý</li>
                            <li>Kéo <strong>ghim đỏ</strong> để chỉnh xác vị trí</li>
                            <li>Kéo <strong>thanh giữa</strong> để phóng to bản đồ</li>
                        </ol>
                    </div>

                    {/* Manual coords */}
                    <div className="border-t border-gray-100 mt-auto">
                        <button
                            type="button"
                            onClick={() => setShowManual(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50
                                       transition-colors text-xs font-medium text-gray-500"
                        >
                            <span>⚙️ Nhập tọa độ thủ công</span>
                            {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {showManual && (
                            <div className="px-3 pb-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Latitude</label>
                                        <input
                                            type="number" step="0.000001"
                                            value={manualLat}
                                            onChange={e => setManualLat(e.target.value)}
                                            placeholder="10.7769"
                                            className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2
                                                       focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Longitude</label>
                                        <input
                                            type="number" step="0.000001"
                                            value={manualLng}
                                            onChange={e => setManualLng(e.target.value)}
                                            placeholder="106.7009"
                                            className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2
                                                       focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApplyManual}
                                    disabled={!manualLat || !manualLng}
                                    className="w-full py-1.5 bg-primary-600 text-white text-xs rounded-lg
                                               hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Drag handle ── */}
                <div
                    onMouseDown={startResize}
                    className="flex-shrink-0 w-4 bg-gray-100 hover:bg-primary-100 border-x border-gray-200
                               cursor-col-resize flex items-center justify-center select-none transition-colors"
                    title="Kéo để thay đổi kích thước"
                >
                    <GripVertical className="w-3 h-3 text-gray-400" />
                </div>

                {/* ── RIGHT: map ── */}
                <div className="relative flex-1 min-w-0">
                    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

                    {/* Map overlay hint */}
                    {!selected && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 shadow text-center">
                                <MapPin className="w-6 h-6 text-primary-400 mx-auto mb-1" />
                                <p className="text-sm font-medium text-gray-600">Nhập địa chỉ để xem vị trí</p>
                                <p className="text-xs text-gray-400 mt-0.5">Ghim đỏ có thể kéo để điều chỉnh</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressGeocodingInput;
export type { AddressGeocodingInputProps };
