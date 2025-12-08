import { db } from "./firebase";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc,
    doc,
    addDoc, 
    updateDoc, 
    deleteDoc,
    orderBy, 
    limit,
    arrayUnion,
    arrayRemove,
    increment,
    setDoc
} from "firebase/firestore";
import { 
    Challenge, 
    ChallengeSubmission, 
    ChallengeParticipant, 
    UserChallengeStats,
    ChallengeType,
    SubmissionComment,
    ChallengeBadgeId,
    CHALLENGE_BADGES,
    DAILY_CHALLENGES,
    WEEKLY_CHALLENGES
} from "@/types";

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get current day of week (0 = Sunday, 6 = Saturday)
 * We use Monday as day 0 for our rotation
 */
const getDayIndex = (): number => {
    const day = new Date().getDay();
    // Convert Sunday (0) to 6, and shift others down by 1
    return day === 0 ? 6 : day - 1;
};

/**
 * Get current week number of the year
 */
const getWeekNumber = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 604800000; // milliseconds in a week
    return Math.floor(diff / oneWeek);
};

/**
 * Get start of current day (midnight)
 */
const getStartOfDay = (): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
};

/**
 * Get end of current day (23:59:59)
 */
const getEndOfDay = (): number => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now.getTime();
};

/**
 * Get start of current week (Monday)
 */
const getStartOfWeek = (): number => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
};

/**
 * Get end of current week (Sunday 23:59:59)
 */
const getEndOfWeek = (): number => {
    const start = getStartOfWeek();
    return start + (7 * 24 * 60 * 60 * 1000) - 1;
};

// ========================================
// CHALLENGE MANAGEMENT
// ========================================

/**
 * Get or create today's daily challenge
 */
export const getCurrentDailyChallenge = async (): Promise<Challenge | null> => {
    try {
        const startOfDay = getStartOfDay();
        const endOfDay = getEndOfDay();
        const dayIndex = getDayIndex();
        
        // Check if today's challenge exists
        const challengesRef = collection(db, "challenges");
        const q = query(
            challengesRef,
            where("type", "==", "daily"),
            where("startDate", ">=", startOfDay),
            where("startDate", "<=", endOfDay)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            } as Challenge;
        }
        
        // Create today's challenge
        const template = DAILY_CHALLENGES[dayIndex];
        const newChallenge: Omit<Challenge, 'id'> = {
            title: template.title,
            prompt: template.prompt,
            emoji: template.emoji,
            type: 'daily',
            rotationIndex: dayIndex,
            startDate: startOfDay,
            endDate: endOfDay,
            status: 'active',
            submissionsCount: 0,
            participantsCount: 0,
            createdAt: Date.now()
        };
        
        const docRef = await addDoc(collection(db, "challenges"), newChallenge);
        return { id: docRef.id, ...newChallenge };
    } catch (error) {
        console.error("Error getting current daily challenge:", error);
        return null;
    }
};

/**
 * Get or create this week's weekly challenge
 */
export const getCurrentWeeklyChallenge = async (): Promise<Challenge | null> => {
    try {
        const startOfWeek = getStartOfWeek();
        const endOfWeek = getEndOfWeek();
        const weekIndex = getWeekNumber() % 4; // Rotate through 4 weekly challenges
        
        // Check if this week's challenge exists
        const challengesRef = collection(db, "challenges");
        const q = query(
            challengesRef,
            where("type", "==", "weekly"),
            where("startDate", ">=", startOfWeek),
            where("startDate", "<=", endOfWeek)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            } as Challenge;
        }
        
        // Create this week's challenge
        const template = WEEKLY_CHALLENGES[weekIndex];
        const newChallenge: Omit<Challenge, 'id'> = {
            title: template.title,
            prompt: template.prompt,
            emoji: template.emoji,
            type: 'weekly',
            rotationIndex: weekIndex,
            startDate: startOfWeek,
            endDate: endOfWeek,
            status: 'active',
            submissionsCount: 0,
            participantsCount: 0,
            createdAt: Date.now()
        };
        
        const docRef = await addDoc(collection(db, "challenges"), newChallenge);
        return { id: docRef.id, ...newChallenge };
    } catch (error) {
        console.error("Error getting current weekly challenge:", error);
        return null;
    }
};

/**
 * Get a challenge by ID
 */
export const getChallenge = async (challengeId: string): Promise<Challenge | null> => {
    try {
        const challengeRef = doc(db, "challenges", challengeId);
        const snapshot = await getDoc(challengeRef);
        
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Challenge;
        }
        return null;
    } catch (error) {
        console.error("Error fetching challenge:", error);
        return null;
    }
};

/**
 * Get past challenges (ended)
 */
export const getPastChallenges = async (type: ChallengeType, limitCount: number = 10): Promise<Challenge[]> => {
    try {
        const now = Date.now();
        const challengesRef = collection(db, "challenges");
        const q = query(
            challengesRef,
            where("type", "==", type),
            where("endDate", "<", now),
            orderBy("endDate", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Challenge));
    } catch (error) {
        console.error("Error fetching past challenges:", error);
        return [];
    }
};

/**
 * End a challenge and determine winner
 */
export const endChallenge = async (challengeId: string): Promise<void> => {
    try {
        // Get top submission
        const submissions = await getChallengeSubmissions(challengeId);
        
        const challengeRef = doc(db, "challenges", challengeId);
        
        if (submissions.length > 0) {
            const winner = submissions[0]; // Already sorted by likes
            
            await updateDoc(challengeRef, {
                status: 'ended',
                winnerId: winner.artistId,
                winnerSubmissionId: winner.id,
                winnerUsername: winner.artistUsername,
                updatedAt: Date.now()
            });
            
            // Update winner's submission
            const submissionRef = doc(db, "challengeSubmissions", winner.id);
            await updateDoc(submissionRef, { isWinner: true });
            
            // Update winner's stats
            await updateUserStats(winner.artistId, true, submissions[0].challengeType);
        } else {
            await updateDoc(challengeRef, {
                status: 'ended',
                updatedAt: Date.now()
            });
        }
    } catch (error) {
        console.error("Error ending challenge:", error);
        throw error;
    }
};

// ========================================
// SUBMISSIONS
// ========================================

/**
 * Submit to a challenge
 */
export const submitToChallenge = async (
    challengeId: string,
    challengeType: ChallengeType,
    userId: string,
    username: string,
    profilePicture: string | undefined,
    imageUrl: string,
    caption?: string
): Promise<string> => {
    try {
        // Check if user already submitted
        const existing = await getUserSubmission(challengeId, userId);
        if (existing) {
            throw new Error("Du hast bereits an dieser Challenge teilgenommen!");
        }
        
        // Create submission
        const submissionData: Omit<ChallengeSubmission, 'id'> = {
            challengeId,
            challengeType,
            artistId: userId,
            artistUsername: username,
            artistProfilePicture: profilePicture,
            imageUrl,
            caption,
            likesCount: 0,
            likedBy: [],
            commentsCount: 0,
            createdAt: Date.now()
        };
        
        const docRef = await addDoc(collection(db, "challengeSubmissions"), submissionData);
        
        // Update challenge stats
        const challengeRef = doc(db, "challenges", challengeId);
        await updateDoc(challengeRef, {
            submissionsCount: increment(1),
            participantsCount: increment(1)
        });
        
        // Update user stats (participation)
        await updateUserStats(userId, false, challengeType);
        
        // Add to user's recent challenges
        const challenge = await getChallenge(challengeId);
        if (challenge) {
            await addToRecentChallenges(userId, {
                challengeId,
                challengeTitle: challenge.title,
                challengeType,
                submissionId: docRef.id,
                imageUrl,
                isWinner: false,
                likesCount: 0,
                createdAt: Date.now()
            });
        }
        
        return docRef.id;
    } catch (error) {
        console.error("Error submitting to challenge:", error);
        throw error;
    }
};

/**
 * Get all submissions for a challenge (sorted by likes)
 */
export const getChallengeSubmissions = async (challengeId: string): Promise<ChallengeSubmission[]> => {
    try {
        const submissionsRef = collection(db, "challengeSubmissions");
        const q = query(
            submissionsRef,
            where("challengeId", "==", challengeId),
            orderBy("likesCount", "desc")
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map((doc, index) => ({
            id: doc.id,
            ...doc.data(),
            rank: index + 1
        } as ChallengeSubmission));
    } catch (error) {
        console.error("Error fetching submissions:", error);
        // Fallback without ordering (if index doesn't exist)
        try {
            const submissionsRef = collection(db, "challengeSubmissions");
            const q = query(submissionsRef, where("challengeId", "==", challengeId));
            const snapshot = await getDocs(q);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as ChallengeSubmission))
                .sort((a, b) => b.likesCount - a.likesCount)
                .map((s, i) => ({ ...s, rank: i + 1 }));
        } catch (e) {
            return [];
        }
    }
};

/**
 * Get user's submission for a challenge
 */
export const getUserSubmission = async (challengeId: string, userId: string): Promise<ChallengeSubmission | null> => {
    try {
        const submissionsRef = collection(db, "challengeSubmissions");
        const q = query(
            submissionsRef,
            where("challengeId", "==", challengeId),
            where("artistId", "==", userId)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ChallengeSubmission;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user submission:", error);
        return null;
    }
};

/**
 * Get a single submission by ID
 */
export const getSubmission = async (submissionId: string): Promise<ChallengeSubmission | null> => {
    try {
        const submissionRef = doc(db, "challengeSubmissions", submissionId);
        const snapshot = await getDoc(submissionRef);
        
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as ChallengeSubmission;
        }
        return null;
    } catch (error) {
        console.error("Error fetching submission:", error);
        return null;
    }
};

// ========================================
// LIKES
// ========================================

/**
 * Like a submission
 */
export const likeSubmission = async (submissionId: string, userId: string): Promise<void> => {
    try {
        const submissionRef = doc(db, "challengeSubmissions", submissionId);
        await updateDoc(submissionRef, {
            likedBy: arrayUnion(userId),
            likesCount: increment(1)
        });
    } catch (error) {
        console.error("Error liking submission:", error);
        throw error;
    }
};

/**
 * Unlike a submission
 */
export const unlikeSubmission = async (submissionId: string, userId: string): Promise<void> => {
    try {
        const submissionRef = doc(db, "challengeSubmissions", submissionId);
        await updateDoc(submissionRef, {
            likedBy: arrayRemove(userId),
            likesCount: increment(-1)
        });
    } catch (error) {
        console.error("Error unliking submission:", error);
        throw error;
    }
};

/**
 * Check if user has liked a submission
 */
export const hasLikedSubmission = async (submissionId: string, userId: string): Promise<boolean> => {
    try {
        const submission = await getSubmission(submissionId);
        return submission?.likedBy.includes(userId) || false;
    } catch (error) {
        console.error("Error checking like status:", error);
        return false;
    }
};

// ========================================
// COMMENTS
// ========================================

/**
 * Add a comment to a submission
 */
export const addComment = async (
    submissionId: string,
    challengeId: string,
    userId: string,
    username: string,
    profilePicture: string | undefined,
    text: string
): Promise<string> => {
    try {
        const commentData: Omit<SubmissionComment, 'id'> = {
            submissionId,
            challengeId,
            userId,
            username,
            profilePicture,
            text,
            createdAt: Date.now()
        };
        
        const docRef = await addDoc(collection(db, "submissionComments"), commentData);
        
        // Update submission comment count
        const submissionRef = doc(db, "challengeSubmissions", submissionId);
        await updateDoc(submissionRef, {
            commentsCount: increment(1)
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

/**
 * Get comments for a submission
 */
export const getSubmissionComments = async (submissionId: string): Promise<SubmissionComment[]> => {
    try {
        const commentsRef = collection(db, "submissionComments");
        const q = query(
            commentsRef,
            where("submissionId", "==", submissionId),
            orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SubmissionComment));
    } catch (error) {
        console.error("Error fetching comments:", error);
        // Fallback
        try {
            const commentsRef = collection(db, "submissionComments");
            const q = query(commentsRef, where("submissionId", "==", submissionId));
            const snapshot = await getDocs(q);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as SubmissionComment))
                .sort((a, b) => a.createdAt - b.createdAt);
        } catch (e) {
            return [];
        }
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string, submissionId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "submissionComments", commentId));
        
        // Update submission comment count
        const submissionRef = doc(db, "challengeSubmissions", submissionId);
        await updateDoc(submissionRef, {
            commentsCount: increment(-1)
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
};

// ========================================
// USER STATS & BADGES
// ========================================

/**
 * Get user challenge stats
 */
export const getUserChallengeStats = async (userId: string): Promise<UserChallengeStats | null> => {
    try {
        const statsRef = doc(db, "userChallengeStats", userId);
        const snapshot = await getDoc(statsRef);
        
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as UserChallengeStats;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return null;
    }
};

/**
 * Update user stats after participation or win
 */
export const updateUserStats = async (
    userId: string, 
    isWinner: boolean,
    challengeType: ChallengeType
): Promise<void> => {
    try {
        const statsRef = doc(db, "userChallengeStats", userId);
        const snapshot = await getDoc(statsRef);
        const now = Date.now();
        
        if (snapshot.exists()) {
            const stats = snapshot.data() as UserChallengeStats;
            const updates: Partial<UserChallengeStats> = {
                updatedAt: now
            };
            
            if (isWinner) {
                updates.totalWins = (stats.totalWins || 0) + 1;
            } else {
                updates.totalParticipations = (stats.totalParticipations || 0) + 1;
                
                // Update streaks
                if (challengeType === 'daily') {
                    const lastDaily = stats.lastDailyParticipation || 0;
                    const oneDayAgo = now - (24 * 60 * 60 * 1000);
                    
                    if (lastDaily > oneDayAgo) {
                        updates.currentDailyStreak = (stats.currentDailyStreak || 0) + 1;
                        if ((updates.currentDailyStreak || 0) > (stats.longestDailyStreak || 0)) {
                            updates.longestDailyStreak = updates.currentDailyStreak;
                        }
                    } else {
                        updates.currentDailyStreak = 1;
                    }
                    updates.lastDailyParticipation = now;
                } else {
                    const lastWeekly = stats.lastWeeklyParticipation || 0;
                    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
                    
                    if (lastWeekly > oneWeekAgo) {
                        updates.currentWeeklyStreak = (stats.currentWeeklyStreak || 0) + 1;
                        if ((updates.currentWeeklyStreak || 0) > (stats.longestWeeklyStreak || 0)) {
                            updates.longestWeeklyStreak = updates.currentWeeklyStreak;
                        }
                    } else {
                        updates.currentWeeklyStreak = 1;
                    }
                    updates.lastWeeklyParticipation = now;
                }
            }
            
            await updateDoc(statsRef, updates);
            
            // Check for new badges
            await checkAndAwardBadges(userId);
        } else {
            // Create new stats
            const newStats: Omit<UserChallengeStats, 'id'> = {
                userId: userId,
                totalParticipations: isWinner ? 0 : 1,
                totalWins: isWinner ? 1 : 0,
                totalLikesReceived: 0,
                currentDailyStreak: challengeType === 'daily' && !isWinner ? 1 : 0,
                longestDailyStreak: challengeType === 'daily' && !isWinner ? 1 : 0,
                currentWeeklyStreak: challengeType === 'weekly' && !isWinner ? 1 : 0,
                longestWeeklyStreak: challengeType === 'weekly' && !isWinner ? 1 : 0,
                lastDailyParticipation: challengeType === 'daily' ? now : undefined,
                lastWeeklyParticipation: challengeType === 'weekly' ? now : undefined,
                badges: isWinner ? ['winner_1'] : [],
                recentChallenges: [],
                createdAt: now,
                updatedAt: now
            };
            
            await setDoc(statsRef, newStats);
        }
    } catch (error) {
        console.error("Error updating user stats:", error);
    }
};

/**
 * Add to user's recent challenges
 */
const addToRecentChallenges = async (
    userId: string,
    challenge: UserChallengeStats['recentChallenges'][0]
): Promise<void> => {
    try {
        const statsRef = doc(db, "userChallengeStats", userId);
        const snapshot = await getDoc(statsRef);
        
        if (snapshot.exists()) {
            const stats = snapshot.data() as UserChallengeStats;
            const recent = [challenge, ...(stats.recentChallenges || [])].slice(0, 20); // Keep last 20
            await updateDoc(statsRef, { recentChallenges: recent });
        }
    } catch (error) {
        console.error("Error adding to recent challenges:", error);
    }
};

/**
 * Check and award badges
 */
export const checkAndAwardBadges = async (userId: string): Promise<ChallengeBadgeId[]> => {
    try {
        const stats = await getUserChallengeStats(userId);
        if (!stats) return [];
        
        const newBadges: ChallengeBadgeId[] = [];
        const currentBadges = stats.badges || [];
        
        // Check participation badges
        const participationBadges: { count: number; badge: ChallengeBadgeId }[] = [
            { count: 10, badge: 'participant_10' },
            { count: 20, badge: 'participant_20' },
            { count: 50, badge: 'participant_50' },
            { count: 100, badge: 'participant_100' },
        ];
        
        for (const { count, badge } of participationBadges) {
            if (stats.totalParticipations >= count && !currentBadges.includes(badge)) {
                newBadges.push(badge);
            }
        }
        
        // Check winner badges
        const winnerBadges: { count: number; badge: ChallengeBadgeId }[] = [
            { count: 1, badge: 'winner_1' },
            { count: 10, badge: 'winner_10' },
            { count: 20, badge: 'winner_20' },
            { count: 50, badge: 'winner_50' },
            { count: 100, badge: 'winner_100' },
        ];
        
        for (const { count, badge } of winnerBadges) {
            if (stats.totalWins >= count && !currentBadges.includes(badge)) {
                newBadges.push(badge);
            }
        }
        
        // Check streak badges
        if (stats.longestDailyStreak >= 7 && !currentBadges.includes('daily_streak_7')) {
            newBadges.push('daily_streak_7');
        }
        if (stats.longestWeeklyStreak >= 4 && !currentBadges.includes('weekly_streak_4')) {
            newBadges.push('weekly_streak_4');
        }
        
        // Award new badges
        if (newBadges.length > 0) {
            const statsRef = doc(db, "userChallengeStats", userId);
            await updateDoc(statsRef, {
                badges: [...currentBadges, ...newBadges]
            });
        }
        
        return newBadges;
    } catch (error) {
        console.error("Error checking badges:", error);
        return [];
    }
};

// ========================================
// LEADERBOARD
// ========================================

/**
 * Get leaderboard for a specific challenge
 */
export const getChallengeLeaderboard = async (challengeId: string, limitCount: number = 10): Promise<ChallengeSubmission[]> => {
    const submissions = await getChallengeSubmissions(challengeId);
    return submissions.slice(0, limitCount);
};

/**
 * Get global leaderboard (by total wins)
 */
export const getGlobalLeaderboard = async (limitCount: number = 20): Promise<UserChallengeStats[]> => {
    try {
        const statsRef = collection(db, "userChallengeStats");
        const q = query(
            statsRef,
            orderBy("totalWins", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map((doc, index) => ({
            id: doc.id,
            ...doc.data(),
            globalRank: index + 1
        } as UserChallengeStats));
    } catch (error) {
        console.error("Error fetching global leaderboard:", error);
        return [];
    }
};

/**
 * Get time remaining for a challenge
 */
export const getTimeRemaining = (endDate: number): { hours: number; minutes: number; seconds: number; expired: boolean } => {
    const now = Date.now();
    const diff = endDate - now;
    
    if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, expired: false };
};

/**
 * Format time remaining as string
 */
export const formatTimeRemaining = (endDate: number): string => {
    const { hours, minutes, expired } = getTimeRemaining(endDate);
    
    if (expired) return "Beendet";
    
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
};
