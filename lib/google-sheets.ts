import { google } from 'googleapis';
import slugify from 'slugify';
import { Product } from '@/types';
import { parseVariant } from './utils';

const SHEET_NAME = 'Price List';

// Cache for products
let productsCache: Product[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

/**
 * Initialize Google Sheets API client
 */
function getGoogleSheetsClient() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    throw new Error('Google Sheets configuration error');
  }
}

/**
 * Convert checkbox value to boolean
 */
function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
  }
  return false;
}

/**
 * Parse number from string or number
 */
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? null : num;
}

/**
 * Generate unique product ID
 */
function generateProductId(brand: string, model: string, variant: string): string {
  const combined = `${brand}_${model}_${variant}`;
  return slugify(combined, { lower: true, strict: true });
}

/**
 * Transform raw sheet row to Product object
 */
function transformSheetRow(row: unknown[], index: number): Product | null {
  try {
    const brand = String(row[0] || '');
    const model = String(row[1] || '');
    const variant = String(row[3] || '');
    
    // Skip rows without essential data
    if (!brand || !model) return null;
    
    const { ram, rom } = parseVariant(variant);
    
    return {
      id: generateProductId(brand, model, variant),
      brand: brand.trim(),
      model: model.trim(),
      image: String(row[2] || ''),
      variant: variant.trim(),
      mrp: parseNumber(row[4]),
      mop: parseNumber(row[5]),
      selloutFromDate: String(row[6] || ''),
      selloutToDate: String(row[7] || ''),
      lastUpdated: String(row[8] || ''),
      quickPitch: String(row[9] || ''),
      bankOffers: String(row[10] || ''),
      upgradeExchangeOffers: String(row[11] || ''),
      storeOffersGifts: String(row[12] || ''),
      weeklyFocus: parseBoolean(row[13]),
      allModels: parseBoolean(row[14]),
      newLaunch: parseBoolean(row[15]),
      ram,
      rom,
    };
  } catch (error) {
    console.error(`Error transforming row ${index}:`, error);
    return null;
  }
}

/**
 * Fetch products from Google Sheets
 */
export async function fetchProductsFromSheets(): Promise<Product[]> {
  // Return cached data if still valid
  if (productsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('Returning cached products');
    return productsCache;
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not configured');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:P`, // Start from row 2 (skip header)
    });

    const rows = response.data.values || [];
    console.log(`Fetched ${rows.length} rows from Google Sheets`);

    const products = rows
      .map((row, index) => transformSheetRow(row, index))
      .filter((product): product is Product => product !== null);

    // Update cache
    productsCache = products;
    cacheTimestamp = Date.now();

    console.log(`Transformed ${products.length} valid products`);
    return products;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    
    // Return cached data if available, even if expired
    if (productsCache) {
      console.log('Returning expired cache due to error');
      return productsCache;
    }
    
    throw error;
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const products = await fetchProductsFromSheets();
  return products.find(p => p.id === id) || null;
}

/**
 * Clear the cache (for manual refresh)
 */
export function clearProductsCache(): void {
  productsCache = null;
  cacheTimestamp = null;
  console.log('Products cache cleared');
}

/**
 * Get cache status
 */
export function getCacheStatus(): { isCached: boolean; age: number | null } {
  return {
    isCached: productsCache !== null,
    age: cacheTimestamp ? Date.now() - cacheTimestamp : null,
  };
}
