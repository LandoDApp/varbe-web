import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { headers } from 'next/headers';
import { germanSpeakingRegions } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // If no locale in URL, detect from region
  if (!locale || !routing.locales.includes(locale as any)) {
    // Try to get country from headers (Cloudflare/Vercel)
    const headersList = await headers();
    const country = 
      headersList.get('cf-ipcountry') || // Cloudflare
      headersList.get('x-vercel-ip-country') || // Vercel
      null;

    // Determine locale based on country
    if (country && germanSpeakingRegions.includes(country)) {
      locale = 'de';
    } else {
      locale = routing.defaultLocale;
    }
  }

  // Ensure that a valid locale is used
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

