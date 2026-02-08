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
 */
export function isSelloutActive(selloutFromDate: string | null, selloutToDate: string | null): boolean {
  // Return false if either date is missing or empty
  if (!selloutFromDate || !selloutToDate) {
    return false;
  }

  try {
    // Parse the from date
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const fromMatch = selloutFromDate.match(datePattern);
    const toMatch = selloutToDate.match(datePattern);

    if (!fromMatch || !toMatch) {
      return false;
    }

    // Parse from date
    const fromDay = parseInt(fromMatch[1], 10);
    const fromMonth = parseInt(fromMatch[2], 10) - 1; // JS months are 0-indexed
    let fromYear = parseInt(fromMatch[3], 10);
    if (fromYear < 100) {
      fromYear += 2000;
    }

    // Parse to date
    const toDay = parseInt(toMatch[1], 10);
    const toMonth = parseInt(toMatch[2], 10) - 1;
    let toYear = parseInt(toMatch[3], 10);
    if (toYear < 100) {
      toYear += 2000;
    }

    // Create date objects (set time to start/end of day for proper comparison)
    const fromDate = new Date(fromYear, fromMonth, fromDay, 0, 0, 0, 0);
    const toDate = new Date(toYear, toMonth, toDay, 23, 59, 59, 999);
    const today = new Date();

    // Check if dates are valid
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return false;
    }

    // Verify the parsed dates match the input (catches invalid dates like 31/02/2025)
    if (fromDate.getFullYear() !== fromYear || fromDate.getMonth() !== fromMonth || fromDate.getDate() !== fromDay) {
      return false;
    }
    if (toDate.getFullYear() !== toYear || toDate.getMonth() !== toMonth || toDate.getDate() !== toDay) {
      return false;
    }

    // Check if today is within the sellout period
    return today >= fromDate && today <= toDate;
  } catch {
    return false;
  }
}
