export const ROLES = {
  ADMIN: 'admin',
  BROKER: 'broker',
  CUSTOMER: 'customer'
} as const;

export const PROPERTY_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SOLD: 'sold',
  RENTED: 'rented',
  EXPIRED: 'expired',
  HIDDEN: 'hidden'
} as const;

export const LISTING_TYPES = {
  SALE: 'sale',
  RENT: 'rent'
} as const;

export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  VILLA: 'villa',
  LAND: 'land',
  OFFICE: 'office',
  WAREHOUSE: 'warehouse',
  SHOPHOUSE: 'shophouse'
} as const;

export const CONTACT_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested'
} as const;

export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
} as const;

export const PAGINATION = { 
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

export const DIRECTIONS = [
  'east',
  'west',
  'south',
  'north',
  'northeast',
  'northwest',
  'southeast',
  'southwest'
] as const;

export const FURNITURE_STATUS = {
  FULL: 'full',
  PARTIAL: 'partial',
  NONE: 'none'
} as const;

export const LEGAL_STATUS = {
  RED_BOOK: 'red_book',
  PINK_BOOK: 'pink_book',
  WAITING: 'waiting',
  OTHER: 'other'
} as const;