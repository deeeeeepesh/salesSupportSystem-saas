// Product types from Google Sheets
export interface Product {
  id: string; // Generated: slugify(brand_model_variant)
  brand: string;
  model: string;
  image: string;
  variant: string;
  mrp: number | null;
  mop: number | null;
  selloutFromDate: string | null;
  selloutToDate: string | null;
  lastUpdated: string | null;
  quickPitch: string | null;
  bankOffers: string | null;
  upgradeExchangeOffers: string | null;
  storeOffersGifts: string | null;
  weeklyFocus: boolean;
  allModels: boolean;
  newLaunch: boolean;
  // Parsed from variant
  ram: number | null;
  rom: number | null;
}

// User types for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SALES' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface ProductFilters {
  search?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  ram?: number[];
  rom?: number[];
  filter?: 'newLaunch' | 'weeklyFocus' | 'allModels';
  sortBy?: 'latest' | 'priceLow' | 'priceHigh' | 'brandAZ';
  page?: number;
  perPage?: number;
}

// Google Sheets row type (raw data)
export interface SheetRow {
  Brand: string;
  Model: string;
  Image: string;
  Variant: string;
  MRP: string | number;
  MOP: string | number;
  'Sellout from date': string;
  'Sellout To Date': string;
  'Last Updated': string;
  'Quick Pitch': string;
  'Bank Offers': string;
  'Upgrade / Exchange Offers': string;
  'Store Offers and Gifts': string;
  'Weekly Focus': boolean | string;
  'All Models': boolean | string;
  'New Launch': boolean | string;
}
