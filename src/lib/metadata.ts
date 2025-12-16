import type { Metadata } from "next";

export function generateHomepageMetadata(locale: string = 'de'): Metadata {
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
    const categoryMeta: Record<string, { title: string; description: string }> = {
        'malerei': {
            title: 'Malerei kaufen - Originale ab 10€ | Varbe',
            description: 'Entdecke 250+ originale Gemälde von unabhängigen Künstlern. Acryl, Öl, Aquarell. 14 Tage Käuferschutz. Jetzt stöbern!'
        },
        'fotografie': {
            title: 'Fotografie kaufen - Originale Kunstfotos | Varbe',
            description: 'Entdecke einzigartige Fotografien von aufstrebenden und etablierten Fotografen. Direkt vom Künstler.'
        },
        'skulptur': {
            title: 'Skulpturen kaufen - Dreidimensionale Kunstwerke | Varbe',
            description: 'Finde einzigartige Skulpturen und dreidimensionale Kunstwerke. Von kleinen Figuren bis hin zu großen Installationen.'
        },
    };

    const meta = categoryMeta[category] || {
        title: `${category} kaufen | Varbe`,
        description: `Entdecke ${category} von unabhängigen Künstlern auf Varbe.`
    };

    return {
        title: meta.title,
        description: meta.description,
        openGraph: {
            title: meta.title,
            description: meta.description,
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





