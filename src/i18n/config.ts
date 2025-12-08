export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];

// German-speaking countries/regions
export const germanSpeakingRegions = [
  'DE', // Germany
  'AT', // Austria
  'CH', // Switzerland
  'LI', // Liechtenstein
  'LU', // Luxembourg (partially German-speaking)
];

export const defaultLocale: Locale = 'en';





