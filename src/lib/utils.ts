import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number in German locale format (comma for decimals, dot for thousands)
 * @param amount - The number to format
 * @param options - Options for formatting (minimumFractionDigits, maximumFractionDigits)
 * @returns Formatted string (e.g., "1.234,56")
 */
export function formatPrice(amount: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
    const defaultOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
    };
    return amount.toLocaleString('de-DE', defaultOptions);
}