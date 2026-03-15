/**
 * DISTANCE UTILITIES
 * Tính toán khoảng cách giữa các điểm trên bản đồ
 *
 * CÁC FUNCTION:
 * 
 * │  calculateDistance()      → Khoảng cách (mét) dùng Haversine  
 * │  calculateWalkingTime()   → Thời gian đi bộ (phút)            
 * │  formatDistance()         → Hiển thị: "250m" hoặc "1.5km"     
 * │  addDistanceToAmenities() → Thêm distance vào mảng tiện ích    
 * │  sortByDistance()         → Sắp xếp gần → xa                  
 * 
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AmenityBase {
    id: number;
    name: string;
    type: string;
    lat: number;
    lng: number;
    address?: string;
    phone?: string;
    website?: string;
    openingHours?: string;
}

export interface AmenityWithDistance extends AmenityBase {
    distance: number;          // Mét (đã làm tròn)
    walkingTime: number;       // Phút đi bộ
    distanceFormatted: string; // "250m" hoặc "1.5km"
}

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Bán kính Trái Đất tính bằng mét */
const EARTH_RADIUS_METERS = 6_371_000;

/** Tốc độ đi bộ trung bình: 80m/phút ≈ 4.8km/h */
const WALKING_SPEED_M_PER_MIN = 80;

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Tính khoảng cách giữa 2 điểm tọa độ (công thức Haversine)
 *
 * TẠI SAO DÙNG HAVERSINE?
 * Trái Đất hình cầu nên không thể dùng Pythagoras (a²+b²=c²).
 * Haversine tính chính xác trên mặt cầu.
 *
 * CÁCH TÍNH (đơn giản hóa):
 * 1. Chuyển độ → radian (vì sin/cos cần radian)
 * 2. Tính chênh lệch vĩ độ (Δφ) và kinh độ (Δλ)
 * 3. Dùng công thức Haversine tính góc trung tâm (c)
 * 4. Khoảng cách = bán kính × góc
 *
 * @returns Khoảng cách tính bằng mét
 *
 * @example
 * // BĐS tại Quận 1 → Bệnh viện Chợ Rẫy
 * calculateDistance(10.7731, 106.7003, 10.7557, 106.6685)
 * // → ~3890 mét ≈ 3.9km
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    // Chuyển độ sang radian: radian = độ × (π/180)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180; // chênh lệch vĩ độ
    const Δλ = ((lon2 - lon1) * Math.PI) / 180; // chênh lệch kinh độ

    // Công thức Haversine
    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c; // mét
}

/**
 * Tính thời gian đi bộ từ khoảng cách
 *
 * @param distanceMeters Khoảng cách (mét)
 * @returns Thời gian đi bộ (phút, tối thiểu 1 phút)
 *
 * @example
 * calculateWalkingTime(400) // → 5 phút
 * calculateWalkingTime(80)  // → 1 phút (tối thiểu)
 */
export function calculateWalkingTime(distanceMeters: number): number {
    return Math.max(1, Math.round(distanceMeters / WALKING_SPEED_M_PER_MIN));
}

/**
 * Format khoảng cách để hiển thị thân thiện
 *
 * @example
 * formatDistance(250)  // → "250m"
 * formatDistance(1500) // → "1.5km"
 * formatDistance(3200) // → "3.2km"
 */
export function formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
        return `${Math.round(distanceMeters)}m`;
    }
    return `${(distanceMeters / 1000).toFixed(1)}km`;
}

// ─── Collection Helpers ─────────────────────────────────────────────────────────

/**
 * Thêm thông tin khoảng cách vào mỗi tiện ích
 *
 * INPUT  → [{ id, name, lat, lng, ... }]
 * OUTPUT → [{ id, name, lat, lng, distance, walkingTime, distanceFormatted, ... }]
 *
 * @param amenities  Mảng tiện ích từ API (chưa có distance)
 * @param centerLat  Vĩ độ BĐS (điểm trung tâm)
 * @param centerLng  Kinh độ BĐS (điểm trung tâm)
 */
export function addDistanceToAmenities(
    amenities: AmenityBase[],
    centerLat: number,
    centerLng: number
): AmenityWithDistance[] {
    return amenities.map((amenity) => {
        const dist = calculateDistance(centerLat, centerLng, amenity.lat, amenity.lng);
        return {
            ...amenity,
            distance: Math.round(dist),
            walkingTime: calculateWalkingTime(dist),
            distanceFormatted: formatDistance(dist),
        };
    });
}

/**
 * Sắp xếp tiện ích theo khoảng cách tăng dần (gần nhất trước)
 *
 * Không thay đổi mảng gốc (immutable — tạo bản copy trước khi sort)
 */
export function sortByDistance<T extends { distance: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.distance - b.distance);
}

/**
 * Nhóm tiện ích theo loại
 *
 * INPUT  → [{ type:'school', ... }, { type:'hospital', ... }, { type:'school', ... }]
 * OUTPUT → { school: [...], hospital: [...] }
 */
export function groupByType(
    amenities: AmenityWithDistance[]
): Record<string, AmenityWithDistance[]> {
    return amenities.reduce<Record<string, AmenityWithDistance[]>>((acc, a) => {
        if (!acc[a.type]) acc[a.type] = [];
        acc[a.type].push(a);
        return acc;
    }, {});
}
