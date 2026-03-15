/**
 * OVERPASS API UTILITIES
 * Gọi OpenStreetMap Overpass API để tìm tiện ích xung quanh BĐS
 *
 * LUỒNG HOẠT ĐỘNG:
 * ┌──────────────┐    Overpass QL query     ┌─────────────────────┐
 * │  Component   │ ──────────────────────▶ │  Overpass API       │
 * │              │                          │  (OpenStreetMap)    │
 * │              │ ◀────────────────────── │                     │
 * └──────────────┘    JSON: [{id, lat, ...}] └─────────────────────┘
 *
 * TẠI SAO KHÔNG DÙNG AXIOS?
 * → Browser có sẵn fetch(), không cần thêm dependency
 * → Nhẹ hơn, native, đủ dùng cho case này
 */

import type { AmenityBase } from './distance';

// ─── Types ──────────────────────────────────────────────────────────────────────

/** Loại tiện ích hỗ trợ */
export type AmenityType =
    | 'school'
    | 'hospital'
    | 'supermarket'
    | 'bank'
    | 'restaurant'
    | 'cafe'
    | 'pharmacy'
    | 'fuel'
    | 'park'
    | 'gym';

/** Config hiển thị cho mỗi loại tiện ích */
export interface AmenityCategory {
    type: AmenityType;
    label: string;  // Tên tiếng Việt
    icon: string;   // Emoji icon
    color: string;  // Màu hex cho marker trên map
}

// ─── Category Config ─────────────────────────────────────────────────────────────

/**
 * Danh sách tất cả loại tiện ích được hỗ trợ
 * Dùng để:
 * 1. Render filter checkboxes trên UI
 * 2. Lấy icon/màu cho marker trên map
 * 3. Lấy label tiếng Việt cho danh sách
 */
export const AMENITY_CATEGORIES: AmenityCategory[] = [
    { type: 'school', label: 'Trường học', icon: '🏫', color: '#3b82f6' },
    { type: 'hospital', label: 'Bệnh viện', icon: '🏥', color: '#ef4444' },
    { type: 'supermarket', label: 'Siêu thị', icon: '🏪', color: '#10b981' },
    { type: 'bank', label: 'Ngân hàng', icon: '🏦', color: '#f59e0b' },
    { type: 'restaurant', label: 'Nhà hàng', icon: '🍽️', color: '#ec4899' },
    { type: 'cafe', label: 'Quán cafe', icon: '☕', color: '#8b5cf6' },
    { type: 'pharmacy', label: 'Nhà thuốc', icon: '💊', color: '#06b6d4' },
    { type: 'fuel', label: 'Cây xăng', icon: '⛽', color: '#f97316' },
    { type: 'park', label: 'Công viên', icon: '🌳', color: '#84cc16' },
    { type: 'gym', label: 'Phòng gym', icon: '🏋️', color: '#14b8a6' },
];

/** Lấy category config theo type (O(n) nhỏ, cache bên ngoài nếu cần) */
export function getCategoryByType(type: string): AmenityCategory | undefined {
    return AMENITY_CATEGORIES.find((c) => c.type === type);
}

// ─── Overpass API ────────────────────────────────────────────────────────────────

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Tạo Overpass QL query để tìm tiện ích
 *
 * OVERPASS QL LÀ GÌ?
 * → Ngôn ngữ truy vấn riêng của OpenStreetMap
 * → Tương tự SQL nhưng cho dữ liệu địa lý
 *
 * CẤU TRÚC QUERY:
 * [out:json]        → Trả về JSON (không phải XML)
 * [timeout:20]      → Timeout 20s (tránh chờ quá lâu)
 * node[...](around) → Tìm điểm (node)
 * way[...](around)  → Tìm đường/khu vực (way)
 * out center        → Trả về tọa độ trung tâm (dùng cho way/relation)
 *
 * @example
 * // Tìm trường học trong bán kính 1km quanh (10.7731, 106.7003)
 * buildOverpassQuery(10.7731, 106.7003, 1000, 'school')
 */
function buildOverpassQuery(
    lat: number,
    lng: number,
    radius: number,
    amenityType: string
): string {
    // Một số địa điểm dùng tag "shop" thay vì "amenity" (ví dụ: supermarket)
    const shopTypes = ['supermarket', 'gym'];
    const isShop = shopTypes.includes(amenityType);

    const tagFilter = isShop
        ? `["shop"="${amenityType}"]`
        : `["amenity"="${amenityType}"]`;

    return `
    [out:json][timeout:20];
    (
      node${tagFilter}(around:${radius},${lat},${lng});
      way${tagFilter}(around:${radius},${lat},${lng});
    );
    out center;
  `.trim();
}

// ─── Simple Cache ────────────────────────────────────────────────────────────────

/** TTL cache: 5 phút — tránh gọi API lặp lại khi user kéo slider */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
    data: AmenityBase[];
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(lat: number, lng: number, radius: number, type: string): string {
    // Làm tròn 4 chữ số thập phân (~11m) để cache hiệu quả khi tọa độ chênh lệch nhỏ
    return `${lat.toFixed(4)},${lng.toFixed(4)},${radius},${type}`;
}

// ─── Fetch Functions ──────────────────────────────────────────────────────────────

/**
 * Tìm tiện ích theo 1 loại cụ thể, có cache
 *
 * LUỒNG:
 * 1. Kiểm tra cache → nếu còn hạn thì dùng ngay
 * 2. Gọi Overpass API với POST request
 * 3. Parse JSON, chuyển sang AmenityBase[]
 * 4. Lưu vào cache 5 phút
 * 5. Trả về kết quả
 *
 * @param lat         Vĩ độ trung tâm (BĐS)
 * @param lng         Kinh độ trung tâm (BĐS)
 * @param radius      Bán kính tìm kiếm (mét)
 * @param amenityType Loại tiện ích (ví dụ: 'school')
 */
export async function fetchAmenities(
    lat: number,
    lng: number,
    radius: number,
    amenityType: string
): Promise<AmenityBase[]> {
    // ── Bước 1: Kiểm tra cache ──
    const key = getCacheKey(lat, lng, radius, amenityType);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    // ── Bước 2: Gọi API ──
    const query = buildOverpassQuery(lat, lng, radius, amenityType);

    const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
        throw new Error(`Overpass API lỗi: ${response.status}`);
    }

    // ── Bước 3: Parse và transform ──
    const json = await response.json();
    const elements: any[] = json.elements ?? [];

    const amenities: AmenityBase[] = elements
        .map((el): AmenityBase | null => {
            // node → có sẵn lat/lon
            // way  → lấy từ center (do dùng "out center")
            const amenityLat = el.lat ?? el.center?.lat;
            const amenityLng = el.lon ?? el.center?.lon;

            if (!amenityLat || !amenityLng) return null; // bỏ qua phần tử thiếu tọa độ

            return {
                id: el.id,
                name: el.tags?.name ?? 'Không có tên',
                type: amenityType,
                lat: amenityLat,
                lng: amenityLng,
                address: el.tags?.['addr:street'],
                phone: el.tags?.phone,
                website: el.tags?.website,
                openingHours: el.tags?.opening_hours,
            };
        })
        .filter((x): x is AmenityBase => x !== null); // TypeScript type guard

    // ── Bước 4: Lưu cache ──
    cache.set(key, { data: amenities, expiresAt: Date.now() + CACHE_TTL_MS });

    return amenities;
}

/**
 * Tìm nhiều loại tiện ích song song (parallel)
 *
 * TẠI SAO DÙNG Promise.all?
 * → Gọi API tuần tự (sequential): 10 loại × ~2s = ~20s chờ ❌
 * → Gọi song song (parallel):     10 loại → tất cả cùng lúc ~2s ✅
 *
 * TẠI SAO DÙNG allSettled THAY VÌ all?
 * → Promise.all: 1 lỗi → toàn bộ fail ❌
 * → Promise.allSettled: 1 lỗi → các cái khác vẫn có kết quả ✅
 *
 * @param lat          Vĩ độ BĐS
 * @param lng          Kinh độ BĐS
 * @param radius       Bán kính tìm kiếm (mét)
 * @param amenityTypes Mảng loại tiện ích cần tìm
 */
export async function fetchMultipleAmenities(
    lat: number,
    lng: number,
    radius: number,
    amenityTypes: string[]
): Promise<AmenityBase[]> {
    if (amenityTypes.length === 0) return [];

    // Gọi song song cho từng loại
    const results = await Promise.allSettled(
        amenityTypes.map((type) => fetchAmenities(lat, lng, radius, type))
    );

    // Gộp kết quả thành công, bỏ qua lỗi
    return results
        .filter((r): r is PromiseFulfilledResult<AmenityBase[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);
}

/** Xóa toàn bộ cache (dùng khi test hoặc refresh thủ công) */
export function clearAmenityCache(): void {
    cache.clear();
}
