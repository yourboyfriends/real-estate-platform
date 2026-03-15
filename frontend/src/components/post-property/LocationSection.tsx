/**
 * LocationSection 
 * 1. Cascading Select Tỉnh → Quận → Xã với search 
 * 2. Auto-geocoding → bản đồ tự bay đến vị trí
 * 3. MapPicker: click-to-pin, kéo ghim, GPS, search tự do, BĐS lân cận
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import MapPicker from '../map/MapPicker';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUnit {
    code: number;
    name: string;
    full_name?: string;
}

interface LocationSectionProps {
    address: string;
    city: string;
    district: string;
    ward: string;
    latitude: string;
    longitude: string;
    onChange: (field: string, value: string) => void;
}

// ─── Vietnamese diacritic normalizer ─────────────────────────────────────────
const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ─── Searchable dropdown ──────────────────────────────────────────────────────
interface DropdownProps {
    label: string;
    required?: boolean;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    items: AdminUnit[];
    onSelect: (item: AdminUnit) => void;
    disabled?: boolean;
    loading?: boolean;
}

const SearchableDropdown: React.FC<DropdownProps> = ({
    label, required, placeholder, value, onChange, items, onSelect, disabled, loading,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!value.trim()) return items;
        const q = normalize(value);
        return items.filter(i => normalize(i.name).includes(q));
    }, [items, value]);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={ref} className="relative space-y-1.5">
            <Label>
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={e => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    disabled={disabled}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-9
                               text-sm shadow-sm placeholder:text-muted-foreground
                               focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
                               disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading
                        ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        : <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    }
                </div>
            </div>

            {open && !disabled && filtered.length > 0 && (
                <div className="absolute z-[100] w-full mt-0.5 bg-white border border-gray-200
                                rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    {filtered.map(item => (
                        <button
                            key={item.code}
                            type="button"
                            onClick={() => { onSelect(item); setOpen(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors
                                       border-b last:border-b-0 border-gray-100"
                        >
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.full_name && item.full_name !== item.name && (
                                <div className="text-[11px] text-gray-400">{item.full_name}</div>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {open && !disabled && filtered.length === 0 && value.trim() && (
                <div className="absolute z-[100] w-full mt-0.5 bg-white border border-gray-200
                                rounded-xl shadow-sm px-3 py-2.5 text-sm text-gray-400">
                    Không tìm thấy "{value}"
                </div>
            )}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
const LocationSection: React.FC<LocationSectionProps> = ({
    address, city, district, ward, latitude, longitude, onChange,
}) => {
    // ── Cascade data ────────────────────────────────────────────────────────
    const [provinces, setProvinces] = useState<AdminUnit[]>([]);
    const [districts, setDistricts] = useState<AdminUnit[]>([]);
    const [wards, setWards] = useState<AdminUnit[]>([]);

    // ── Search text (display value in inputs) ──────────────────────────────
    const [provinceText, setProvinceText] = useState(city);
    const [districtText, setDistrictText] = useState(district);
    const [wardText, setWardText] = useState(ward);

    // ── Selected codes ─────────────────────────────────────────────────────
    const [provinceCode, setProvinceCode] = useState('');
    const [districtCode, setDistrictCode] = useState('');

    // ── Loading ────────────────────────────────────────────────────────────
    const [loadingP, setLoadingP] = useState(false);
    const [loadingD, setLoadingD] = useState(false);
    const [loadingW, setLoadingW] = useState(false);

    // ── Geocoding ──────────────────────────────────────────────────────────
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const [geocodedCenter, setGeocodedCenter] = useState<[number, number] | null>(null);

    const initialLat = latitude ? parseFloat(latitude) : undefined;
    const initialLng = longitude ? parseFloat(longitude) : undefined;

    // ── Load provinces once ────────────────────────────────────────────────
    useEffect(() => {
        setLoadingP(true);
        fetch('https://provinces.open-api.vn/api/p/')
            .then(r => r.json())
            .then((data: AdminUnit[]) => setProvinces(data))
            .catch(() => { })
            .finally(() => setLoadingP(false));
    }, []);

    // ── Load districts when province changes ───────────────────────────────
    const loadDistricts = useCallback(async (code: string) => {
        if (!code) { setDistricts([]); return; }
        setLoadingD(true);
        try {
            const r = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
            const d = await r.json();
            setDistricts(d.districts ?? []);
        } catch { setDistricts([]); }
        finally { setLoadingD(false); }
    }, []);

    // ── Load wards when district changes ───────────────────────────────────
    const loadWards = useCallback(async (code: string) => {
        if (!code) { setWards([]); return; }
        setLoadingW(true);
        try {
            const r = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
            const d = await r.json();
            setWards(d.wards ?? []);
        } catch { setWards([]); }
        finally { setLoadingW(false); }
    }, []);

    // ── Geocode whenever province + district is selected ───────────────────
    const geocodeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!provinceText || !districtText) return;
        const parts = [wardText, districtText, provinceText].filter(Boolean);
        if (parts.length < 2) return;

        if (geocodeRef.current) clearTimeout(geocodeRef.current);
        geocodeRef.current = setTimeout(async () => {
            setGeocoding(true);
            setGeocodeStatus('idle');
            try {
                const query = parts.join(', ');
                const zoom = wardText ? 16 : districtText ? 13 : 10;
                const params = new URLSearchParams({
                    q: query, format: 'json', countrycodes: 'vn',
                    limit: '1', 'accept-language': 'vi,en',
                });
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?${params}`,
                    { headers: { 'User-Agent': 'RealEstateApp/1.0' } }
                );
                const data = await res.json();
                if (data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    setGeocodedCenter([lat, lng]);
                    onChange('latitude', lat.toString());
                    onChange('longitude', lng.toString());
                    setGeocodeStatus('ok');
                    void zoom; // used for future zoom adjustment
                } else {
                    setGeocodeStatus('error');
                }
            } catch {
                setGeocodeStatus('error');
            } finally {
                setGeocoding(false);
            }
        }, 600);
    }, [provinceText, districtText, wardText]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleProvinceSelect = (item: AdminUnit) => {
        setProvinceText(item.name);
        setProvinceCode(String(item.code));
        setDistrictText(''); setDistrictCode('');
        setWardText('');
        setDistricts([]); setWards([]);
        onChange('city', item.name);
        onChange('district', '');
        onChange('ward', '');
        loadDistricts(String(item.code));
    };

    const handleDistrictSelect = (item: AdminUnit) => {
        setDistrictText(item.name);
        setDistrictCode(String(item.code));
        setWardText('');
        setWards([]);
        onChange('district', item.name);
        onChange('ward', '');
        loadWards(String(item.code));
    };

    const handleWardSelect = (item: AdminUnit) => {
        setWardText(item.name);
        onChange('ward', item.name);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-600" />
                    Địa chỉ &amp; Vị trí
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* ── Cascading selects ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SearchableDropdown
                        label="Tỉnh / Thành phố"
                        required
                        placeholder={loadingP ? 'Đang tải...' : 'Tìm hoặc chọn...'}
                        value={provinceText}
                        onChange={v => { setProvinceText(v); onChange('city', v); }}
                        items={provinces}
                        onSelect={handleProvinceSelect}
                        loading={loadingP}
                    />
                    <SearchableDropdown
                        label="Quận / Huyện"
                        required
                        placeholder={!provinceCode ? 'Chọn tỉnh trước' : 'Tìm hoặc chọn...'}
                        value={districtText}
                        onChange={v => { setDistrictText(v); onChange('district', v); }}
                        items={districts}
                        onSelect={handleDistrictSelect}
                        disabled={!provinceCode}
                        loading={loadingD}
                    />
                    <SearchableDropdown
                        label="Phường / Xã"
                        placeholder={!districtCode ? 'Chọn quận trước' : 'Tìm hoặc chọn...'}
                        value={wardText}
                        onChange={v => { setWardText(v); onChange('ward', v); }}
                        items={wards}
                        onSelect={handleWardSelect}
                        disabled={!districtCode}
                        loading={loadingW}
                    />
                </div>

                {/* ── Địa chỉ chi tiết ── */}
                <div className="space-y-1.5">
                    <Label htmlFor="address">
                        Số nhà / Đường <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="address"
                        value={address}
                        onChange={e => onChange('address', e.target.value)}
                        placeholder="123 Đường Nguyễn Huệ"
                    />
                </div>

                {/* ── Geocoding status ── */}
                {geocoding && (
                    <div className="flex items-center gap-2 text-sm text-blue-600
                                    bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Đang xác định tọa độ...</span>
                    </div>
                )}
                {!geocoding && geocodeStatus === 'ok' && latitude && (
                    <div className="flex items-center gap-2 text-sm text-green-700
                                    bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <div>
                            <span className="font-medium">Đã xác định tọa độ — </span>
                            <span className="font-mono text-xs">
                                {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
                            </span>
                        </div>
                    </div>
                )}
                {!geocoding && geocodeStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-amber-700
                                    bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Không tìm được tọa độ — nhấp trực tiếp lên bản đồ để đặt vị trí</span>
                    </div>
                )}

                {/* ── Map (full-width) ── */}
                <div>
                    <p className="text-xs text-gray-500 mb-2">
                        Nhấp vào bản đồ để ghim vị trí · Kéo ghim xanh để điều chỉnh chính xác hơn
                    </p>
                    <MapPicker
                        initialLat={initialLat}
                        initialLng={initialLng}
                        centerTarget={geocodedCenter}
                        height="360px"
                        onChange={(coords, detectedAddress) => {
                            onChange('latitude', coords.lat.toString());
                            onChange('longitude', coords.lng.toString());
                            if (detectedAddress && !address.trim()) {
                                onChange('address', detectedAddress);
                            }
                        }}
                    />
                </div>

            </CardContent>
        </Card>
    );
};

export default LocationSection;
