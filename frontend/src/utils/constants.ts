export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const PROPERTY_TYPES = {
  apartment: 'Căn hộ/Chung cư',
  house: 'Nhà riêng',
  villa: 'Biệt thự',
  land: 'Đất nền',
  office: 'Văn phòng',
  warehouse: 'Kho xưởng',
  shophouse: 'Shophouse'
};

export const LISTING_TYPES = {
  sale: 'Bán',
  rent: 'Cho thuê'
};

export const CITIES = [
  'TP.HCM',
  'Hà Nội',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Biên Hòa',
  'Nha Trang',
  'Vũng Tàu'
];

export const PRICE_RANGES = [
  { min: 0, max: 1000000000, label: 'Dưới 1 tỷ' },
  { min: 1000000000, max: 3000000000, label: '1 - 3 tỷ' },
  { min: 3000000000, max: 5000000000, label: '3 - 5 tỷ' },
  { min: 5000000000, max: 10000000000, label: '5 - 10 tỷ' },
  { min: 10000000000, max: Infinity, label: 'Trên 10 tỷ' }
];

export const AREA_RANGES = [
  { min: 0, max: 30, label: 'Dưới 30m²' },
  { min: 30, max: 50, label: '30 - 50m²' },
  { min: 50, max: 80, label: '50 - 80m²' },
  { min: 80, max: 100, label: '80 - 100m²' },
  { min: 100, max: Infinity, label: 'Trên 100m²' }
];

export const AMENITIES_OPTIONS = [
  { id: 'pool', label: 'Hồ bơi', icon: '🏊' },
  { id: 'gym', label: 'Phòng gym', icon: '💪' },
  { id: 'parking', label: 'Bãi đậu xe', icon: '🚗' },
  { id: 'security', label: 'An ninh 24/7', icon: '🔒' },
  { id: 'elevator', label: 'Thang máy', icon: '🛗' },
  { id: 'garden', label: 'Sân vườn', icon: '🌳' },
  { id: 'balcony', label: 'Ban công', icon: '🏡' },
  { id: 'terrace', label: 'Sân thượng', icon: '🏠' },
  { id: 'bbq', label: 'Khu BBQ', icon: '🍖' },
  { id: 'playground', label: 'Sân chơi trẻ em', icon: '🎪' },
  { id: 'sauna', label: 'Phòng xông hơi', icon: '♨️' },
  { id: 'tennis', label: 'Sân tennis', icon: '🎾' },
  { id: 'basketball', label: 'Sân bóng rổ', icon: '🏀' },
  { id: 'minimart', label: 'Siêu thị mini', icon: '🏪' },
  { id: 'restaurant', label: 'Nhà hàng', icon: '🍽️' },
  { id: 'cafe', label: 'Quán cafe', icon: '☕' },
];

export const DIRECTION_LABELS = {
  east: 'Đông',
  west: 'Tây',
  south: 'Nam',
  north: 'Bắc',
  northeast: 'Đông Bắc',
  northwest: 'Tây Bắc',
  southeast: 'Đông Nam',
  southwest: 'Tây Nam',
};

export const LEGAL_STATUS_LABELS = {
  red_book: 'Sổ đỏ',
  pink_book: 'Sổ hồng',
  waiting: 'Đang chờ sổ',
  other: 'Khác',
};

export const FURNITURE_LABELS = {
  full: 'Đầy đủ nội thất',
  partial: 'Một phần',
  none: 'Không nội thất',
};