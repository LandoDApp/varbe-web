"use client";

import { useState, useEffect } from "react";
import { Button } from "./Button";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import { 
    getArtistTiers, 
    getUserSubscriptionToArtist, 
    createSubscription,
    cancelSubscription,
    changeSubscriptionTier,
} from "@/lib/subscriptions";
import { ArtistSubscriptionTier, Subscription, SubscriptionTier } from "@/types";

interface SubscriptionTiersProps {
    artistId: string;
    artistName: string;
}

const TIER_INFO: Record<SubscriptionTier, { icon: string; color: string; bgColor: string; borderColor: string }> = {
    fan: { icon: '💚', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-400' },
    supporter: { icon: '💙', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-400' },
    patron: { icon: '💜', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-400' },
};

export function SubscriptionTiers({ artistId, artistName }: SubscriptionTiersProps) {
    const { user } = useAuth();
    const router = useRouter();
    
    const [tiers, setTiers] = useState<ArtistSubscriptionTier[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
    
    // Fetch tiers and subscription
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const artistTiers = await getArtistTiers(artistId);
                setTiers(artistTiers);
                
                if (user) {
                    const sub = await getUserSubscriptionToArtist(user.uid, artistId);
                    setCurrentSubscription(sub);
                }
            } catch (error) {
                console.error("Error fetching subscription data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [artistId, user]);
    
    // Subscribe handler
    const handleSubscribe = async (tier: ArtistSubscriptionTier) => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
        
        setSubscribing(true);
        setSelectedTierId(tier.id);
        
        try {
            // If already subscribed, change tier
            if (currentSubscription) {
                await changeSubscriptionTier(
                    currentSubscription.id,
                    tier.id,
                    tier.tier,
                    tier.price
                );
                
                // Refresh subscription
                const sub = await getUserSubscriptionToArtist(user.uid, artistId);
                setCurrentSubscription(sub);
                
                alert(`Du bist jetzt ${tier.name}! 🎉`);
            } else {
                // Create new subscription
                await createSubscription({
                    subscriberId: user.uid,
                    artistId,
                    tierId: tier.id,
                    tier: tier.tier,
                    price: tier.price,
                });
                
                // Refresh subscription
                const sub = await getUserSubscriptionToArtist(user.uid, artistId);
                setCurrentSubscription(sub);
                
                alert(`Du bist jetzt ${tier.name} von ${artistName}! 🎉`);
            }
        } catch (error: any) {
            console.error("Error subscribing:", error);
            alert(`Fehler: ${error.message}`);
        } finally {
            setSubscribing(false);
            setSelectedTierId(null);
        }
    };
    
    // Cancel subscription
    const handleCancel = async () => {
        if (!currentSubscription) return;
        
        if (!window.confirm('Möchtest du dein Abo wirklich kündigen?')) return;
        
        setSubscribing(true);
        
        try {
            await cancelSubscription(currentSubscription.id);
            setCurrentSubscription(null);
            alert('Dein Abo wurde gekündigt.');
        } catch (error: any) {
            console.error("Error cancelling:", error);
            alert(`Fehler: ${error.message}`);
        } finally {
            setSubscribing(false);
        }
    };
    
    // Don't show if no tiers
    if (loading || tiers.length === 0) {
        return null;
    }
    
    // Is user viewing their own profile
    const isOwnProfile = user?.uid === artistId;
    
    if (isOwnProfile) {
        return (
            <div className="card-comic bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                <h2 className="text-2xl font-heading mb-3">💜 Deine Abo-Stufen</h2>
                <p className="text-gray-600 mb-4">
                    Hier können Fans dich unterstützen!
                </p>
                <Link href="/artist/subscriptions">
                    <Button variant="accent">⚙️ Abonnements verwalten</Button>
                </Link>
            </div>
        );
    }
    
    return (
        <div className="card-comic bg-white p-6">
            <h2 className="text-2xl font-heading mb-4 border-b-4 border-black pb-3">
                💜 {artistName} unterstützen
            </h2>
            
            {/* Current Subscription Banner */}
            {currentSubscription && (
                <div className={`mb-4 p-4 border-4 ${TIER_INFO[currentSubscription.tier].borderColor} ${TIER_INFO[currentSubscription.tier].bgColor}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-2xl mr-2">{TIER_INFO[currentSubscription.tier].icon}</span>
                            <span className="font-bold">
                                Du bist {tiers.find(t => t.id === currentSubscription.tierId)?.name || currentSubscription.tier}!
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                                Nächste Zahlung: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('de-DE')}
                            </p>
                        </div>
                        <button
                            onClick={handleCancel}
                            disabled={subscribing}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Kündigen
                        </button>
                    </div>
                </div>
            )}
            
            {/* Tiers Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {tiers.map((tier) => {
                    const info = TIER_INFO[tier.tier];
                    const isCurrentTier = currentSubscription?.tierId === tier.id;
                    const isLoading = subscribing && selectedTierId === tier.id;
                    
                    return (
                        <div 
                            key={tier.id} 
                            className={`border-4 border-black p-4 relative ${
                                isCurrentTier ? 'ring-4 ring-accent' : ''
                            } ${info.bgColor} transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                        >
                            {isCurrentTier && (
                                <div className="absolute -top-3 -right-2 bg-accent text-black text-xs font-bold px-2 py-1 border-2 border-black">
                                    ✓ Dein Tier
                                </div>
                            )}
                            
                            <div className="text-center mb-4">
                                <span className="text-4xl">{info.icon}</span>
                                <h3 className={`text-xl font-heading ${info.color} mt-2`}>
                                    {tier.name}
                                </h3>
                                <p className="text-3xl font-heading">
                                    €{tier.price}
                                    <span className="text-sm font-body text-gray-500">/Mo</span>
                                </p>
                            </div>
                            
                            <ul className="text-sm space-y-2 mb-4">
                                {tier.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-green-600 flex-shrink-0">✓</span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <Button
                                onClick={() => handleSubscribe(tier)}
                                variant={tier.tier === 'patron' ? 'accent' : 'primary'}
                                disabled={subscribing || isCurrentTier}
                                className="w-full"
                            >
                                {isLoading ? 'Wird geladen...' : 
                                 isCurrentTier ? 'Aktueller Plan' :
                                 currentSubscription ? 
                                    (tier.price > currentSubscription.price ? '⬆️ Upgrade' : '⬇️ Downgrade') :
                                 'Abonnieren'}
                            </Button>
                        </div>
                    );
                })}
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
                Sichere Zahlung über Stripe. Jederzeit kündbar.
            </p>
        </div>
    );
}






