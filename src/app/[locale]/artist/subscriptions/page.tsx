"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import { 
    getArtistTiers, 
    createDefaultTiers, 
    updateSubscriptionTier,
    getArtistSubscribers,
    getArtistSubscriptionRevenue,
} from "@/lib/subscriptions";
import { getUserProfile } from "@/lib/db";
import { ArtistSubscriptionTier, Subscription, SubscriptionTier, UserProfile } from "@/types";
import { formatPrice } from "@/lib/utils";

const TIER_INFO: Record<SubscriptionTier, { icon: string; color: string; bgColor: string }> = {
    fan: { icon: '💚', color: 'text-green-700', bgColor: 'bg-green-100' },
    supporter: { icon: '💙', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    patron: { icon: '💜', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

export default function ArtistSubscriptionsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [tiers, setTiers] = useState<ArtistSubscriptionTier[]>([]);
    const [subscribers, setSubscribers] = useState<Subscription[]>([]);
    const [subscriberProfiles, setSubscriberProfiles] = useState<Record<string, UserProfile>>({});
    const [revenue, setRevenue] = useState({ totalRevenue: 0, totalEarnings: 0, paymentsCount: 0 });
    const [loading, setLoading] = useState(true);
    const [editingTier, setEditingTier] = useState<ArtistSubscriptionTier | null>(null);
    const [savingTier, setSavingTier] = useState(false);
    
    // Fetch data
    const fetchData = useCallback(async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const [artistTiers, artistSubscribers, artistRevenue] = await Promise.all([
                getArtistTiers(user.uid),
                getArtistSubscribers(user.uid),
                getArtistSubscriptionRevenue(user.uid),
            ]);
            
            setTiers(artistTiers);
            setSubscribers(artistSubscribers);
            setRevenue(artistRevenue);
            
            // Fetch subscriber profiles
            const profiles: Record<string, UserProfile> = {};
            await Promise.all(
                artistSubscribers.map(async (sub) => {
                    const profile = await getUserProfile(sub.subscriberId);
                    if (profile) profiles[sub.subscriberId] = profile;
                })
            );
            setSubscriberProfiles(profiles);
            
        } catch (error) {
            console.error("Error fetching subscription data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Auth check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, authLoading, router]);
    
    // Create default tiers
    const handleCreateDefaultTiers = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            await createDefaultTiers(user.uid);
            await fetchData();
        } catch (error: any) {
            console.error("Error creating tiers:", error);
            alert(`Fehler: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Save tier edits
    const handleSaveTier = async () => {
        if (!editingTier) return;
        
        setSavingTier(true);
        try {
            await updateSubscriptionTier(editingTier.id, {
                name: editingTier.name,
                price: editingTier.price,
                benefits: editingTier.benefits,
                exclusiveContent: editingTier.exclusiveContent,
                monthlyDrops: editingTier.monthlyDrops,
                earlyAccess: editingTier.earlyAccess,
                discountPercent: editingTier.discountPercent,
                monthlyPrint: editingTier.monthlyPrint,
                videoCall: editingTier.videoCall,
            });
            
            setEditingTier(null);
            await fetchData();
        } catch (error: any) {
            console.error("Error saving tier:", error);
            alert(`Fehler: ${error.message}`);
        } finally {
            setSavingTier(false);
        }
    };
    
    // Toggle tier active status
    const handleToggleTier = async (tier: ArtistSubscriptionTier) => {
        try {
            await updateSubscriptionTier(tier.id, { isActive: !tier.isActive });
            await fetchData();
        } catch (error: any) {
            alert(`Fehler: ${error.message}`);
        }
    };
    
    // Format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('de-DE');
    };
    
    // Not verified
    if (!authLoading && profile?.verificationStatus !== 'verified') {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8 max-w-xl">
                    <div className="card-comic bg-white p-8 text-center">
                        <span className="text-6xl">🎨</span>
                        <h1 className="text-3xl font-heading mt-4 mb-2">Nur für verifizierte Künstler</h1>
                        <p className="text-gray-600 mb-6">
                            Abonnements sind nur für verifizierte Künstler verfügbar.
                        </p>
                        <Link href="/artist/verify">
                            <Button variant="accent">Jetzt verifizieren</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-halftone bg-[length:20px_20px]">
            <Navbar />
            
            <div className="container mx-auto px-4 py-6 max-w-5xl">
                {/* Header */}
                <div className="card-comic bg-gradient-to-r from-purple-100 to-pink-100 p-6 mb-6">
                    <h1 className="text-3xl md:text-4xl font-heading mb-2">💜 MEINE ABONNEMENTS</h1>
                    <p className="text-gray-700">
                        Verwalte deine Subscription-Tiers und sieh deine Supporter.
                    </p>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="card-comic bg-white p-4 text-center">
                        <p className="text-4xl font-heading text-purple-600">
                            {subscribers.length}
                        </p>
                        <p className="text-gray-600">Aktive Abonnenten</p>
                    </div>
                    <div className="card-comic bg-white p-4 text-center">
                        <p className="text-4xl font-heading text-green-600">
                            €{formatPrice(revenue.totalEarnings)}
                        </p>
                        <p className="text-gray-600">Verdient (netto)</p>
                    </div>
                    <div className="card-comic bg-white p-4 text-center">
                        <p className="text-4xl font-heading text-blue-600">
                            {revenue.paymentsCount}
                        </p>
                        <p className="text-gray-600">Zahlungen</p>
                    </div>
                </div>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading">Lade Daten...</p>
                    </div>
                ) : (
                    <>
                        {/* Tiers Section */}
                        <div className="card-comic bg-white p-6 mb-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
                                <h2 className="text-2xl font-heading">🎁 Deine Abo-Stufen</h2>
                            </div>
                            
                            {tiers.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-6xl">💎</span>
                                    <h3 className="text-xl font-heading mt-4 mb-2">
                                        Keine Abo-Stufen eingerichtet
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Erstelle deine ersten Abo-Stufen, um Fans zu unterstützen!
                                    </p>
                                    <Button onClick={handleCreateDefaultTiers} variant="accent">
                                        ✨ Standard-Stufen erstellen
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {tiers.map((tier) => {
                                        const info = TIER_INFO[tier.tier];
                                        return (
                                            <div key={tier.id} className={`border-4 border-black p-4 ${info.bgColor}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-3xl">{info.icon}</span>
                                                    <span className="text-xs font-bold bg-white px-2 py-1 border border-black">
                                                        {tier.subscriberCount || 0} Abonnenten
                                                    </span>
                                                </div>
                                                
                                                <h3 className={`text-xl font-heading ${info.color}`}>
                                                    {tier.name}
                                                </h3>
                                                <p className="text-3xl font-heading mb-3">
                                                    €{tier.price}<span className="text-sm">/Monat</span>
                                                </p>
                                                
                                                <ul className="text-sm space-y-1 mb-4">
                                                    {tier.benefits.slice(0, 3).map((benefit, idx) => (
                                                        <li key={idx} className="flex items-start gap-1">
                                                            <span>✓</span>
                                                            <span>{benefit}</span>
                                                        </li>
                                                    ))}
                                                    {tier.benefits.length > 3 && (
                                                        <li className="text-gray-500">
                                                            +{tier.benefits.length - 3} weitere
                                                        </li>
                                                    )}
                                                </ul>
                                                
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => setEditingTier({ ...tier })}
                                                        variant="secondary"
                                                        className="flex-1 text-sm"
                                                    >
                                                        ✏️ Bearbeiten
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        {/* Subscribers Section */}
                        <div className="card-comic bg-white p-6">
                            <h2 className="text-2xl font-heading mb-4 pb-4 border-b-4 border-black">
                                👥 Deine Abonnenten ({subscribers.length})
                            </h2>
                            
                            {subscribers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <span className="text-4xl">💫</span>
                                    <p className="mt-2">Noch keine Abonnenten</p>
                                    <p className="text-sm">Teile deinen Profil-Link, um Supporter zu gewinnen!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subscribers.map((sub) => {
                                        const subProfile = subscriberProfiles[sub.subscriberId];
                                        const tierInfo = TIER_INFO[sub.tier];
                                        const subTier = tiers.find(t => t.id === sub.tierId);
                                        
                                        return (
                                            <div key={sub.id} className="flex items-center gap-4 p-3 border-2 border-gray-200 rounded">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                                                    {subProfile?.profilePictureUrl ? (
                                                        <img src={subProfile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full">👤</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <p className="font-bold">
                                                        {subProfile?.displayName || 'Unbekannt'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Seit {formatDate(sub.subscribedAt)}
                                                    </p>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <span className={`inline-block px-2 py-1 text-xs font-bold border border-black ${tierInfo.bgColor} ${tierInfo.color}`}>
                                                        {tierInfo.icon} {subTier?.name || sub.tier}
                                                    </span>
                                                    <p className="text-lg font-heading mt-1">
                                                        €{sub.price}/Mo
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Edit Tier Modal */}
            {editingTier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-4 border-black max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b-4 border-black flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="font-heading text-xl">
                                {TIER_INFO[editingTier.tier].icon} {editingTier.tier} bearbeiten
                            </h3>
                            <button onClick={() => setEditingTier(null)} className="text-2xl">✕</button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block font-bold mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editingTier.name}
                                    onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                                    className="input-comic"
                                />
                            </div>
                            
                            <div>
                                <label className="block font-bold mb-2">Preis (EUR/Monat)</label>
                                <input
                                    type="number"
                                    value={editingTier.price}
                                    onChange={(e) => setEditingTier({ ...editingTier, price: Number(e.target.value) })}
                                    min={1}
                                    className="input-comic"
                                />
                            </div>
                            
                            <div>
                                <label className="block font-bold mb-2">
                                    Vorteile (einer pro Zeile)
                                </label>
                                <textarea
                                    value={editingTier.benefits.join('\n')}
                                    onChange={(e) => setEditingTier({ 
                                        ...editingTier, 
                                        benefits: e.target.value.split('\n').filter(b => b.trim()) 
                                    })}
                                    className="input-comic h-32 resize-none"
                                    placeholder="Ein Vorteil pro Zeile..."
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingTier.exclusiveContent}
                                        onChange={(e) => setEditingTier({ ...editingTier, exclusiveContent: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span>Exklusive Posts</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingTier.earlyAccess}
                                        onChange={(e) => setEditingTier({ ...editingTier, earlyAccess: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span>Early Access</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingTier.monthlyDrops}
                                        onChange={(e) => setEditingTier({ ...editingTier, monthlyDrops: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span>Monatliche Drops</span>
                                </label>
                            </div>
                            
                            {(editingTier.tier === 'supporter' || editingTier.tier === 'patron') && (
                                <div>
                                    <label className="block font-bold mb-2">Rabatt (%)</label>
                                    <input
                                        type="number"
                                        value={editingTier.discountPercent || 0}
                                        onChange={(e) => setEditingTier({ ...editingTier, discountPercent: Number(e.target.value) })}
                                        min={0}
                                        max={50}
                                        className="input-comic"
                                    />
                                </div>
                            )}
                            
                            <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                                <Button
                                    onClick={() => setEditingTier(null)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Abbrechen
                                </Button>
                                <Button
                                    onClick={handleSaveTier}
                                    variant="accent"
                                    disabled={savingTier}
                                    className="flex-1"
                                >
                                    {savingTier ? 'Speichern...' : '💾 Speichern'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}





