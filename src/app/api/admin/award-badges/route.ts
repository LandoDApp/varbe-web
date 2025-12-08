import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, getDoc } from "firebase/firestore";
import { BADGES, getBadgeById } from "@/lib/badges";

// Secret key for admin access
const ADMIN_SECRET = process.env.ADMIN_SECRET || "varbe-admin-2024";

interface UserAchievement {
    badgeId: string;
    unlockedAt: number;
    progress: {
        current: number;
        target: number;
    };
}

/**
 * Award badges to users based on their registration order and activity
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secretKey, badgeType } = body;
        
        // Verify admin access
        if (secretKey !== ADMIN_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const results: { userId: string; displayName: string; badge: string; success: boolean; error?: string }[] = [];
        
        // Get all users ordered by createdAt
        const usersRef = collection(db, "users");
        const usersQuery = query(usersRef, orderBy("createdAt", "asc"), limit(200));
        const usersSnapshot = await getDocs(usersQuery);
        
        const users = usersSnapshot.docs.map((doc, index) => ({
            id: doc.id,
            index: index + 1, // 1-based registration number
            ...doc.data()
        }));
        
        console.log(`Found ${users.length} users`);
        
        for (const user of users) {
            const userId = user.id;
            const displayName = (user as any).displayName || 'Unknown';
            const createdAt = (user as any).createdAt || Date.now();
            const verificationStatus = (user as any).verificationStatus;
            
            // Determine which badges to award based on badgeType
            const badgesToAward: string[] = [];
            
            if (badgeType === 'first_hundred' || badgeType === 'all') {
                // First 100 users get the "Die Ersten 100" badge
                if (user.index <= 100) {
                    badgesToAward.push('first_hundred');
                }
            }
            
            if (badgeType === 'early_bird' || badgeType === 'all') {
                // Users who registered in 2024
                const regYear = new Date(createdAt).getFullYear();
                if (regYear === 2024) {
                    badgesToAward.push('early_bird');
                }
            }
            
            if (badgeType === 'beta_tester' || badgeType === 'all') {
                // First 50 users get beta_tester badge
                if (user.index <= 50) {
                    badgesToAward.push('beta_tester');
                }
            }
            
            if (badgeType === 'first_artist' || badgeType === 'all') {
                // First 50 verified artists get the "Pionier" badge
                if (verificationStatus === 'verified' && user.index <= 50) {
                    badgesToAward.push('first_artist');
                }
            }
            
            if (badgeType === 'founder' || badgeType === 'all') {
                // First 100 verified artists get the "Gründer" badge
                if (verificationStatus === 'verified' && user.index <= 100) {
                    badgesToAward.push('founder');
                }
            }
            
            // Award each badge
            for (const badgeId of badgesToAward) {
                try {
                    const badge = getBadgeById(badgeId);
                    if (!badge) {
                        results.push({ userId, displayName, badge: badgeId, success: false, error: 'Badge not found' });
                        continue;
                    }
                    
                    // Get current user achievement data
                    const userRef = doc(db, "users", userId);
                    const userSnap = await getDoc(userRef);
                    
                    if (!userSnap.exists()) {
                        results.push({ userId, displayName, badge: badgeId, success: false, error: 'User not found' });
                        continue;
                    }
                    
                    const userData = userSnap.data();
                    const currentAchievements: UserAchievement[] = userData.achievementData?.achievements || [];
                    
                    // Check if already has this badge
                    if (currentAchievements.some(a => a.badgeId === badgeId)) {
                        results.push({ userId, displayName, badge: badgeId, success: true, error: 'Already has badge' });
                        continue;
                    }
                    
                    // Add the badge
                    const newAchievement: UserAchievement = {
                        badgeId,
                        unlockedAt: Date.now(),
                        progress: { current: 1, target: 1 }
                    };
                    
                    const updatedAchievements = [...currentAchievements, newAchievement];
                    
                    // Calculate stats
                    const totalPoints = updatedAchievements.reduce((sum, a) => {
                        const b = getBadgeById(a.badgeId);
                        return sum + (b?.points || 0);
                    }, 0);
                    
                    const rarityBreakdown = {
                        common: 0,
                        uncommon: 0,
                        rare: 0,
                        very_rare: 0,
                        legendary: 0
                    };
                    
                    updatedAchievements.forEach(a => {
                        const b = getBadgeById(a.badgeId);
                        if (b) {
                            rarityBreakdown[b.rarity]++;
                        }
                    });
                    
                    // Update user document
                    await updateDoc(userRef, {
                        'achievementData.achievements': updatedAchievements,
                        'achievementData.stats': {
                            totalBadges: updatedAchievements.length,
                            totalPoints,
                            rarityBreakdown,
                            lastActiveAt: Date.now()
                        }
                    });
                    
                    results.push({ userId, displayName, badge: badgeId, success: true });
                    console.log(`✅ Awarded ${badgeId} to ${displayName} (User #${user.index})`);
                    
                } catch (error: any) {
                    results.push({ userId, displayName, badge: badgeId, success: false, error: error.message });
                }
            }
        }
        
        const successCount = results.filter(r => r.success && !r.error?.includes('Already')).length;
        const alreadyHadCount = results.filter(r => r.error?.includes('Already')).length;
        const failCount = results.filter(r => !r.success).length;
        
        return NextResponse.json({
            success: true,
            message: `Awarded ${successCount} badges, ${alreadyHadCount} already had badges, ${failCount} failed`,
            totalUsers: users.length,
            results
        });
        
    } catch (error: any) {
        console.error("Error awarding badges:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}



