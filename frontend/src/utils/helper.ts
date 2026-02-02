export const formatPrice = (price: number): string => {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} tỷ`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} triệu`;
  }
  return price.toLocaleString('vi-VN');
};

export const formatArea = (area: number): string => {
  return `${area}m²`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('vi-VN');
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('vi-VN');
};

export const getPropertyTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    apartment: 'Căn hộ/Chung cư',
    house: 'Nhà riêng',
    villa: 'Biệt thự',
    land: 'Đất nền',
    office: 'Văn phòng',
    warehouse: 'Kho xưởng',
    shophouse: 'Shophouse'
  };
  return types[type] || type;
};

export const getListingTypeLabel = (type: string): string => {
  return type === 'sale' ? 'Bán' : 'Cho thuê';
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};