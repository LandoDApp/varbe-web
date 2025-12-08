"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { getUserListings } from "@/lib/listings";
import { getUserOrders, getUserSales } from "@/lib/orders";
import { getSellerEarnings } from "@/lib/earnings";
import { migrateOrdersToNewFeeSystem } from "@/lib/migrate-orders";
import { getDaysUntilDeadline, getBusinessDaysSincePayment } from "@/lib/shipping";
import { Artwork, Order, SellerBalance } from "@/types";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/Button";

export default function ArtistDashboardPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('artist.dashboard');
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<Artwork[]>([]);
    const [sales, setSales] = useState<Order[]>([]);
    const [purchases, setPurchases] = useState<Order[]>([]);
    const [balance, setBalance] = useState<SellerBalance | null>(null);
    const [stripeStatus, setStripeStatus] = useState<{connected: boolean, status: string} | null>(null);
    const [loadingStripe, setLoadingStripe] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push("/auth/login");
            return;
        }

        if (profile?.verificationStatus !== 'verified' && profile?.role !== 'admin') {
            router.push("/artist/verify");
            return;
        }

        fetchData();
        fetchStripeStatus();
    }, [user, profile, authLoading, router]);

    const fetchStripeStatus = async () => {
        if (!user) return;
        try {
            const response = await fetch(`/api/stripe/connect/onboard?userId=${user.uid}`);
            if (response.ok) {
                const data = await response.json();
                setStripeStatus(data);
            }
        } catch (error) {
            console.error("Error fetching Stripe status:", error);
        }
    };

    const handleStripeConnect = async () => {
        if (!user) return;
        setLoadingStripe(true);
        try {
            const response = await fetch('/api/stripe/connect/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Error creating Stripe Connect link:", error);
        } finally {
            setLoadingStripe(false);
        }
    };

    const fetchData = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const [userListings, userSales, userPurchases, earningsData] = await Promise.all([
                getUserListings(user.uid),
                getUserSales(user.uid),
                getUserOrders(user.uid),
                getSellerEarnings(user.uid),
            ]);
            
            setListings(userListings);
            setSales(earningsData.orders);
            setPurchases(userPurchases);
            setBalance(earningsData.balance);
        } catch (error) {
            console.error("Error fetching artist dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Use balance from earnings calculation if available
    const totalEarnings = balance?.totalEarnings || 0;
    const availableBalance = balance?.availableBalance || 0;
    const pendingBalance = balance?.pendingBalance || 0;
    
    const nextPayoutDate = balance?.nextPayoutDate 
        ? new Date(balance.nextPayoutDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const approvedListings = listings.filter(l => l.adminApprovalStatus === 'approved');
    const pendingListings = listings.filter(l => l.adminApprovalStatus === 'pending');
    const soldListings = listings.filter(l => l.status === 'sold');
    const activeListings = listings.filter(l => 
        l.adminApprovalStatus === 'approved' && 
        (l.status === 'available' || l.status === 'auction')
    );

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">{t('loading')}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8">
                <h1 className="text-4xl font-heading mb-6">{t('title')}</h1>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Link href="/feed/create">
                        <Button variant="accent" className="text-lg">
                            📷 Post erstellen
                        </Button>
                    </Link>
                    <Link href="/artist/subscriptions">
                        <Button variant="secondary" className="text-lg">
                            💜 Abonnements verwalten
                        </Button>
                    </Link>
                </div>
                
                {/* Coming Soon Notice */}
                <div className="card-comic bg-gradient-to-r from-accent/20 to-pink-100 border-4 border-black p-4 mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎨</span>
                        <div>
                            <p className="font-heading text-lg">Marketplace & Aufträge Coming Soon</p>
                            <p className="font-body text-sm text-gray-600">
                                Der Verkauf von Kunstwerken und die Kommissionsbörse werden bald verfügbar sein. Baue jetzt deine Community im Feed auf!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card-comic bg-white border-4 border-black p-6">
                        <h3 className="text-lg font-heading mb-2">{t('availableBalance')}</h3>
                        <p className="text-3xl font-bold text-green-600">
                            €{availableBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {pendingBalance > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                €{pendingBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('pendingBalance')}
                            </p>
                        )}
                        {nextPayoutDate && (
                            <p className="text-xs text-gray-500 mt-1">
                                {t('nextPayout')}: {nextPayoutDate}
                            </p>
                        )}
                    </div>
                    
                    <div className="card-comic bg-white border-4 border-black p-6">
                        <h3 className="text-lg font-heading mb-2">{t('totalEarnings')}</h3>
                        <p className="text-3xl font-bold text-blue-600">
                            €{totalEarnings.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('lifetimeTotal')}
                        </p>
                    </div>

                    <div className="card-comic bg-white border-4 border-black p-6">
                        <h3 className="text-lg font-heading mb-2">{t('activeListings')}</h3>
                        <p className="text-3xl font-bold">{activeListings.length}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {pendingListings.length} {t('pendingApproval')}
                        </p>
                    </div>

                    <div className="card-comic bg-white border-4 border-black p-6">
                        <h3 className="text-lg font-heading mb-2">{t('soldArtworks')}</h3>
                        <p className="text-3xl font-bold">{soldListings.length}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {approvedListings.length} {t('totalApproved')}
                        </p>
                    </div>

                    <div className="card-comic bg-white border-4 border-black p-6">
                        <h3 className="text-lg font-heading mb-2">{t('totalSales')}</h3>
                        <p className="text-3xl font-bold">{sales.length}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {sales.filter(s => s.status === 'delivered').length} {t('completed')}
                        </p>
                    </div>
                </div>

                {/* Stripe Connect Status */}
                {stripeStatus && (
                    <div className="mb-8">
                        <div className={`card-comic bg-white border-4 ${
                            stripeStatus.status === 'active' ? 'border-green-500' : 'border-yellow-500'
                        } p-6`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-heading mb-2">
                                        {stripeStatus.status === 'active' ? '✅ Stripe Connect verbunden' : '⚠️ Stripe Connect ausstehend'}
                                    </h3>
                                    <p className="font-body text-gray-600">
                                        {stripeStatus.status === 'active' 
                                            ? 'Du kannst Auszahlungen erhalten. Auszahlungen erfolgen automatisch am 15. jedes Monats.'
                                            : 'Um Auszahlungen zu erhalten, musst du Stripe Connect einrichten. Dies dauert nur wenige Minuten.'}
                                    </p>
                                </div>
                                {stripeStatus.status !== 'active' && (
                                    <Button
                                        onClick={handleStripeConnect}
                                        disabled={loadingStripe}
                                        variant="accent"
                                        className="text-lg px-6 py-3"
                                    >
                                        {loadingStripe ? 'Lädt...' : 'Stripe Connect einrichten'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Needing Tracking */}
                {(() => {
                    const ordersNeedingTracking = sales.filter(order => {
                        if (order.status !== 'paid') return false;
                        return !order.trackingNumber;
                    });
                    
                    if (ordersNeedingTracking.length > 0) {
                        return (
                            <div className="mb-8">
                                <h2 className="text-2xl font-heading mb-4">
                                    {t('ordersNeedingTracking', { count: ordersNeedingTracking.length })}
                                </h2>
                                <div className="space-y-4">
                                    {ordersNeedingTracking.map((order) => {
                                        const paymentTimestamp = order.paidAt || order.createdAt;
                                        const businessDaysSincePayment = getBusinessDaysSincePayment(paymentTimestamp);
                                        const daysUntilDeadline = order.shippingDeadline 
                                            ? getDaysUntilDeadline(order.shippingDeadline) 
                                            : null;
                                        const isDeadlinePassed = order.shippingDeadline && Date.now() > order.shippingDeadline;
                                        
                                        return (
                                            <div key={order.id} className={`card-comic bg-white border-4 ${
                                                isDeadlinePassed ? 'border-red-500 bg-red-50' : 
                                                daysUntilDeadline !== null && daysUntilDeadline <= 2 ? 'border-yellow-500 bg-yellow-50' : 
                                                'border-black'
                                            } p-4`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-heading text-lg mb-2">
                                                            {t('orderNumber', { id: order.id.slice(0, 8) })}
                                                        </p>
                                                        {isDeadlinePassed ? (
                                                            <p className="text-sm text-red-600 font-bold mb-2">
                                                                {t('deadlinePassed', { days: businessDaysSincePayment })}
                                                            </p>
                                                        ) : daysUntilDeadline !== null ? (
                                                            <p className={`text-sm font-semibold mb-2 ${
                                                                daysUntilDeadline <= 2 ? 'text-yellow-600' : 'text-gray-700'
                                                            }`}>
                                                                {t('daysUntilDeadline', { days: daysUntilDeadline })}
                                                                <br />
                                                                <span className="text-xs text-gray-600">
                                                                    {t('deadline')}: {order.shippingDeadline ? new Date(order.shippingDeadline).toLocaleDateString('de-DE', { 
                                                                        day: 'numeric', 
                                                                        month: 'long', 
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    }) : '-'}
                                                                </span>
                                                            </p>
                                                        ) : null}
                                                        <p className="text-sm text-gray-600">
                                                            {t('salePrice')}: €{(Number(order.salePrice || order.amount) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        {order.artistEarnings && (
                                                            <p className="text-sm text-green-600 font-semibold">
                                                                {t('yourShare')}: €{order.artistEarnings.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 ml-4">
                                                        <Link
                                                            href={`/artist/orders#order-${order.id}`}
                                                            className="card-comic bg-blue-500 text-white border-2 border-black px-4 py-2 hover:bg-blue-600 transition-colors text-center"
                                                        >
                                                            {t('addTracking')}
                                                        </Link>
                                                        <Link
                                                            href={`/orders/${order.id}`}
                                                            className="text-black underline decoration-accent decoration-2 underline-offset-2 text-sm text-center"
                                                        >
                                                            {t('details')}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Recent Sales */}
                {sales.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-heading mb-4">{t('recentSales')}</h2>
                        <div className="space-y-4">
                            {sales.slice(0, 5).map((sale) => {
                                const paymentTimestamp = sale.paidAt || sale.createdAt;
                                const businessDaysSincePayment = sale.status === 'paid' 
                                    ? getBusinessDaysSincePayment(paymentTimestamp) 
                                    : 0;
                                const daysUntilDeadline = sale.shippingDeadline 
                                    ? getDaysUntilDeadline(sale.shippingDeadline) 
                                    : null;
                                const isDeadlinePassed = sale.shippingDeadline && Date.now() > sale.shippingDeadline;
                                const needsTracking = sale.status === 'paid' && !sale.trackingNumber;
                                
                                return (
                                    <div key={sale.id} className={`card-comic bg-white border-4 ${
                                        needsTracking && isDeadlinePassed ? 'border-red-500' : 
                                        needsTracking && daysUntilDeadline !== null && daysUntilDeadline <= 2 ? 'border-yellow-500' : 
                                        'border-black'
                                    } p-4`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-heading text-lg">
                                                    {t('orderNumber', { id: sale.id.slice(0, 8) })}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {t('status')}: <span className={`font-bold ${
                                                        sale.status === 'paid' || sale.status === 'delivered' 
                                                            ? 'text-green-600' 
                                                            : sale.status === 'pending' 
                                                            ? 'text-yellow-600' 
                                                            : 'text-red-600'
                                                    }`}>
                                                        {sale.status}
                                                    </span>
                                                </p>
                                                
                                                {needsTracking && (
                                                    <div className="mt-2">
                                                        {isDeadlinePassed ? (
                                                            <p className="text-sm text-red-600 font-bold">
                                                                {t('trackingNeededUrgent', { days: businessDaysSincePayment })}
                                                            </p>
                                                        ) : daysUntilDeadline !== null ? (
                                                            <p className={`text-sm font-semibold ${
                                                                daysUntilDeadline <= 2 ? 'text-yellow-600' : 'text-gray-700'
                                                            }`}>
                                                                {t('trackingNeeded', { days: daysUntilDeadline })}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                )}
                                                
                                                {sale.trackingNumber && (
                                                    <div className="mt-2 p-2 bg-gray-100 border-2 border-gray-300 rounded">
                                                        <p className="text-sm">
                                                            <strong>{t('tracking')}:</strong> {sale.trackingNumber}
                                                        </p>
                                                        {sale.shippingProvider && (
                                                            <p className="text-xs text-gray-600">
                                                                {t('shippingProvider')}: {sale.shippingProvider}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <p className="text-sm text-gray-600 mt-2">
                                                    {t('salePrice')}: €{(Number(sale.salePrice || sale.amount) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                {sale.artistEarnings && (
                                                    <p className="text-sm text-green-600 font-semibold">
                                                        {t('yourShare')}: €{sale.artistEarnings.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                                {sale.buyerProtectionEndsAt && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {t('buyerProtectionUntil')}: {new Date(sale.buyerProtectionEndsAt).toLocaleDateString('de-DE')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                {needsTracking && (
                                                    <Link
                                                        href={`/artist/orders#order-${sale.id}`}
                                                        className="card-comic bg-blue-500 text-white border-2 border-black px-4 py-2 hover:bg-blue-600 transition-colors text-center text-sm"
                                                    >
                                                        📝 Tracking hinzufügen
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/orders/${sale.id}`}
                                                    className="text-black underline decoration-accent decoration-2 underline-offset-2 text-sm text-center"
                                                >
                                                    {t('details')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Active Listings */}
                {activeListings.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-heading mb-4">{t('activeListings')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeListings.slice(0, 6).map((listing) => (
                                <Link
                                    key={listing.id}
                                    href={`/marketplace/${listing.id}`}
                                    className="card-comic bg-white border-4 border-black p-4 hover:shadow-lg transition-shadow"
                                >
                                    {listing.images && listing.images.length > 0 && (
                                        <img
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            className="w-full h-48 object-cover mb-2"
                                        />
                                    )}
                                    <h3 className="font-heading text-lg mb-1">{listing.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {listing.listingType === 'auction' 
                                            ? `Current Bid: €${listing.currentBid || listing.price}` 
                                            : `Price: €${listing.price}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {listing.status === 'auction' ? '🕐 Auction' : '💰 Buy Now'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

