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
 */
export function formatDate(date: string | null): string {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString('en-IN');
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
