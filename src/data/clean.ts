/**
 * Data Cleaning Pipeline for Market Price Intelligence
 * Extension Africa
 *
 * Implements the 9 strict cleaning rules:
 * Rule 1: Product name extraction & normalization
 * Rule 2: Price per kg calculation with per-kg entry detection (< 50 threshold)
 * Rule 3: Price per 100 kg bag conversion (perKg * 100)
 * Rule 4: Farm-input pack size formatting & unit rate calculation
 * Rule 5: Outlier detection (< ₦20 for commodities, < ₦100 for inputs, > 4x median)
 * Rule 6: Privacy enforcement (stripping personal data)
 * Rule 7: GPS rounding to 2 decimal places
 * Rule 8: Date parsing (YYYY-MM-DD) & record deduplication
 * Rule 9: Currency formatting with ₦ and thousands separators
 */

import { CleanRecord, RawProxyRecord, ValueChainType, PriceBasis, PriceUnitOption } from './types';
import { getZoneForState } from './zones';

/**
 * Rule 1: Clean and normalize product name
 */
export function cleanProductName(rawName: string, otherName?: string): string {
  if (!rawName) return 'Unspecified Product';
  let name = rawName.trim();
  if (name.toLowerCase() === 'others' || name.toLowerCase() === 'other') {
    if (otherName && otherName.trim()) {
      name = otherName.trim();
    }
  }
  // Standardize case: capitalize first letter of each word if all lower or all upper
  if (name === name.toUpperCase() || name === name.toLowerCase()) {
    name = name
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return name;
}

/**
 * Rule 2 & 3: Commodity price per kg & price per 100 kg bag
 * If perKg < 50, the enumerator entered price already as per-kg rate
 */
export function calculateCommodityPrices(price: number, quantity: number): {
  pricePerKg: number;
  pricePer100KgBag: number;
  priceBasis: PriceBasis;
} {
  const safeQty = quantity > 0 ? quantity : 1;
  const rawRatio = price / safeQty;

  let pricePerKg: number;
  let priceBasis: PriceBasis;

  if (rawRatio < 50) {
    // Enumerator entered per-kg rate directly (e.g. ₦330 for 100kg maize)
    pricePerKg = Math.round(price * 100) / 100;
    priceBasis = 'per-kg';
  } else {
    // Total price entered for the lot (e.g. ₦33,000 for 100kg millet)
    pricePerKg = Math.round((price / safeQty) * 100) / 100;
    priceBasis = 'total';
  }

  const pricePer100KgBag = Math.round(pricePerKg * 100);

  return {
    pricePerKg,
    pricePer100KgBag,
    priceBasis
  };
}

/**
 * Rule 4: Format farm-input pack description and rates
 */
export function formatInputPack(
  product: string,
  price: number,
  quantity: number,
  unit: string
): {
  packDescription: string;
  pricePerUnit: number;
} {
  const cleanUnit = (unit || 'Unit').trim();
  const safeQty = quantity > 0 ? quantity : 1;
  let packDescription = `${safeQty} ${cleanUnit}`;
  let pricePerUnit = price;

  const unitLower = cleanUnit.toLowerCase();

  if (unitLower.includes('bag')) {
    packDescription = safeQty > 1 ? `${safeQty} Bags` : `1 Bag (${cleanUnit.replace(/bag/i, '').trim() || 'standard'})`;
    pricePerUnit = price / safeQty;
  } else if (unitLower.includes('litre') || unitLower.includes('liter') || unitLower === 'l') {
    packDescription = `${safeQty} Litre${safeQty > 1 ? 's' : ''}`;
    pricePerUnit = price / safeQty;
  } else if (unitLower.includes('kg')) {
    packDescription = `${safeQty} Kg`;
    pricePerUnit = price / safeQty;
  } else if (unitLower.includes('g') || unitLower.includes('gram')) {
    packDescription = `${safeQty} g`;
    pricePerUnit = price / (safeQty / 1000); // normalized to kg equivalent
  }

  return {
    packDescription,
    pricePerUnit: Math.round(pricePerUnit * 100) / 100
  };
}

/**
 * Rule 7: Round GPS coordinate to 2 decimal places for clean display & map clustering
 */
export function roundGps(coord: number | null | undefined): number {
  if (coord === null || coord === undefined || isNaN(coord)) return 0;
  return Math.round(coord * 100) / 100;
}

/**
 * Rule 8: Parse dates into YYYY-MM-DD format
 */
export function parseDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // fallback
  }
  // Try regex matching YYYY-MM-DD
  const match = String(rawDate).match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return new Date().toISOString().split('T')[0];
}

/**
 * Rule 5: Detect outliers
 * - Price per unit below ₦20 for commodities
 * - Price below ₦100 for inputs (e.g. ₦7 insecticide)
 * - More than 4x median for same product (when count >= 5)
 */
export function detectOutliers(records: CleanRecord[]): CleanRecord[] {
  // Group prices by product to compute medians
  const productPrices: Record<string, number[]> = {};

  records.forEach(r => {
    const key = `${r.valueChain}:${r.product.toLowerCase()}`;
    if (!productPrices[key]) {
      productPrices[key] = [];
    }
    const comparePrice = r.valueChain === 'Commodity' ? r.pricePerKg : r.rawPrice;
    if (comparePrice > 0) {
      productPrices[key].push(comparePrice);
    }
  });

  // Calculate median for each product
  const productMedians: Record<string, number> = {};
  Object.keys(productPrices).forEach(key => {
    const list = productPrices[key].slice().sort((a, b) => a - b);
    if (list.length >= 5) {
      const mid = Math.floor(list.length / 2);
      productMedians[key] = list.length % 2 !== 0 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
    }
  });

  return records.map(record => {
    let isSuspect = false;
    let suspectReason = '';

    const chainLower = (record.valueChain || '').toLowerCase();
    if (chainLower === 'commodity') {
      if (record.pricePerKg < 20) {
        isSuspect = true;
        suspectReason = `Price below ₦20/kg minimum threshold (₦${record.pricePerKg}/kg)`;
      }
    } else if (chainLower === 'input') {
      if (record.rawPrice < 100) {
        isSuspect = true;
        suspectReason = `Input price below ₦100 minimum threshold (recorded at ₦${record.rawPrice})`;
      }
    }

    // Median check if at least 5 records
    const key = `${record.valueChain}:${record.product.toLowerCase()}`;
    const median = productMedians[key];
    if (median && !isSuspect) {
      const comparePrice = chainLower === 'commodity' ? record.pricePerKg : record.rawPrice;
      if (comparePrice > median * 4) {
        isSuspect = true;
        suspectReason = `Price (${formatNaira(comparePrice)}) is more than 4× median for ${record.product} (${formatNaira(median)})`;
      }
    }

    return {
      ...record,
      isSuspect,
      suspectReason: isSuspect ? suspectReason : undefined
    };
  });
}

/**
 * Clean and normalize a batch of raw records from proxy or live data
 * Rule 6: Never expose personal info
 * Rule 8: Deduplicate by submissionId + lga + product + category
 */
export function cleanRawRecords(rawList: RawProxyRecord[], priceUnit: PriceUnitOption = 'kg'): CleanRecord[] {
  const seenKeys = new Set<string>();
  const initialRecords: CleanRecord[] = [];

  rawList.forEach((raw, idx) => {
    const product = cleanProductName(raw.product);
    const category = (raw.category || 'General').trim();
    const lga = (raw.lga || 'Unspecified').trim();
    const state = (raw.state || 'Unspecified').trim();
    const submissionId = String(raw.submissionId || idx);
    const rawValueChain = (raw.valueChain || 'Commodity').trim();
    const chainLower = rawValueChain.toLowerCase();

    // Deduplication key
    const dedupKey = `${submissionId}|${lga.toLowerCase()}|${product.toLowerCase()}|${category.toLowerCase()}`;
    if (seenKeys.has(dedupKey)) {
      return; // Skip duplicate
    }
    seenKeys.add(dedupKey);

    const collectionDate = parseDate(raw.collectionDate);
    const lat = roundGps(raw.lat);
    const lng = roundGps(raw.lng);
    const zone = getZoneForState(state);
    const market = (raw.market || '').trim();
    const brand = (raw.brand || '').trim();
    const rawPrice = Number(raw.price) || 0;
    const rawQuantity = Number(raw.quantity) || 1;
    const rawUnit = (raw.unit || '').trim();

    let pricePerKg = 0;
    let pricePer100KgBag = 0;
    let priceBasis: PriceBasis = 'total';
    let packDescription = `${rawQuantity} ${rawUnit || 'unit'}`;
    let displayPrice = rawPrice;
    let displayUnit = `₦ for ${rawQuantity} ${rawUnit || 'unit'}`;

    if (chainLower === 'commodity') {
      const commodityRes = calculateCommodityPrices(rawPrice, rawQuantity);
      pricePerKg = commodityRes.pricePerKg;
      pricePer100KgBag = commodityRes.pricePer100KgBag;
      priceBasis = commodityRes.priceBasis;
      packDescription = `${rawQuantity} Kg`;
      displayPrice = priceUnit === 'bag100' ? pricePer100KgBag : pricePerKg;
      displayUnit = priceUnit === 'bag100' ? '₦/100kg bag' : '₦/kg';
    } else if (chainLower === 'input') {
      const inputRes = formatInputPack(product, rawPrice, rawQuantity, rawUnit);
      packDescription = inputRes.packDescription;
      pricePerKg = inputRes.pricePerUnit;
      pricePer100KgBag = inputRes.pricePerUnit * 100;
      priceBasis = 'unit-pack';
      displayPrice = rawPrice;
      displayUnit = `₦ per ${packDescription}`;
    } else {
      // Any other value chain (e.g. Service): show recorded price and quantity as entered without conversion
      priceBasis = 'as-recorded';
      pricePerKg = rawPrice;
      pricePer100KgBag = rawPrice;
      displayPrice = rawPrice;
      displayUnit = `₦ / ${packDescription}`;
    }

    initialRecords.push({
      id: `${submissionId}-${idx}`,
      submissionId,
      collectionDate,
      zone,
      state,
      lga,
      market,
      lat,
      lng,
      valueChain: rawValueChain,
      category,
      product,
      brand,
      rawQuantity,
      rawUnit,
      rawPrice,
      priceBasis,
      pricePerKg,
      pricePer100KgBag,
      displayPrice,
      displayUnit,
      packDescription,
      isSuspect: false
    });
  });

  return detectOutliers(initialRecords);
}

/**
 * Rule 9: Currency formatter with Naira symbol ₦ and comma separators
 */
export function formatNaira(amount: number | null | undefined, includeDecimals = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₦0';
  const rounded = includeDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₦${parts.join('.')}`;
}

/**
 * Format quantity with thousands separators
 */
export function formatNumber(num: number): string {
  return (num || 0).toLocaleString();
}
