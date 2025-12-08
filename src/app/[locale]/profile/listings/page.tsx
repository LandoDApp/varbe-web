"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/context/AuthContext";
import { getUserListings } from "@/lib/listings";
import { Artwork } from "@/types";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function ProfileListingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const t = useTranslations('profile.listings');
    const tCommon = useTranslations('common');
    const [listings, setListings] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
    }, [user, router]);

    useEffect(() => {
        const fetchListings = async () => {
            if (!user) return;
            try {
                const data = await getUserListings(user.uid);
                setListings(data);
            } catch (error) {
                console.error("Error fetching listings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [user]);

    if (!user) return null;

    const getStatusBadge = (listing: Artwork) => {
        if (listing.adminApprovalStatus === 'pending') {
            return <span className="bg-yellow-500 text-white px-3 py-1 text-xs font-bold border-2 border-black">{t('status.pending')}</span>;
        }
        if (listing.adminApprovalStatus === 'rejected') {
            return <span className="bg-red-500 text-white px-3 py-1 text-xs font-bold border-2 border-black">{t('status.rejected')}</span>;
        }
        if (listing.status === 'sold') {
            return <span className="bg-green-500 text-white px-3 py-1 text-xs font-bold border-2 border-black">{t('status.sold')}</span>;
        }
        return <span className="bg-green-600 text-white px-3 py-1 text-xs font-bold border-2 border-black">{t('status.active')}</span>;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">{tCommon('loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-5xl font-heading mb-2">{t('title')}</h1>
                    <p className="font-body text-xl text-gray-600">
                        {t('listingsCount', { count: listings.length })}
                    </p>
                </div>

                {listings.length === 0 ? (
                    <div className="card-comic bg-white p-12 text-center">
                        <p className="text-2xl font-heading mb-4">{t('noListings')}</p>
                        <Link href="/marketplace/create">
                            <button className="bg-accent text-black px-6 py-3 font-heading border-2 border-black hover:translate-x-1 hover:translate-y-1 transition-all">
                                {t('createFirst')}
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => (
                            <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                                <div className="card-comic bg-white border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
                                    <div className="aspect-square border-b-4 border-black overflow-hidden">
                                        {listing.images[0] ? (
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-xl font-heading line-clamp-2">{listing.title}</h3>
                                            {getStatusBadge(listing)}
                                        </div>
                                        <p className="text-2xl font-heading mb-2">
                                            €{listing.price.toLocaleString()}
                                        </p>
                                        <p className="text-sm font-body text-gray-600">
                                            {listing.category} • {listing.technique}
                                        </p>
                                        {listing.adminRejectionReason && (
                                            <p className="text-xs text-red-600 mt-2 font-bold">
                                                {t('rejection')}: {listing.adminRejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

