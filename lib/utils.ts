import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse variant string to extract RAM and ROM values
 * Examples: "12/256" -> {ram: 12, rom: 256}, "128GB" -> {ram: null, rom: 128}
 */
export function parseVariant(variant: string): { ram: number | null; rom: number | null } {
  if (!variant) return { ram: null, rom: null };
  
  // Pattern: "12/256" or "8/128"
  const slashPattern = /(\d+)\/(\d+)/;
  const slashMatch = variant.match(slashPattern);
  if (slashMatch) {
    return {
      ram: parseInt(slashMatch[1]),
      rom: parseInt(slashMatch[2])
    };
  }
  
  // Pattern: "128GB" or "256GB"
  const gbPattern = /(\d+)\s*GB/i;
  const gbMatch = variant.match(gbPattern);
  if (gbMatch) {
    return {
      ram: null,
      rom: parseInt(gbMatch[1])
    };
  }
  
  return { ram: null, rom: null };
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) {
    return "Price Not Updated";
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Format date for display
 * Handles DD/MM/YYYY and DD/MM/YY formats from Google Sheets
 */
export function formatDate(date: string | null): string {
  if (!date) return "N/A";
  
  try {
    // Try to match DD/MM/YYYY or DD/MM/YY pattern
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const match = date.match(datePattern);
    
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
      let year = parseInt(match[3], 10);
      
      // Convert 2-digit year to 4-digit (assume 20xx for years < 100)
      if (year < 100) {
        year += 2000;
      }
      
      // Create date object and validate
      const parsed = new Date(year, month, day);
      
      // Check if the date is valid
      if (isNaN(parsed.getTime())) {
        return "Invalid Date";
      }
      
      // Verify the parsed date matches the input (catches invalid dates like 31/02/2025)
      if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
        return "Invalid Date";
      }
      
      return parsed.toLocaleDateString('en-IN');
    }
    
    // Fall back to native Date parsing for other formats (ISO dates, etc.)
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return "Invalid Date";
    }
    return parsed.toLocaleDateString('en-IN');
  } catch {
    return "Invalid Date";
  }
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImage(): string {
  return "/placeholder.svg";
}

/**
 * Check if a sellout period is currently active
 * @param selloutFromDate - Start date of sellout (DD/MM/YYYY or DD/MM/YY format)
 * @param selloutToDate - End date of sellout (DD/MM/YYYY or DD/MM/YY format)
 * @returns true if today falls within the sellout period, false otherwise
 * 
 * Note: Two-digit years are interpreted as 2000-2099 (e.g., 25 = 2025)
 */
export function isSelloutActive(selloutFromDate: string | null, selloutToDate: string | null): boolean {
  // Return false if either date is missing or empty
  if (!selloutFromDate || !selloutToDate) {
    return false;
  }

  /**
   * Helper function to parse a date string and return a Date object
   * @param match - Regex match result with day, month, and year groups
   * @param setToEndOfDay - If true, sets time to 23:59:59.999; otherwise 00:00:00.000
   * @returns Parsed Date object or null if invalid
   */
  const parseDate = (match: RegExpMatchArray, setToEndOfDay: boolean = false): Date | null => {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    let year = parseInt(match[3], 10);
    
    // Convert 2-digit year to 4-digit (assume 20xx for years < 100)
    if (year < 100) {
      year += 2000;
    }

    // Create date object with appropriate time
    const date = setToEndOfDay 
      ? new Date(year, month, day, 23, 59, 59, 999)
      : new Date(year, month, day, 0, 0, 0, 0);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Verify the parsed date matches the input (catches invalid dates like 31/02/2025)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }

    return date;
  };

  try {
    // Parse the from and to dates
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const fromMatch = selloutFromDate.match(datePattern);
    const toMatch = selloutToDate.match(datePattern);

    if (!fromMatch || !toMatch) {
      return false;
    }

    // Parse dates using helper function
    const fromDate = parseDate(fromMatch, false);
    const toDate = parseDate(toMatch, true);

    if (!fromDate || !toDate) {
      return false;
    }

    const today = new Date();

    // Check if today is within the sellout period
    return today >= fromDate && today <= toDate;
  } catch {
    return false;
  }
}
