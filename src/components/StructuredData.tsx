"use client";

import { Artwork, UserProfile } from "@/types";

interface StructuredDataProps {
    type: 'Product' | 'Person' | 'Organization';
    data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
    const getSchema = () => {
        switch (type) {
            case 'Product':
                return {
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": data.name,
                    "description": data.description,
                    "image": data.image,
                    "brand": {
                        "@type": "Person",
                        "name": data.brandName
                    },
                    "offers": {
                        "@type": "Offer",
                        "url": data.url,
                        "priceCurrency": "EUR",
                        "price": data.price,
                        "availability": data.availability || "https://schema.org/InStock",
                        "seller": {
                            "@type": "Person",
                            "name": data.brandName
                        }
                    }
                };
            case 'Person':
                return {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": data.name,
                    "image": data.image,
                    "url": data.url,
                    "jobTitle": data.jobTitle || "Artist",
                    "sameAs": data.sameAs || []
                };
            case 'Organization':
                return {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": data.name,
                    "url": data.url,
                    "logo": data.logo,
                    "contactPoint": {
                        "@type": "ContactPoint",
                        "contactType": "customer service",
                        "email": data.email
                    }
                };
            default:
                return null;
        }
    };

    const schema = getSchema();
    if (!schema) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * Generate Product schema for an artwork
 */
export function generateProductSchema(artwork: Artwork, artist: UserProfile | null, baseUrl: string) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": artwork.title,
        "description": artwork.description,
        "image": artwork.images || [],
        "brand": artist ? {
            "@type": "Person",
            "name": artist.displayName
        } : undefined,
        "offers": {
            "@type": "Offer",
            "url": `${baseUrl}/marketplace/${artwork.id}`,
            "priceCurrency": "EUR",
            "price": artwork.price.toString(),
            "availability": artwork.status === 'available' || artwork.status === 'auction' 
                ? "https://schema.org/InStock" 
                : "https://schema.org/OutOfStock",
            "seller": artist ? {
                "@type": "Person",
                "name": artist.displayName
            } : undefined
        },
        "category": artwork.category,
        "material": artwork.technique
    };
}

/**
 * Generate Person schema for an artist
 */
export function generatePersonSchema(artist: UserProfile, baseUrl: string) {
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": artist.displayName,
        "image": artist.profilePictureUrl,
        "url": `${baseUrl}/profile/${artist.uid}`,
        "jobTitle": "Artist",
        "description": `Artist profile for ${artist.displayName} on Varbe`
    };
}

/**
 * Generate Organization schema for Varbe
 */
export function generateOrganizationSchema(baseUrl: string) {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Varbe",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "description": "Online marketplace for authentic artworks from verified artists",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@varbe.de"
        }
    };
}



