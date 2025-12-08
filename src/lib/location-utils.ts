/**
 * Location utilities using country-state-city package
 */

import { City, State, Country, ICity } from "country-state-city";

// Cache cities by country to avoid reloading
const citiesCache: Map<string, ICity[]> = new Map();

/**
 * Get all countries
 */
export function getAllCountries() {
    return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get cities for a specific country (cached)
 */
function getCitiesByCountry(countryCode: string): ICity[] {
    if (citiesCache.has(countryCode)) {
        return citiesCache.get(countryCode)!;
    }
    
    const states = State.getStatesOfCountry(countryCode);
    const allCities: ICity[] = [];
    
    for (const state of states) {
        const cities = City.getCitiesOfState(countryCode, state.isoCode);
        allCities.push(...cities);
    }
    
    // Sort by name
    const sortedCities = allCities.sort((a, b) => a.name.localeCompare(b.name));
    citiesCache.set(countryCode, sortedCities);
    return sortedCities;
}

/**
 * Get filtered cities based on country and search query (performance optimization)
 * Only returns cities that match the search query, limited to 100 results
 */
export function getCities(countryCode: string, searchQuery: string = ""): ICity[] {
    if (!countryCode) return [];
    
    const allCities = getCitiesByCountry(countryCode);
    
    // If there's a search query, filter cities
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return allCities
            .filter(city => city.name.toLowerCase().includes(query))
            .slice(0, 100) // Limit to 100 results for performance
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // If no query, return empty array (user needs to type to see suggestions)
    return [];
}

/**
 * Get formatted city name with country (e.g., "Bremen, Deutschland")
 */
export function getCityDisplayName(city: ICity, countryCode: string): string {
    const country = Country.getCountryByCode(countryCode);
    const countryName = country?.name || countryCode;
    return `${city.name}, ${countryName}`;
}

/**
 * Find city by name in a specific country (case-insensitive)
 */
export function findCityByName(countryCode: string, cityName: string): ICity | undefined {
    if (!countryCode) return undefined;
    const allCities = getCitiesByCountry(countryCode);
    return allCities.find(
        city => city.name.toLowerCase() === cityName.toLowerCase()
    );
}

/**
 * Get country name by code
 */
export function getCountryName(countryCode: string): string {
    const country = Country.getCountryByCode(countryCode);
    return country?.name || countryCode;
}

