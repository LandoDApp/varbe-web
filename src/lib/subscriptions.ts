/**
 * VARBE Subscription System
 * 
 * Fans can subscribe to artists for exclusive content, early access, and perks.
 * Artists can set up different tiers with various benefits.
 */

import { db } from "./firebase";
import { 
    collection, 
    addDoc, 
    getDoc, 
    getDocs, 
    doc, 
    query, 
    orderBy, 
    where, 
    updateDoc, 
    deleteDoc,
    limit,
    increment,
} from "firebase/firestore";
import { ArtistSubscriptionTier, Subscription, SubscriptionPayment, SubscriptionTier } from "@/types";

// ========================================
// SUBSCRIPTION TIERS
// ========================================

const DEFAULT_TIERS: Partial<ArtistSubscriptionTier>[] = [
    {
        tier: 'fan',
        name: 'Fan',
        price: 5,
        benefits: [
            'Exklusive Posts nur für Supporter',
            'Monatliche Wallpaper in HD',
            'Name in Credits bei neuen Werken',
        ],
        exclusiveContent: true,
        monthlyDrops: true,
    },
    {
        tier: 'supporter',
        name: 'Supporter',
        price: 15,
        benefits: [
            'Alle Fan-Vorteile',
            'Early Access zu neuen Werken (48h)',
            '10% Rabatt auf alle Käufe',
            'Behind-the-Scenes Videos',
        ],
        exclusiveContent: true,
        monthlyDrops: true,
        earlyAccess: true,
        discountPercent: 10,
    },
    {
        tier: 'patron',
        name: 'Patron',
        price: 50,
        benefits: [
            'Alle Supporter-Vorteile',
            '20% Rabatt auf alle Käufe',
            'Monatlicher signierter Print',
            'Vierteljährliches Video-Call (15min)',
            'Einfluss auf kommende Projekte',
        ],
        exclusiveContent: true,
        monthlyDrops: true,
        earlyAccess: true,
        discountPercent: 20,
        monthlyPrint: true,
        videoCall: true,
    },
];

interface CreateTierData {
    artistId: string;
    tier: SubscriptionTier;
    name: string;
    price: number;
    benefits: string[];
    exclusiveContent?: boolean;
    monthlyDrops?: boolean;
    earlyAccess?: boolean;
    discountPercent?: number;
    monthlyPrint?: boolean;
    videoCall?: boolean;
}

export async function createSubscriptionTier(data: CreateTierData): Promise<string> {
    // Check if artist already has this tier
    const existing = await getArtistTier(data.artistId, data.tier);
    if (existing) {
        throw new Error(`Du hast bereits einen ${data.tier} Tier.`);
    }
    
    // Build tier object, only including defined values (Firestore doesn't accept undefined)
    const tierDoc: Record<string, any> = {
        artistId: data.artistId,
        tier: data.tier,
        name: data.name,
        price: data.price,
        benefits: data.benefits,
        isActive: true,
        subscriberCount: 0,
        createdAt: Date.now(),
    };
    
    // Only add optional boolean/number fields if they have values
    if (data.exclusiveContent !== undefined) tierDoc.exclusiveContent = data.exclusiveContent;
    if (data.monthlyDrops !== undefined) tierDoc.monthlyDrops = data.monthlyDrops;
    if (data.earlyAccess !== undefined) tierDoc.earlyAccess = data.earlyAccess;
    if (data.discountPercent !== undefined) tierDoc.discountPercent = data.discountPercent;
    if (data.monthlyPrint !== undefined) tierDoc.monthlyPrint = data.monthlyPrint;
    if (data.videoCall !== undefined) tierDoc.videoCall = data.videoCall;
    
    const docRef = await addDoc(collection(db, "subscription_tiers"), tierDoc);
    return docRef.id;
}

export async function getSubscriptionTier(tierId: string): Promise<ArtistSubscriptionTier | null> {
    const docRef = doc(db, "subscription_tiers", tierId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ArtistSubscriptionTier;
    }
    return null;
}

export async function updateSubscriptionTier(tierId: string, data: Partial<ArtistSubscriptionTier>): Promise<void> {
    const docRef = doc(db, "subscription_tiers", tierId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

export async function getArtistTiers(artistId: string): Promise<ArtistSubscriptionTier[]> {
    const q = query(
        collection(db, "subscription_tiers"),
        where("artistId", "==", artistId),
        where("isActive", "==", true),
        orderBy("price", "asc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtistSubscriptionTier));
}

export async function getArtistTier(artistId: string, tier: SubscriptionTier): Promise<ArtistSubscriptionTier | null> {
    const q = query(
        collection(db, "subscription_tiers"),
        where("artistId", "==", artistId),
        where("tier", "==", tier)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ArtistSubscriptionTier;
}

// Create default tiers for an artist
export async function createDefaultTiers(artistId: string): Promise<void> {
    for (const tierTemplate of DEFAULT_TIERS) {
        await createSubscriptionTier({
            artistId,
            tier: tierTemplate.tier!,
            name: tierTemplate.name!,
            price: tierTemplate.price!,
            benefits: tierTemplate.benefits!,
            exclusiveContent: tierTemplate.exclusiveContent,
            monthlyDrops: tierTemplate.monthlyDrops,
            earlyAccess: tierTemplate.earlyAccess,
            discountPercent: tierTemplate.discountPercent,
            monthlyPrint: tierTemplate.monthlyPrint,
            videoCall: tierTemplate.videoCall,
        });
    }
}

// ========================================
// SUBSCRIPTIONS
// ========================================

interface CreateSubscriptionData {
    subscriberId: string;
    artistId: string;
    tierId: string;
    tier: SubscriptionTier;
    price: number;
}

export async function createSubscription(data: CreateSubscriptionData): Promise<string> {
    // Check if already subscribed
    const existing = await getUserSubscriptionToArtist(data.subscriberId, data.artistId);
    if (existing && existing.status === 'active') {
        throw new Error("Du bist bereits bei diesem Künstler abonniert.");
    }
    
    const now = Date.now();
    const subscription: Omit<Subscription, 'id'> = {
        subscriberId: data.subscriberId,
        artistId: data.artistId,
        tierId: data.tierId,
        tier: data.tier,
        price: data.price,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: now + (30 * 24 * 60 * 60 * 1000), // 30 days
        subscribedAt: now,
        createdAt: now,
    };
    
    const docRef = await addDoc(collection(db, "subscriptions"), subscription);
    
    // Increment subscriber count on tier
    const tierRef = doc(db, "subscription_tiers", data.tierId);
    await updateDoc(tierRef, {
        subscriberCount: increment(1),
    });
    
    return docRef.id;
}

export async function getSubscription(subscriptionId: string): Promise<Subscription | null> {
    const docRef = doc(db, "subscriptions", subscriptionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Subscription;
    }
    return null;
}

export async function updateSubscription(subscriptionId: string, data: Partial<Subscription>): Promise<void> {
    const docRef = doc(db, "subscriptions", subscriptionId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

// Get user's subscription to a specific artist
export async function getUserSubscriptionToArtist(userId: string, artistId: string): Promise<Subscription | null> {
    const q = query(
        collection(db, "subscriptions"),
        where("subscriberId", "==", userId),
        where("artistId", "==", artistId),
        where("status", "==", "active")
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Subscription;
}

// Get all subscriptions of a user
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const q = query(
        collection(db, "subscriptions"),
        where("subscriberId", "==", userId),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
}

// Get all subscribers of an artist
export async function getArtistSubscribers(artistId: string): Promise<Subscription[]> {
    const q = query(
        collection(db, "subscriptions"),
        where("artistId", "==", artistId),
        where("status", "==", "active"),
        orderBy("subscribedAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<void> {
    const subscription = await getSubscription(subscriptionId);
    if (!subscription) throw new Error("Subscription not found");
    
    await updateSubscription(subscriptionId, {
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        cancelledAt: Date.now(),
    });
    
    // Decrement subscriber count on tier
    const tierRef = doc(db, "subscription_tiers", subscription.tierId);
    await updateDoc(tierRef, {
        subscriberCount: increment(-1),
    });
}

// Upgrade/downgrade subscription
export async function changeSubscriptionTier(
    subscriptionId: string, 
    newTierId: string,
    newTier: SubscriptionTier,
    newPrice: number
): Promise<void> {
    const subscription = await getSubscription(subscriptionId);
    if (!subscription) throw new Error("Subscription not found");
    
    // Decrement old tier count
    const oldTierRef = doc(db, "subscription_tiers", subscription.tierId);
    await updateDoc(oldTierRef, {
        subscriberCount: increment(-1),
    });
    
    // Update subscription
    await updateSubscription(subscriptionId, {
        tierId: newTierId,
        tier: newTier,
        price: newPrice,
    });
    
    // Increment new tier count
    const newTierRef = doc(db, "subscription_tiers", newTierId);
    await updateDoc(newTierRef, {
        subscriberCount: increment(1),
    });
}

// ========================================
// PAYMENTS
// ========================================

export async function recordSubscriptionPayment(
    subscriptionId: string,
    subscriberId: string,
    artistId: string,
    amount: number
): Promise<string> {
    const varbeFee = Math.round(amount * 0.08 * 100) / 100; // 8% fee
    const artistEarnings = amount - varbeFee;
    
    const payment: Omit<SubscriptionPayment, 'id'> = {
        subscriptionId,
        subscriberId,
        artistId,
        amount,
        varbeFee,
        artistEarnings,
        status: 'completed',
        createdAt: Date.now(),
    };
    
    const docRef = await addDoc(collection(db, "subscription_payments"), payment);
    return docRef.id;
}

export async function getArtistSubscriptionRevenue(artistId: string): Promise<{
    totalRevenue: number;
    totalEarnings: number;
    paymentsCount: number;
}> {
    const q = query(
        collection(db, "subscription_payments"),
        where("artistId", "==", artistId),
        where("status", "==", "completed")
    );
    
    const snapshot = await getDocs(q);
    
    let totalRevenue = 0;
    let totalEarnings = 0;
    
    snapshot.docs.forEach(doc => {
        const payment = doc.data() as SubscriptionPayment;
        totalRevenue += payment.amount;
        totalEarnings += payment.artistEarnings;
    });
    
    return {
        totalRevenue,
        totalEarnings,
        paymentsCount: snapshot.size,
    };
}

// ========================================
// UTILITIES
// ========================================

// Check if user has access to exclusive content
export async function hasExclusiveAccess(userId: string, artistId: string): Promise<boolean> {
    const subscription = await getUserSubscriptionToArtist(userId, artistId);
    return subscription !== null && subscription.status === 'active';
}

// Get subscriber discount for a user
export async function getSubscriberDiscount(userId: string, artistId: string): Promise<number> {
    const subscription = await getUserSubscriptionToArtist(userId, artistId);
    if (!subscription || subscription.status !== 'active') return 0;
    
    const tier = await getSubscriptionTier(subscription.tierId);
    return tier?.discountPercent || 0;
}

// Get total subscriber count for an artist
export async function getTotalSubscriberCount(artistId: string): Promise<number> {
    const tiers = await getArtistTiers(artistId);
    return tiers.reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
}

