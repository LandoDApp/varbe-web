/**
 * VARBE Badge/Achievement System
 * Steam-Style Badges mit Comic-Brutalismus Design
 */

import { Badge, BadgeCategory, BadgeRarity } from "@/types";

// ========================================
// BADGE DEFINITIONS
// ========================================

export const BADGES: Badge[] = [
    // ========================================
    // KÜNSTLER-ACHIEVEMENTS
    // ========================================
    {
        id: 'first_sale',
        name: 'Der Anfang',
        description: 'Verkaufe dein erstes Kunstwerk auf Varbe',
        category: 'artist',
        rarity: 'common',
        icon: '🎨',
        color: 'green',
        unlockCondition: { type: 'sale_count', target: 1 },
        points: 50,
    },
    {
        id: 'ten_sales',
        name: 'Zehn im Sack',
        description: '10 Kunstwerke verkauft',
        category: 'artist',
        rarity: 'uncommon',
        icon: '💰',
        color: 'green',
        unlockCondition: { type: 'sale_count', target: 10 },
        points: 100,
    },
    {
        id: 'hot_artwork',
        name: 'Heiß begehrt',
        description: 'Ein Werk wurde über 50x favorisiert',
        category: 'artist',
        rarity: 'rare',
        icon: '🔥',
        color: 'pink',
        unlockCondition: { type: 'favorites_single', target: 50 },
        points: 150,
    },
    {
        id: 'founder',
        name: 'Gründer',
        description: 'Einer der ersten 100 Künstler auf Varbe',
        category: 'artist',
        rarity: 'very_rare',
        icon: '⭐',
        color: 'gold',
        unlockCondition: { type: 'founder_number', target: 100 },
        points: 500,
    },
    {
        id: 'century_work',
        name: 'Jahrhundertwerk',
        description: 'Verkaufe ein Werk für über 1.000€',
        category: 'artist',
        rarity: 'very_rare',
        icon: '💎',
        color: 'green',
        unlockCondition: { type: 'single_sale_amount', target: 1000 },
        points: 300,
    },
    {
        id: 'rocket',
        name: 'Rakete',
        description: '3 Werke in einer Woche verkauft',
        category: 'artist',
        rarity: 'rare',
        icon: '🚀',
        color: 'pink',
        unlockCondition: { type: 'weekly_sales', target: 3 },
        points: 200,
    },
    {
        id: 'storyteller',
        name: 'Storyteller',
        description: '10 Werke mit Video-Story hochgeladen',
        category: 'artist',
        rarity: 'uncommon',
        icon: '📹',
        color: 'green',
        unlockCondition: { type: 'video_listings', target: 10 },
        points: 100,
    },
    {
        id: 'precise',
        name: 'Präzise',
        description: '10 Werke verkauft ohne Rückgabe',
        category: 'artist',
        rarity: 'rare',
        icon: '🎯',
        color: 'green',
        unlockCondition: { type: 'sales_no_returns', target: 10 },
        points: 200,
    },
    {
        id: 'perfectionist',
        name: 'Perfektionist',
        description: '5-Sterne-Durchschnitt bei 20+ Reviews',
        category: 'artist',
        rarity: 'very_rare',
        icon: '💯',
        color: 'gold',
        unlockCondition: { type: 'perfect_rating', target: 20 },
        points: 400,
    },
    {
        id: 'globetrotter',
        name: 'Weltenbummler',
        description: 'Werke in 10 verschiedene Städte verkauft',
        category: 'artist',
        rarity: 'rare',
        icon: '🌍',
        color: 'green',
        unlockCondition: { type: 'unique_cities', target: 10 },
        points: 200,
    },
    {
        id: 'hundred_sales',
        name: 'Hundert!',
        description: '100 Kunstwerke verkauft',
        category: 'artist',
        rarity: 'very_rare',
        icon: '💯',
        color: 'gold',
        unlockCondition: { type: 'sale_count', target: 100 },
        points: 500,
    },
    {
        id: 'verified_artist',
        name: 'Verifizierter Künstler',
        description: 'Als Künstler auf Varbe verifiziert',
        category: 'artist',
        rarity: 'common',
        icon: '✅',
        color: 'green',
        unlockCondition: { type: 'verified_artist' },
        points: 50,
    },
    {
        id: 'ki_free_verified',
        name: 'KI-Frei',
        description: 'Als 100% KI-freier Künstler verifiziert',
        category: 'artist',
        rarity: 'uncommon',
        icon: '🎨',
        color: 'green',
        unlockCondition: { type: 'ki_free_verified' },
        points: 100,
    },

    // ========================================
    // KÄUFER-ACHIEVEMENTS
    // ========================================
    {
        id: 'first_purchase',
        name: 'Kunstliebhaber',
        description: 'Kaufe dein erstes Kunstwerk',
        category: 'buyer',
        rarity: 'common',
        icon: '❤️',
        color: 'pink',
        unlockCondition: { type: 'purchase_count', target: 1 },
        points: 50,
    },
    {
        id: 'collector',
        name: 'Sammler',
        description: '10 Kunstwerke gekauft',
        category: 'buyer',
        rarity: 'uncommon',
        icon: '🏠',
        color: 'green',
        unlockCondition: { type: 'purchase_count', target: 10 },
        points: 150,
    },
    {
        id: 'local_patron',
        name: 'Lokalpatron',
        description: '5 Werke aus deiner Stadt gekauft',
        category: 'buyer',
        rarity: 'uncommon',
        icon: '📍',
        color: 'green',
        unlockCondition: { type: 'local_purchases', target: 5 },
        points: 100,
    },
    {
        id: 'gift_giver',
        name: 'Geschenkegeber',
        description: 'Verschenke 3 Kunstwerke',
        category: 'buyer',
        rarity: 'rare',
        icon: '🎁',
        color: 'pink',
        unlockCondition: { type: 'gifts_sent', target: 3 },
        points: 150,
    },
    {
        id: 'explorer',
        name: 'Entdecker',
        description: 'Folge 20 Künstlern',
        category: 'buyer',
        rarity: 'uncommon',
        icon: '🔍',
        color: 'green',
        unlockCondition: { type: 'following_count', target: 20 },
        points: 100,
    },
    {
        id: 'bargain_hunter',
        name: 'Schnäppchenjäger',
        description: 'Gewinne 3 Auktionen unter Startpreis+10%',
        category: 'buyer',
        rarity: 'rare',
        icon: '🏷️',
        color: 'green',
        unlockCondition: { type: 'bargain_auctions', target: 3 },
        points: 150,
    },
    {
        id: 'critic',
        name: 'Kritiker',
        description: 'Schreibe 10 Reviews',
        category: 'buyer',
        rarity: 'uncommon',
        icon: '💬',
        color: 'green',
        unlockCondition: { type: 'review_count', target: 10 },
        points: 100,
    },
    {
        id: 'patron',
        name: 'Mäzen',
        description: 'Unterstütze einen Künstler mit Abo',
        category: 'buyer',
        rarity: 'rare',
        icon: '👑',
        color: 'gold',
        unlockCondition: { type: 'subscription_active', target: 1 },
        points: 200,
    },
    {
        id: 'mega_collector',
        name: 'Mega-Sammler',
        description: '50 Kunstwerke gekauft',
        category: 'buyer',
        rarity: 'very_rare',
        icon: '🏛️',
        color: 'gold',
        unlockCondition: { type: 'purchase_count', target: 50 },
        points: 400,
    },

    // ========================================
    // COMMUNITY-ACHIEVEMENTS
    // ========================================
    {
        id: 'heart_giver',
        name: 'Herzgeber',
        description: 'Gib 100 Likes im Feed',
        category: 'community',
        rarity: 'uncommon',
        icon: '💚',
        color: 'green',
        unlockCondition: { type: 'likes_given', target: 100 },
        points: 75,
    },
    {
        id: 'chatterbox',
        name: 'Plaudertasche',
        description: 'Schreibe 50 Kommentare',
        category: 'community',
        rarity: 'uncommon',
        icon: '🗣️',
        color: 'pink',
        unlockCondition: { type: 'comment_count', target: 50 },
        points: 100,
    },
    {
        id: 'event_master',
        name: 'Eventmeister',
        description: 'Besuche 5 Künstler-Events/Ateliers',
        category: 'community',
        rarity: 'rare',
        icon: '🎪',
        color: 'pink',
        unlockCondition: { type: 'event_visits', target: 5 },
        points: 200,
    },
    {
        id: 'networker',
        name: 'Netzwerker',
        description: 'Teile 20 Kunstwerke',
        category: 'community',
        rarity: 'uncommon',
        icon: '🔗',
        color: 'green',
        unlockCondition: { type: 'shares_count', target: 20 },
        points: 100,
    },
    {
        id: 'democrat',
        name: 'Demokrat',
        description: 'Nimm an 10 Community-Votes teil',
        category: 'community',
        rarity: 'rare',
        icon: '✅',
        color: 'green',
        unlockCondition: { type: 'votes_cast', target: 10 },
        points: 150,
    },
    {
        id: 'helper',
        name: 'Helfer',
        description: 'Hilf 5 Künstlern bei Verifizierung',
        category: 'community',
        rarity: 'uncommon',
        icon: '🆘',
        color: 'green',
        unlockCondition: { type: 'verification_votes', target: 5 },
        points: 100,
    },
    {
        id: 'super_fan',
        name: 'Super-Fan',
        description: 'Folge 50 Künstlern',
        category: 'community',
        rarity: 'rare',
        icon: '🌟',
        color: 'pink',
        unlockCondition: { type: 'following_count', target: 50 },
        points: 150,
    },

    // ========================================
    // SPEZIAL-ACHIEVEMENTS (Saisonal/Events)
    // ========================================
    {
        id: 'birthday',
        name: 'Geburtstagskind',
        description: 'Sei an Varbe\'s Geburtstag aktiv',
        category: 'special',
        rarity: 'very_rare',
        icon: '🎂',
        color: 'pink',
        unlockCondition: { type: 'event', event: 'varbe_birthday' },
        points: 250,
    },
    {
        id: 'halloween',
        name: 'Spooky Artist',
        description: 'Verkaufe ein Werk im Oktober mit Halloween-Thema',
        category: 'special',
        rarity: 'very_rare',
        icon: '🎃',
        color: 'special',
        unlockCondition: { type: 'event', event: 'halloween_sale' },
        points: 300,
    },
    {
        id: 'christmas',
        name: 'Weihnachts-Shopper',
        description: 'Kaufe 3 Geschenke im Dezember',
        category: 'special',
        rarity: 'very_rare',
        icon: '🎄',
        color: 'special',
        unlockCondition: { type: 'event', event: 'christmas_gifts' },
        points: 300,
    },
    {
        id: 'pride',
        name: 'Pride Supporter',
        description: 'Unterstütze LGBTQ+ Künstler im Pride Month',
        category: 'special',
        rarity: 'very_rare',
        icon: '🌈',
        color: 'special',
        unlockCondition: { type: 'event', event: 'pride_support' },
        points: 250,
    },
    {
        id: 'beta_tester',
        name: 'Beta-Tester',
        description: 'War während der Beta dabei',
        category: 'special',
        rarity: 'legendary',
        icon: '🧪',
        color: 'gold',
        unlockCondition: { type: 'beta_registration' },
        points: 1000,
    },
    {
        id: 'first_hundred',
        name: 'Die Ersten 100',
        description: 'Einer der ersten 100 User auf Varbe',
        category: 'special',
        rarity: 'legendary',
        icon: '💯',
        color: 'gold',
        unlockCondition: { type: 'registration_number', target: 100 },
        points: 500,
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Hat sich 2024 registriert',
        category: 'special',
        rarity: 'very_rare',
        icon: '🐦',
        color: 'gold',
        unlockCondition: { type: 'registration_year', target: 2024 },
        points: 300,
    },
    {
        id: 'first_artist',
        name: 'Pionier',
        description: 'Einer der ersten 50 verifizierten Künstler',
        category: 'artist',
        rarity: 'legendary',
        icon: '🚀',
        color: 'gold',
        unlockCondition: { type: 'verification_number', target: 50 },
        points: 750,
    },
    {
        id: 'champion',
        name: 'Varbe-Champion',
        description: 'Erreiche 50 Achievements',
        category: 'special',
        rarity: 'legendary',
        icon: '🏆',
        color: 'gold',
        unlockCondition: { type: 'total_badges', target: 50 },
        points: 1000,
    },
    {
        id: 'streak_week',
        name: 'Woche geschafft!',
        description: '7 Tage Aktivitäts-Streak',
        category: 'special',
        rarity: 'uncommon',
        icon: '🔥',
        color: 'pink',
        unlockCondition: { type: 'streak_days', target: 7 },
        points: 75,
    },
    {
        id: 'streak_month',
        name: 'Monat durch!',
        description: '30 Tage Aktivitäts-Streak',
        category: 'special',
        rarity: 'rare',
        icon: '💪',
        color: 'green',
        unlockCondition: { type: 'streak_days', target: 30 },
        points: 200,
    },
    {
        id: 'streak_year',
        name: 'Jahres-Champion',
        description: '365 Tage Aktivitäts-Streak',
        category: 'special',
        rarity: 'legendary',
        icon: '👑',
        color: 'gold',
        unlockCondition: { type: 'streak_days', target: 365 },
        points: 1000,
    },

    // ========================================
    // EASTER EGG ACHIEVEMENTS (Hidden)
    // ========================================
    {
        id: 'easter_egg_hunter',
        name: 'Eier-Jäger',
        description: 'Finde das versteckte Easter Egg auf der Startseite',
        category: 'easter_egg',
        rarity: 'very_rare',
        icon: '🐣',
        color: 'special',
        unlockCondition: { type: 'easter_egg', event: 'homepage_secret' },
        points: 250,
        hidden: true,
    },
    {
        id: 'night_owl',
        name: 'Nachteule',
        description: 'Kaufe ein Werk zwischen 2-4 Uhr nachts',
        category: 'easter_egg',
        rarity: 'very_rare',
        icon: '🌙',
        color: 'special',
        unlockCondition: { type: 'purchase_time', event: 'night_purchase' },
        points: 200,
        hidden: true,
    },
    {
        id: 'lucky',
        name: 'Glückspilz',
        description: 'Gewinne die Varbe-Lotterie',
        category: 'easter_egg',
        rarity: 'legendary',
        icon: '🎲',
        color: 'gold',
        unlockCondition: { type: 'lottery_win' },
        points: 500,
        hidden: true,
    },
    {
        id: 'leet',
        name: 'Leet',
        description: 'Deine User-ID endet auf 1337',
        category: 'easter_egg',
        rarity: 'legendary',
        icon: '🔢',
        color: 'green',
        unlockCondition: { type: 'user_id_match', event: '1337' },
        points: 500,
        hidden: true,
    },
    {
        id: 'unicorn',
        name: 'Einhorn',
        description: 'Finde das geheime Einhorn-Kunstwerk',
        category: 'easter_egg',
        rarity: 'legendary',
        icon: '🦄',
        color: 'special',
        unlockCondition: { type: 'easter_egg', event: 'unicorn_artwork' },
        points: 500,
        hidden: true,
    },
    {
        id: 'perfect_number',
        name: 'Perfekte Zahl',
        description: 'Gib exakt 100€ für ein Werk aus',
        category: 'easter_egg',
        rarity: 'very_rare',
        icon: '💯',
        color: 'green',
        unlockCondition: { type: 'exact_purchase', target: 100 },
        points: 200,
        hidden: true,
    },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export const getBadgeById = (id: string): Badge | undefined => {
    return BADGES.find(b => b.id === id);
};

export const getBadgesByCategory = (category: BadgeCategory): Badge[] => {
    return BADGES.filter(b => b.category === category);
};

export const getBadgesByRarity = (rarity: BadgeRarity): Badge[] => {
    return BADGES.filter(b => b.rarity === rarity);
};

export const getVisibleBadges = (): Badge[] => {
    return BADGES.filter(b => !b.hidden);
};

export const getHiddenBadges = (): Badge[] => {
    return BADGES.filter(b => b.hidden);
};

export const getRarityStars = (rarity: BadgeRarity): string => {
    switch (rarity) {
        case 'common': return '⭐';
        case 'uncommon': return '⭐⭐';
        case 'rare': return '⭐⭐⭐';
        case 'very_rare': return '⭐⭐⭐⭐';
        case 'legendary': return '⭐⭐⭐⭐⭐';
    }
};

export const getRarityLabel = (rarity: BadgeRarity): string => {
    switch (rarity) {
        case 'common': return 'Häufig';
        case 'uncommon': return 'Ungewöhnlich';
        case 'rare': return 'Selten';
        case 'very_rare': return 'Sehr Selten';
        case 'legendary': return 'Legendär';
    }
};

export const getRarityPercentage = (rarity: BadgeRarity): string => {
    switch (rarity) {
        case 'common': return '70%+';
        case 'uncommon': return '40-70%';
        case 'rare': return '15-40%';
        case 'very_rare': return '1-15%';
        case 'legendary': return '<1%';
    }
};

export const getCategoryLabel = (category: BadgeCategory): string => {
    switch (category) {
        case 'artist': return 'Künstler';
        case 'buyer': return 'Käufer';
        case 'community': return 'Community';
        case 'special': return 'Spezial';
        case 'easter_egg': return 'Easter Eggs';
    }
};

export const getCategoryIcon = (category: BadgeCategory): string => {
    switch (category) {
        case 'artist': return '🎨';
        case 'buyer': return '🛍️';
        case 'community': return '👥';
        case 'special': return '🌟';
        case 'easter_egg': return '🕹️';
    }
};

// Calculate total points from unlocked badges
export const calculateTotalPoints = (unlockedBadgeIds: string[]): number => {
    return unlockedBadgeIds.reduce((total, id) => {
        const badge = getBadgeById(id);
        return total + (badge?.points || 0);
    }, 0);
};

// Get next achievable badges based on current progress
export const getNextAchievableBadges = (
    currentAchievements: { badgeId: string; progress: { current: number; target: number } }[]
): Badge[] => {
    const unlockedIds = currentAchievements
        .filter(a => a.progress.current >= a.progress.target)
        .map(a => a.badgeId);
    
    return BADGES.filter(b => 
        !unlockedIds.includes(b.id) && 
        !b.hidden &&
        b.unlockCondition.target !== undefined
    ).slice(0, 5);
};

// ========================================
// AUTOMATIC BADGE CHECK & AWARD SYSTEM
// ========================================

import { db } from "./firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

interface UserStats {
    salesCount: number;
    purchaseCount: number;
    followingCount: number;
    followersCount: number;
    reviewsWritten: number;
    likesGiven: number;
    commentsCount: number;
    totalEarnings: number;
    registrationDate: number;
    verificationStatus: string;
    isKiFreeVerified: boolean;
    verifiedArtistNumber?: number;
    userNumber?: number;
}

/**
 * Fetch user stats from various collections
 */
async function getUserStats(userId: string): Promise<UserStats> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};
    
    // Get orders where user is seller (sales)
    const salesQuery = query(
        collection(db, "orders"),
        where("sellerId", "==", userId),
        where("status", "==", "delivered")
    );
    const salesSnap = await getDocs(salesQuery);
    
    // Get orders where user is buyer (purchases)
    const purchasesQuery = query(
        collection(db, "orders"),
        where("buyerId", "==", userId),
        where("status", "==", "delivered")
    );
    const purchasesSnap = await getDocs(purchasesQuery);
    
    // Get following count
    const followingQuery = query(
        collection(db, "follows"),
        where("followerId", "==", userId)
    );
    const followingSnap = await getDocs(followingQuery);
    
    // Get reviews written
    const reviewsQuery = query(
        collection(db, "reviews"),
        where("userId", "==", userId)
    );
    const reviewsSnap = await getDocs(reviewsQuery);
    
    // Calculate total earnings from sales
    let totalEarnings = 0;
    salesSnap.docs.forEach(doc => {
        totalEarnings += doc.data().total || 0;
    });
    
    // Get user number (position in registration order)
    let userNumber = 0;
    try {
        const usersQuery = query(
            collection(db, "users"),
            orderBy("createdAt", "asc")
        );
        const usersSnap = await getDocs(usersQuery);
        usersSnap.docs.forEach((doc, index) => {
            if (doc.id === userId) userNumber = index + 1;
        });
        console.log(`📊 User registration number: ${userNumber} of ${usersSnap.size} total`);
    } catch (err) {
        console.error("Error getting user number:", err);
        // Fallback - just count users created before this user
        userNumber = 999; // Assume not in first 100 if query fails
    }
    
    // Get verified artist number
    let verifiedArtistNumber: number | undefined;
    if (userData.verificationStatus === 'verified') {
        try {
            const verifiedQuery = query(
                collection(db, "users"),
                where("verificationStatus", "==", "verified")
            );
            const verifiedSnap = await getDocs(verifiedQuery);
            
            // Sort by verifiedAt manually to handle missing fields
            const sortedDocs = verifiedSnap.docs
                .map(doc => ({ id: doc.id, verifiedAt: doc.data().verifiedAt || doc.data().createdAt || 0 }))
                .sort((a, b) => a.verifiedAt - b.verifiedAt);
            
            sortedDocs.forEach((doc, index) => {
                if (doc.id === userId) verifiedArtistNumber = index + 1;
            });
            
            console.log(`📊 Verified artist number: ${verifiedArtistNumber} of ${sortedDocs.length} total`);
        } catch (err) {
            console.error("Error getting verified artist number:", err);
        }
    }
    
    return {
        salesCount: salesSnap.size,
        purchaseCount: purchasesSnap.size,
        followingCount: followingSnap.size,
        followersCount: userData.followersCount || 0,
        reviewsWritten: reviewsSnap.size,
        likesGiven: userData.likesGiven || 0,
        commentsCount: userData.commentsCount || 0,
        totalEarnings,
        registrationDate: userData.createdAt || Date.now(),
        verificationStatus: userData.verificationStatus || 'none',
        isKiFreeVerified: userData.isKiFreeVerified || false,
        verifiedArtistNumber,
        userNumber,
    };
}

/**
 * Check if a badge should be awarded based on user stats
 */
function shouldAwardBadge(badge: Badge, stats: UserStats, currentBadgeIds: string[]): boolean {
    // Skip if already has badge
    if (currentBadgeIds.includes(badge.id)) return false;
    
    // Skip hidden badges (they're manually awarded)
    if (badge.hidden) return false;
    
    const condition = badge.unlockCondition;
    
    switch (condition.type) {
        // Artist badges
        case 'verified_artist':
            return stats.verificationStatus === 'verified';
        case 'sale_count':
            return stats.salesCount >= (condition.target || 0);
        case 'single_sale_amount':
            return stats.totalEarnings >= (condition.target || 0);
        case 'ki_free_verified':
            return stats.isKiFreeVerified;
        case 'verification_number':
            return stats.verifiedArtistNumber !== undefined && 
                   stats.verifiedArtistNumber <= (condition.target || 50);
        case 'founder_number':
            return stats.verifiedArtistNumber !== undefined && 
                   stats.verifiedArtistNumber <= (condition.target || 100);
        
        // Buyer badges
        case 'purchase_count':
            return stats.purchaseCount >= (condition.target || 0);
        case 'following_count':
            return stats.followingCount >= (condition.target || 0);
        case 'review_count':
            return stats.reviewsWritten >= (condition.target || 0);
        
        // Community badges
        case 'likes_given':
            return stats.likesGiven >= (condition.target || 0);
        case 'comment_count':
            return stats.commentsCount >= (condition.target || 0);
        
        // Special badges
        case 'registration_number':
            return stats.userNumber <= (condition.target || 100);
        case 'registration_year':
            const regYear = new Date(stats.registrationDate).getFullYear();
            return regYear === (condition.target || 2024);
        
        default:
            return false;
    }
}

/**
 * Check and award badges for a user
 * Called automatically on page load/profile refresh
 */
export async function checkAndAwardBadges(userId: string): Promise<{
    newBadges: string[];
    totalBadges: number;
}> {
    try {
        console.log("🏆 ========================================");
        console.log("🏆 BADGE CHECK STARTED for:", userId);
        console.log("🏆 ========================================");
        
        // Get current user data
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            console.log("❌ User not found");
            return { newBadges: [], totalBadges: 0 };
        }
        
        const userData = userSnap.data();
        const currentAchievements = userData.achievementData?.achievements || [];
        const currentBadgeIds = currentAchievements.map((a: any) => a.badgeId);
        
        console.log("📋 Current badges:", currentBadgeIds);
        
        // Get user stats
        const stats = await getUserStats(userId);
        console.log("📊 User stats:", JSON.stringify(stats, null, 2));
        
        // Check each badge
        const newBadgesToAward: string[] = [];
        
        for (const badge of BADGES) {
            const shouldAward = shouldAwardBadge(badge, stats, currentBadgeIds);
            if (shouldAward) {
                newBadgesToAward.push(badge.id);
                console.log(`✅ Badge EARNED: ${badge.name} (${badge.id})`);
            }
        }
        
        console.log(`📊 Total badges to award: ${newBadgesToAward.length}`);
        
        // Award new badges if any
        if (newBadgesToAward.length > 0) {
            const newAchievements = [...currentAchievements];
            
            for (const badgeId of newBadgesToAward) {
                newAchievements.push({
                    badgeId,
                    unlockedAt: Date.now(),
                    progress: { current: 1, target: 1 }
                });
            }
            
            // Calculate total points
            const totalPoints = newAchievements.reduce((sum: number, a: any) => {
                const badge = getBadgeById(a.badgeId);
                return sum + (badge?.points || 0);
            }, 0);
            
            // Update user document
            await updateDoc(userRef, {
                'achievementData.achievements': newAchievements,
                'achievementData.stats.totalBadges': newAchievements.length,
                'achievementData.stats.totalPoints': totalPoints,
                'achievementData.stats.lastActiveAt': Date.now(),
            });
            
            console.log(`🎉 ========================================`);
            console.log(`🎉 AWARDED ${newBadgesToAward.length} NEW BADGES!`);
            console.log(`🎉 Badges: ${newBadgesToAward.join(', ')}`);
            console.log(`🎉 ========================================`);
        } else {
            console.log("📋 No new badges to award (user already has all earned badges)");
        }
        
        return {
            newBadges: newBadgesToAward,
            totalBadges: currentBadgeIds.length + newBadgesToAward.length
        };
        
    } catch (error) {
        console.error("❌ Error checking badges:", error);
        return { newBadges: [], totalBadges: 0 };
    }
}




