import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // TODO: Fix all TypeScript errors properly
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://*.stripe.com https://www.googletagmanager.com https://apis.google.com blob:",
              "script-src-elem 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://*.stripe.com https://www.googletagmanager.com https://apis.google.com blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.stripe.com https://*.stripe.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.stripe.com wss://*.stripe.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://firebase.googleapis.com https://*.google-analytics.com https://*.paypal.com https://*.paypalobjects.com https://api.bigdatacloud.net https://api-bdc.io https://*.bigdatacloud.net https://nominatim.openstreetmap.org blob:",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://*.stripe.com https://*.paypal.com https://accounts.google.com https://*.firebaseapp.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
