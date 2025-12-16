import type { Metadata } from "next";

export function generateHomepageMetadata(locale: string = 'de'): Metadata {
    const isEnglish = locale === 'en';
    
    if (isEnglish) {
        return {
            title: "Varbe - Buy Original Art | Art Marketplace",
            description: "Discover unique artworks from €10 directly from independent artists. Fair prices, buyer protection, fast shipping. Start browsing!",
            keywords: "buy art, original artworks, support artists, art marketplace, buy art online, original paintings",
            openGraph: {
                title: "Varbe - Buy Original Art | Art Marketplace",
                description: "Discover unique artworks directly from independent artists. Fair prices, buyer protection.",
                type: "website",
                locale: locale,
            },
        };
    }
    
    return {
        title: "Varbe - Original Kunst kaufen | Kunstmarktplatz Deutschland",
        description: "Entdecke einzigartige Kunstwerke ab 10€ direkt von unabhängigen Künstlern. Faire Preise, Käuferschutz, schneller Versand. Jetzt stöbern!",
        keywords: "kunst kaufen, original kunstwerke, künstler unterstützen, kunstmarktplatz, kunst online kaufen, originale gemälde",
        openGraph: {
            title: "Varbe - Original Kunst kaufen | Kunstmarktplatz",
            description: "Entdecke einzigartige Kunstwerke direkt von unabhängigen Künstlern. Faire Preise, Käuferschutz.",
            type: "website",
            locale: locale,
        },
    };
}

export function generateCategoryMetadata(category: string, locale: string = 'de'): Metadata {
    const isEnglish = locale === 'en';
    
    const categoryMeta: Record<string, { title: { de: string; en: string }; description: { de: string; en: string } }> = {
        'malerei': {
            title: {
                de: 'Malerei kaufen - Originale ab 10€ | Varbe',
                en: 'Buy Paintings - Originals from €10 | Varbe'
            },
            description: {
                de: 'Entdecke 250+ originale Gemälde von unabhängigen Künstlern. Acryl, Öl, Aquarell. 14 Tage Käuferschutz. Jetzt stöbern!',
                en: 'Discover 250+ original paintings from independent artists. Acrylic, oil, watercolor. 14-day buyer protection. Start browsing!'
            }
        },
        'fotografie': {
            title: {
                de: 'Fotografie kaufen - Originale Kunstfotos | Varbe',
                en: 'Buy Photography - Original Art Photos | Varbe'
            },
            description: {
                de: 'Entdecke einzigartige Fotografien von aufstrebenden und etablierten Fotografen. Direkt vom Künstler.',
                en: 'Discover unique photographs from emerging and established photographers. Directly from the artist.'
            }
        },
        'skulptur': {
            title: {
                de: 'Skulpturen kaufen - Dreidimensionale Kunstwerke | Varbe',
                en: 'Buy Sculptures - Three-Dimensional Artworks | Varbe'
            },
            description: {
                de: 'Finde einzigartige Skulpturen und dreidimensionale Kunstwerke. Von kleinen Figuren bis hin zu großen Installationen.',
                en: 'Find unique sculptures and three-dimensional artworks. From small figures to large installations.'
            }
        },
    };

    const meta = categoryMeta[category] || {
        title: {
            de: `${category} kaufen | Varbe`,
            en: `Buy ${category} | Varbe`
        },
        description: {
            de: `Entdecke ${category} von unabhängigen Künstlern auf Varbe.`,
            en: `Discover ${category} from independent artists on Varbe.`
        }
    };

    const title = isEnglish ? meta.title.en : meta.title.de;
    const description = isEnglish ? meta.description.en : meta.description.de;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            locale: locale,
        },
    };
}

export function generatePageMetadata(title: string, description: string, locale: string = 'de'): Metadata {
    return {
        title: `${title} | Varbe`,
        description: description,
        openGraph: {
            title: `${title} | Varbe`,
            description: description,
            type: "website",
            locale: locale,
        },
    };
}

// Schema.org structured data
export function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Varbe",
        "url": "https://varbe.org",
        "logo": "https://varbe.org/logo.png",
        "description": "Kunstmarktplatz für unabhängige Künstler",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Bremen",
            "addressCountry": "DE"
        },
        "sameAs": [
            "https://instagram.com/varbe.art",
            "https://tiktok.com/@varbe.art"
        ]
    };
}

export function generateProductSchema(artwork: {
    id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    artistName?: string;
}) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": artwork.title,
        "image": artwork.images[0] || "",
        "description": artwork.description,
        "brand": artwork.artistName ? {
            "@type": "Person",
            "name": artwork.artistName
        } : undefined,
        "offers": {
            "@type": "Offer",
            "price": artwork.price.toString(),
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "url": `https://varbe.org/marketplace/${artwork.id}`
        }
    };
}





