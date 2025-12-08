/**
 * Shipping zones utility functions
 * Determines shipping zones based on country codes
 */

// EU countries (ISO 3166-1 alpha-2 codes)
export const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// Non-EU European countries
export const EUROPE_NON_EU = [
    'GB', // United Kingdom
    'CH', // Switzerland
    'NO', // Norway
    'IS', // Iceland
    'LI', // Liechtenstein
    'AD', // Andorra
    'MC', // Monaco
    'SM', // San Marino
    'VA', // Vatican City
];

export type ShippingZone = 'germany' | 'eu' | 'europe' | 'worldwide';

/**
 * Determines the shipping zone for a given country code
 */
export function getShippingZone(countryCode: string): ShippingZone {
    const upperCode = countryCode.toUpperCase();
    
    if (upperCode === 'DE') {
        return 'germany';
    }
    
    if (EU_COUNTRIES.includes(upperCode)) {
        return 'eu';
    }
    
    if (EUROPE_NON_EU.includes(upperCode)) {
        return 'europe';
    }
    
    return 'worldwide';
}

/**
 * Gets the shipping cost for a given country and artwork
 * Returns null if shipping is not available to that country
 */
export function getShippingCost(
    artwork: { shippingZones?: any; shippingCost?: number; shippingType?: string; isDigital?: boolean },
    countryCode: string
): number | null {
    // Digital art has no shipping
    if (artwork.isDigital) {
        return 0;
    }
    
    
    // If new shipping zones system is used
    if (artwork.shippingZones) {
        const zone = getShippingZone(countryCode);
        const zoneConfig = artwork.shippingZones[zone];
        
        if (!zoneConfig || !zoneConfig.enabled) {
            return null; // Shipping not available to this zone
        }
        
        return zoneConfig.cost;
    }
    
    // Legacy: fallback to old shippingCost system
    // Only allow shipping to Germany if no zones are defined
    if (countryCode.toUpperCase() === 'DE' && artwork.shippingCost !== undefined) {
        return artwork.shippingCost;
    }
    
    // Legacy system: if shippingCost exists but country is not DE, assume not available
    return null;
}

/**
 * Checks if shipping is available to a given country
 */
export function isShippingAvailable(
    artwork: { shippingZones?: any; shippingCost?: number; shippingType?: string; isDigital?: boolean },
    countryCode: string
): boolean {
    // Digital art is always "available" (no shipping needed)
    if (artwork.isDigital) {
        return true;
    }
    
    
    // If new shipping zones system is used
    if (artwork.shippingZones) {
        const zone = getShippingZone(countryCode);
        const zoneConfig = artwork.shippingZones[zone];
        return zoneConfig?.enabled === true;
    }
    
    // Legacy: only Germany if shippingCost is defined
    return countryCode.toUpperCase() === 'DE' && artwork.shippingCost !== undefined;
}

/**
 * Gets available shipping zones for an artwork
 */
export function getAvailableShippingZones(artwork: { shippingZones?: any; shippingCost?: number; shippingType?: string; isDigital?: boolean }): ShippingZone[] {
    const zones: ShippingZone[] = [];
    
    if (artwork.isDigital) {
        return ['worldwide']; // Digital is available worldwide
    }
    
    if (artwork.shippingZones) {
        if (artwork.shippingZones.germany?.enabled) zones.push('germany');
        if (artwork.shippingZones.eu?.enabled) zones.push('eu');
        if (artwork.shippingZones.europe?.enabled) zones.push('europe');
        if (artwork.shippingZones.worldwide?.enabled) zones.push('worldwide');
    } else {
        // Legacy: if shippingCost exists, assume Germany only
        if (artwork.shippingCost !== undefined) {
            zones.push('germany');
        }
    }
    
    return zones;
}

/**
 * Gets human-readable zone name
 */
export function getZoneName(zone: ShippingZone, locale: string = 'de'): string {
    const names: Record<string, Record<ShippingZone, string>> = {
        de: {
            germany: 'Deutschland',
            eu: 'Europäische Union',
            europe: 'Europa (nicht-EU)',
            worldwide: 'Weltweit'
        },
        en: {
            germany: 'Germany',
            eu: 'European Union',
            europe: 'Europe (non-EU)',
            worldwide: 'Worldwide'
        }
    };
    
    return names[locale]?.[zone] || names['en'][zone];
}



