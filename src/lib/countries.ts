/**
 * Country codes and names for shipping address selection
 */

export interface Country {
    code: string;
    name: string;
    nameDe: string;
}

// Common countries for shipping (ISO 3166-1 alpha-2 codes)
export const COUNTRIES: Country[] = [
    { code: 'DE', name: 'Germany', nameDe: 'Deutschland' },
    { code: 'AT', name: 'Austria', nameDe: 'Österreich' },
    { code: 'CH', name: 'Switzerland', nameDe: 'Schweiz' },
    { code: 'FR', name: 'France', nameDe: 'Frankreich' },
    { code: 'IT', name: 'Italy', nameDe: 'Italien' },
    { code: 'ES', name: 'Spain', nameDe: 'Spanien' },
    { code: 'NL', name: 'Netherlands', nameDe: 'Niederlande' },
    { code: 'BE', name: 'Belgium', nameDe: 'Belgien' },
    { code: 'PL', name: 'Poland', nameDe: 'Polen' },
    { code: 'CZ', name: 'Czech Republic', nameDe: 'Tschechien' },
    { code: 'DK', name: 'Denmark', nameDe: 'Dänemark' },
    { code: 'SE', name: 'Sweden', nameDe: 'Schweden' },
    { code: 'NO', name: 'Norway', nameDe: 'Norwegen' },
    { code: 'FI', name: 'Finland', nameDe: 'Finnland' },
    { code: 'GB', name: 'United Kingdom', nameDe: 'Vereinigtes Königreich' },
    { code: 'IE', name: 'Ireland', nameDe: 'Irland' },
    { code: 'PT', name: 'Portugal', nameDe: 'Portugal' },
    { code: 'GR', name: 'Greece', nameDe: 'Griechenland' },
    { code: 'US', name: 'United States', nameDe: 'Vereinigte Staaten' },
    { code: 'CA', name: 'Canada', nameDe: 'Kanada' },
    { code: 'AU', name: 'Australia', nameDe: 'Australien' },
    { code: 'JP', name: 'Japan', nameDe: 'Japan' },
    { code: 'CN', name: 'China', nameDe: 'China' },
    { code: 'TH', name: 'Thailand', nameDe: 'Thailand' },
    { code: 'IN', name: 'India', nameDe: 'Indien' },
    { code: 'BR', name: 'Brazil', nameDe: 'Brasilien' },
    { code: 'MX', name: 'Mexico', nameDe: 'Mexiko' },
    { code: 'AR', name: 'Argentina', nameDe: 'Argentinien' },
    { code: 'ZA', name: 'South Africa', nameDe: 'Südafrika' },
    { code: 'NZ', name: 'New Zealand', nameDe: 'Neuseeland' },
    { code: 'SG', name: 'Singapore', nameDe: 'Singapur' },
    { code: 'KR', name: 'South Korea', nameDe: 'Südkorea' },
    { code: 'AE', name: 'United Arab Emirates', nameDe: 'Vereinigte Arabische Emirate' },
    { code: 'IL', name: 'Israel', nameDe: 'Israel' },
    { code: 'TR', name: 'Turkey', nameDe: 'Türkei' },
    { code: 'RU', name: 'Russia', nameDe: 'Russland' },
];

/**
 * Get country name by code
 */
export function getCountryName(code: string, locale: string = 'de'): string {
    const country = COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!country) return code;
    return locale === 'de' ? country.nameDe : country.name;
}

/**
 * Get country code from name (fuzzy match)
 */
export function getCountryCode(name: string): string | null {
    const upperName = name.toUpperCase();
    const country = COUNTRIES.find(c => 
        c.name.toUpperCase() === upperName || 
        c.nameDe.toUpperCase() === upperName ||
        c.code.toUpperCase() === upperName
    );
    return country?.code || null;
}





