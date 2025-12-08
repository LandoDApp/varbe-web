"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { getAllListings } from "@/lib/listings";
import { Artwork, ArtCategory } from "@/types";
import { ArtistLink } from "@/components/ui/ArtistLink";

const categoryInfo: Record<string, { title: string; description: string; slug: string }> = {
    'malerei': {
        title: 'Malerei kaufen - Originale direkt vom Künstler',
        description: 'Entdecke über 250 originale Gemälde von unabhängigen Künstlern. Von abstrakten Acrylbildern bis hin zu realistischen Ölgemälden. Alle Kunstwerke sind Unikate und kommen direkt vom Künstler zu dir nach Hause.',
        slug: 'malerei'
    },
    'fotografie': {
        title: 'Fotografie kaufen - Originale Kunstfotos',
        description: 'Entdecke einzigartige Fotografien von aufstrebenden und etablierten Fotografen. Von Landschaftsfotografie über Porträts bis hin zu abstrakten Kompositionen.',
        slug: 'fotografie'
    },
    'skulptur': {
        title: 'Skulpturen kaufen - Dreidimensionale Kunstwerke',
        description: 'Finde einzigartige Skulpturen und dreidimensionale Kunstwerke. Von kleinen Figuren bis hin zu großen Installationen.',
        slug: 'skulptur'
    },
    'zeichnung': {
        title: 'Zeichnungen kaufen - Originale Skizzen und Grafiken',
        description: 'Entdecke originale Zeichnungen, Skizzen und grafische Arbeiten. Von Bleistiftzeichnungen über Tusche bis hin zu Mixed-Media-Arbeiten.',
        slug: 'zeichnung'
    },
    'digital-art': {
        title: 'Digitale Kunst kaufen - NFTs und digitale Werke',
        description: 'Kaufe digitale Kunstwerke und NFTs direkt von Künstlern. Sofortiger Download nach Kauf, keine Versandkosten.',
        slug: 'digital-art'
    },
    'mixed-media': {
        title: 'Mixed Media kaufen - Experimentelle Kunstwerke',
        description: 'Entdecke Mixed-Media-Kunstwerke, die verschiedene Materialien und Techniken kombinieren. Einzigartige und experimentelle Arbeiten.',
        slug: 'mixed-media'
    }
};

const categoryMapping: Record<string, ArtCategory> = {
    'malerei': 'painting',
    'fotografie': 'photography',
    'skulptur': 'sculpture',
    'zeichnung': 'other', // Using 'other' for drawings
    'digital-art': 'digital',
    'mixed-media': 'mixed',
    'kunsthandwerk': 'crafts'
};

export default async function CategoryPage({ params }: { params: Promise<{ category: string; locale: string }> }) {
    const { category } = await params;
    const categoryData = categoryInfo[category] || { title: 'Kategorie', description: '', slug: category };
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                const allArtworks = await getAllListings();
                const category = categoryMapping[categoryData.slug];
                const filtered = allArtworks.filter(a => 
                    a.adminApprovalStatus === 'approved' && 
                    a.category === category &&
                    a.status !== 'ended' &&
                    !(a.status === 'sold' && (a.quantity === undefined || a.quantity === 0))
                );
                setArtworks(filtered);
            } catch (error) {
                console.error("Error fetching artworks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArtworks();
    }, [categoryData.slug]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <h1 className="text-6xl font-heading mb-6">{categoryData.title}</h1>
                <p className="text-xl text-gray-700 mb-8 max-w-3xl">
                    {categoryData.description}
                </p>

                {/* Subcategories */}
                <section className="mb-12">
                    <h2 className="text-3xl font-heading mb-6">Beliebte Techniken</h2>
                    <div className="flex flex-wrap gap-4">
                        {categoryData.slug === 'malerei' && (
                            <>
                                <Link href="/kategorien/malerei/acryl">
                                    <Button variant="accent" className="text-lg px-6 py-3">
                                        Acrylmalerei ({artworks.filter(a => a.technique === 'acrylic').length} Werke)
                                    </Button>
                                </Link>
                                <Link href="/kategorien/malerei/oel">
                                    <Button variant="primary" className="text-lg px-6 py-3">
                                        Ölmalerei ({artworks.filter(a => a.technique === 'oil').length} Werke)
                                    </Button>
                                </Link>
                                <Link href="/kategorien/malerei/aquarell">
                                    <Button variant="accent" className="text-lg px-6 py-3">
                                        Aquarell ({artworks.filter(a => a.technique === 'watercolor').length} Werke)
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                {/* Artworks Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">Lade Kunstwerke...</p>
                    </div>
                ) : artworks.length === 0 ? (
                    <div className="card-comic bg-white p-12 text-center">
                        <p className="text-2xl font-heading mb-4">Noch keine Kunstwerke in dieser Kategorie</p>
                        <p className="font-body text-gray-600 mb-6">
                            Werde der erste Künstler, der in dieser Kategorie verkauft!
                        </p>
                        <Link href="/marketplace/create">
                            <Button variant="accent">Kunstwerk listen</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="font-body text-gray-600">
                                <span className="font-bold text-black">{artworks.length}</span> Kunstwerke gefunden
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {artworks.map((artwork) => {
                                const displayPrice = artwork.currentBid || artwork.price;
                                return (
                                    <Link key={artwork.id} href={`/marketplace/${artwork.id}`}>
                                        <div className="card-comic bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group">
                                            <div className="aspect-square bg-gray-100 border-b-4 border-black relative overflow-hidden">
                                                {artwork.images[0] ? (
                                                    <img
                                                        src={artwork.images[0]}
                                                        alt={artwork.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-heading">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <h3 className="font-heading text-xl line-clamp-1">{artwork.title}</h3>
                                                <p className="font-body text-sm text-gray-600 line-clamp-2">{artwork.description}</p>
                                                <div className="text-xs text-gray-500">
                                                    von <ArtistLink artistId={artwork.artistId} className="font-semibold" asSpan={true} />
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-gray-300">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Preis</p>
                                                        <p className="font-heading text-2xl">€{displayPrice.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{artwork.technique}</p>
                                                        <p className="text-xs text-gray-500">{artwork.dimensions}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* CTA */}
                <section className="mt-12 text-center bg-accent p-8 border-4 border-black">
                    <h2 className="text-3xl font-heading mb-4">Nicht das Richtige gefunden?</h2>
                    <p className="text-xl mb-6">
                        Stöbere durch alle Kategorien oder suche nach einem bestimmten Stil.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/marketplace">
                            <Button variant="primary" className="text-lg px-6 py-3">
                                Alle Kunstwerke
                            </Button>
                        </Link>
                        <Link href="/kategorien">
                            <Button variant="accent" className="text-lg px-6 py-3">
                                Alle Kategorien
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

