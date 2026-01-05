import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { germanSpeakingRegions } from './i18n/config';

// ==========================================
// MAINTENANCE MODE - Set to true to enable
// ==========================================
const MAINTENANCE_MODE = true;
// ==========================================

// Custom locale detection: Browser language first, then region
function detectLocale(request: NextRequest): string {
  // 1. Try to detect from browser Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "de-DE,de;q=0.9,en;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [locale, q = '1'] = lang.trim().split(';q=');
        return { locale: locale.split('-')[0].toLowerCase(), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);

    // Check if any supported locale matches
    for (const { locale } of languages) {
      if (routing.locales.includes(locale as any)) {
        return locale;
      }
    }
  }

  // 2. Fallback to region-based detection
  const country = 
    request.headers.get('cf-ipcountry') || // Cloudflare
    request.headers.get('x-vercel-ip-country') || // Vercel
    (request as any).geo?.country || // Vercel Edge
    null;

  if (country && germanSpeakingRegions.includes(country)) {
    return 'de';
  }

  // 3. Default locale
  return routing.defaultLocale;
}

const intlMiddleware = createMiddleware({
  ...routing,
  localePrefix: 'always',
  localeDetection: false // We handle detection manually
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ==========================================
  // MAINTENANCE MODE REDIRECT
  // Redirects ALL traffic to /maintenance
  // EXCEPT: auth routes and admins with bypass cookie
  // ==========================================
  if (MAINTENANCE_MODE) {
    // Allow the maintenance page itself to load
    if (pathname === '/maintenance') {
      return NextResponse.next();
    }
    
    // Allow auth routes so users can still login
    // This includes all locale variations of auth routes
    const isAuthRoute = routing.locales.some(locale => 
      pathname.startsWith(`/${locale}/auth/`)
    ) || pathname.includes('/auth/');
    
    if (isAuthRoute) {
      // Continue with normal routing for auth pages
      const pathHasLocale = routing.locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
      );
      
      if (!pathHasLocale) {
        const locale = detectLocale(request);
        const newPath = `/${locale}${pathname}`;
        const newUrl = new URL(newPath, request.url);
        return NextResponse.redirect(newUrl);
      }
      
      return intlMiddleware(request);
    }
    
    // Check for admin bypass cookie
    const adminBypassCookie = request.cookies.get('varbe_admin_bypass');
    const isAdmin = adminBypassCookie?.value === 'true';
    
    // If admin, let them through to normal site
    if (isAdmin) {
      // Continue with normal routing
      const pathHasLocale = routing.locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
      );

      if (!pathHasLocale) {
        const locale = detectLocale(request);
        const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
        const newUrl = new URL(newPath, request.url);
        return NextResponse.redirect(newUrl);
      }

      return intlMiddleware(request);
    }
    
    // Redirect everyone else to maintenance
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }
  // ==========================================
  
  // Check if path already has a locale
  const pathHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in path, detect and redirect
  if (!pathHasLocale) {
    const locale = detectLocale(request);
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    const newUrl = new URL(newPath, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Use next-intl middleware for locale handling
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
