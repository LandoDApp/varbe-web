import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://varbe.org';
    const locales = ['de', 'en'];
    
    const staticPages = [
        '',
        'ueber-uns',
        'kuenstler',
        'kaufen',
        'kontakt',
        'malerei',
        'fotografie',
        'skulptur',
        'zeichnung',
        'digital-art',
        'mixed-media',
        'kunsthandwerk',
        'abstrakt',
        'realistisch',
        'kunst-unter-50',
        'kunst-50-100',
        'kunst-100-500',
        'blog',
        'blog/kunstwerke-richtig-fotografieren',
        'blog/kunst-online-verkaufen-guide',
        'blog/kunstpreise-kalkulieren',
        'blog/original-vs-druck',
        'blog/kunst-als-geldanlage',
        'blog/kunst-versenden-tipps',
        'legal/impressum',
        'legal/datenschutz',
        'legal/agb',
        'legal/widerruf',
        'legal/cookies',
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add static pages for each locale
    locales.forEach(locale => {
        staticPages.forEach(page => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale === 'de' ? '' : locale + '/'}${page}`,
                lastModified: new Date(),
                changeFrequency: page === '' ? 'daily' : 'weekly',
                priority: page === '' ? 1.0 : page.includes('legal') ? 0.3 : 0.8,
            });
        });
    });

    return sitemapEntries;
}

