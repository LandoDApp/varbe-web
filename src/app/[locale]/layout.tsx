import type { Metadata, Viewport } from "next";
import { Bangers, Inter } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { generateHomepageMetadata, generateOrganizationSchema } from "@/lib/metadata";
import Script from "next/script";

// Force dynamic rendering for all pages under [locale] to prevent SSR issues with auth/Firebase
export const dynamic = 'force-dynamic';

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Viewport must be exported separately in Next.js 14+
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const baseMetadata = generateHomepageMetadata(locale);
  
  const baseUrl = 'https://varbe.org';
  const deUrl = `${baseUrl}`;
  const enUrl = `${baseUrl}/en`;
  const currentUrl = locale === 'de' ? deUrl : enUrl;
  
  return {
    ...baseMetadata,
    alternates: {
      canonical: currentUrl,
      languages: {
        'de': deUrl,
        'en': enUrl,
        'x-default': enUrl
      }
    },
    openGraph: {
      ...baseMetadata.openGraph,
      url: currentUrl,
      siteName: 'Varbe',
      alternateLocale: locale === 'de' ? 'en' : 'de'
    }
  };
}

import { AuthProvider } from "@/context/AuthContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen antialiased",
          bangers.variable,
          inter.variable
        )}
        style={{ backgroundColor: '#fafafa' }}
      >
        {/* Animated Comic Halftone Background */}
        <div className="comic-halftone-bg" aria-hidden="true" />
        
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LanguageSelector>
              {children}
            </LanguageSelector>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

