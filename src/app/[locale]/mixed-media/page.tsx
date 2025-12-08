"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { getAllListings } from "@/lib/listings";
import { Artwork } from "@/types";
import { useTranslations } from 'next-intl';
import { ArtistLink } from "@/components/ui/ArtistLink";

export default function MixedMediaPage() {
    const t = useTranslations('categories.mixedMedia');
    const tCommon = useTranslations('common');
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                const allArtworks = await getAllListings();
                const filtered = allArtworks.filter(a => 
                    a.adminApprovalStatus === 'approved' && 
                    a.category === 'mixed' &&
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
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <h1 className="text-6xl font-heading mb-6">{t('title')}</h1>
                <p className="text-xl text-gray-700 mb-8 max-w-3xl">
                    {t('description', { count: artworks.length })}
                </p>

                {/* Artworks Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">{tCommon('loading')}</p>
                    </div>
                ) : artworks.length === 0 ? (
                    <div className="card-comic bg-white p-12 text-center">
                        <p className="text-2xl font-heading mb-4">{t('noArtworks')}</p>
                        <p className="font-body text-gray-600 mb-6">
                            {t('noArtworksDesc')}
                        </p>
                        <Link href="/marketplace/create">
                            <Button variant="accent">Kunstwerk listen</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="font-body text-gray-600">
                                {t('foundCount', { count: artworks.length })}
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {artworks.slice(0, 12).map((artwork) => {
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
                                                        <p className="text-xs text-gray-500 uppercase">{tCommon('price')}</p>
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
                        {artworks.length > 12 && (
                            <div className="text-center mt-8">
                                <Link href="/marketplace?category=mixed">
                                    <Button variant="accent" className="text-lg px-8 py-4">
                                        {t('showAll', { count: artworks.length })}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </>
                )}

                {/* SEO Content */}
                <section className="mt-12 space-y-6 font-body text-lg">
                    <h2 className="text-3xl font-heading">{t('seoTitle')}</h2>
                    <p>
                        {t('seoText1')}
                    </p>
                    <h3 className="text-2xl font-heading mt-8">{t('seoTechniquesTitle')}</h3>
                    <p>
                        {t('seoTechniquesText')}
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                        <li><strong>{t('seoTechniques.collage').split(':')[0]}:</strong> {t('seoTechniques.collage').split(':')[1]}</li>
                        <li><strong>{t('seoTechniques.assemblage').split(':')[0]}:</strong> {t('seoTechniques.assemblage').split(':')[1]}</li>
                        <li><strong>{t('seoTechniques.combined').split(':')[0]}:</strong> {t('seoTechniques.combined').split(':')[1]}</li>
                        <li><strong>{t('seoTechniques.digital').split(':')[0]}:</strong> {t('seoTechniques.digital').split(':')[1]}</li>
                        <li><strong>{t('seoTechniques.textile').split(':')[0]}:</strong> {t('seoTechniques.textile').split(':')[1]}</li>
                    </ul>
                    <h3 className="text-2xl font-heading mt-8">{t('seoModernTitle')}</h3>
                    <p>
                        {t('seoModernText')}
                    </p>
                </section>

                {/* CTA */}
                <section className="mt-12 text-center bg-accent p-8 border-4 border-black">
                    <h2 className="text-3xl font-heading mb-4">{t('ctaTitle')}</h2>
                    <p className="text-xl mb-6">
                        {t('ctaText')}
                    </p>
                    <Link href="/marketplace?category=mixed">
                        <Button variant="primary" className="text-lg px-8 py-4">
                            {t('showAll', { count: artworks.length })}
                        </Button>
                    </Link>
                </section>
            </div>
        </div>
    );
}
