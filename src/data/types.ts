/**
 * Type definitions for Market Price Intelligence
 */

export type ValueChainType = 'Commodity' | 'Input' | string;

export type PriceBasis = 'total' | 'per-kg' | 'unit-pack' | 'as-recorded';

export type PriceUnitOption = 'kg' | 'bag100';

export interface RawProxyRecord {
  submissionId: string;
  collectionDate: string; // YYYY-MM-DD
  state: string;
  lga: string;
  market?: string;
  lat: number;
  lng: number;
  valueChain: string; // Generic: "Commodity", "Input", "Service", etc.
  category: string;
  product: string;
  brand?: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface ProxyResponse {
  generatedAt: string;
  records: RawProxyRecord[];
}

export interface CleanRecord {
  id: string; // generated unique key
  submissionId: string;
  collectionDate: string; // YYYY-MM-DD
  zone: string;
  state: string;
  lga: string;
  market: string;
  lat: number; // rounded to 2 decimals
  lng: number; // rounded to 2 decimals
  valueChain: string;
  category: string;
  product: string;
  brand: string;
  rawQuantity: number;
  rawUnit: string;
  rawPrice: number;
  priceBasis: PriceBasis;
  
  // Normalized prices
  pricePerKg: number;        // For commodities: calculated ₦/kg
  pricePer100KgBag: number;  // For commodities: ₦/100kg bag
  displayPrice: number;      // Contextual price depending on unit toggle
  displayUnit: string;       // "₦/kg" or "₦/100kg bag" or "₦/pack"
  packDescription: string;   // e.g. "100 Kg", "50 Kg Bag", "1 Litre"
  
  // Quality & outlier tracking
  isSuspect: boolean;
  suspectReason?: string;
}

export interface FilterState {
  dateRange: 'all' | 'last7' | 'last30' | 'thisSeason';
  zones: string[];
  states: string[];
  lgas: string[];
  markets: string[];
  valueChain: string; // 'all' or any dynamic value chain
  categories: string[];
  products: string[];
  brands: string[];
  priceUnit: PriceUnitOption; // 'kg' | 'bag100'
  includeFlagged: boolean;
  searchQuery: string;
}

export interface GeoZone {
  name: string;
  states: string[];
}

export interface DataPayload {
  records: CleanRecord[];
  allRecords: CleanRecord[]; // including suspect records
  generatedAt: string;
  isDemo: boolean;
  lastUpdated: Date;
}
