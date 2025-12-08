import { db, storage } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { UserProfile, UserRole, ArtistProfile } from "@/types";

// ========================================
// USERNAME FUNCTIONS
// ========================================

/**
 * Validates a username format
 * @param username The username to validate
 * @returns Object with isValid boolean and optional error message
 */
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
    // Must be 3-20 characters
    if (username.length < 3) {
        return { isValid: false, error: 'username_too_short' };
    }
    if (username.length > 20) {
        return { isValid: false, error: 'username_too_long' };
    }
    
    // Only lowercase letters, numbers, and underscores
    if (!/^[a-z0-9_]+$/.test(username)) {
        return { isValid: false, error: 'username_invalid_characters' };
    }
    
    // Cannot start with a number or underscore
    if (/^[0-9_]/.test(username)) {
        return { isValid: false, error: 'username_invalid_start' };
    }
    
    // Cannot end with underscore
    if (/_$/.test(username)) {
        return { isValid: false, error: 'username_invalid_end' };
    }
    
    // No consecutive underscores
    if (/__/.test(username)) {
        return { isValid: false, error: 'username_consecutive_underscores' };
    }
    
    // Reserved usernames
    const reserved = ['admin', 'varbe', 'support', 'help', 'info', 'contact', 'system', 'moderator', 'mod', 'official'];
    if (reserved.includes(username)) {
        return { isValid: false, error: 'username_reserved' };
    }
    
    return { isValid: true };
};

/**
 * Checks if a username is available
 * @param username The username to check (will be lowercased)
 * @returns True if available, false if taken
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const normalizedUsername = username.toLowerCase().trim();
    
    // First validate format
    const validation = validateUsername(normalizedUsername);
    if (!validation.isValid) {
        return false;
    }
    
    try {
        // Check in the usernames collection (lookup table)
        const usernameRef = doc(db, "usernames", normalizedUsername);
        const usernameSnap = await getDoc(usernameRef);
        
        return !usernameSnap.exists();
    } catch (error) {
        console.error("Error checking username availability:", error);
        return false;
    }
};

/**
 * Sets a username for a user (atomic operation)
 * Uses a transaction to ensure uniqueness
 * @param uid The user's UID
 * @param username The desired username (will be lowercased)
 * @returns Object with success boolean and optional error
 */
export const setUsername = async (uid: string, username: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedUsername = username.toLowerCase().trim();
    
    // Validate format
    const validation = validateUsername(normalizedUsername);
    if (!validation.isValid) {
        return { success: false, error: validation.error };
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            // Check if username is taken
            const usernameRef = doc(db, "usernames", normalizedUsername);
            const usernameSnap = await transaction.get(usernameRef);
            
            if (usernameSnap.exists()) {
                throw new Error('username_taken');
            }
            
            // Check if user already has a username
            const userRef = doc(db, "users", uid);
            const userSnap = await transaction.get(userRef);
            
            if (!userSnap.exists()) {
                throw new Error('user_not_found');
            }
            
            const userData = userSnap.data() as UserProfile;
            
            // If user already has a username, delete the old one from lookup table
            if (userData.username) {
                const oldUsernameRef = doc(db, "usernames", userData.username);
                transaction.delete(oldUsernameRef);
            }
            
            // Create the username lookup entry
            transaction.set(usernameRef, {
                uid: uid,
                createdAt: Date.now()
            });
            
            // Update the user's profile with the new username
            transaction.update(userRef, {
                username: normalizedUsername
            });
        });
        
        console.log("✅ Username set successfully:", normalizedUsername);
        return { success: true };
    } catch (error: any) {
        console.error("Error setting username:", error);
        
        if (error.message === 'username_taken') {
            return { success: false, error: 'username_taken' };
        }
        if (error.message === 'user_not_found') {
            return { success: false, error: 'user_not_found' };
        }
        
        return { success: false, error: 'unknown_error' };
    }
};

/**
 * Gets a user by their username
 * @param username The username to look up
 * @returns The user profile or null if not found
 */
export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
    const normalizedUsername = username.toLowerCase().trim();
    
    try {
        // Look up the UID from the usernames collection
        const usernameRef = doc(db, "usernames", normalizedUsername);
        const usernameSnap = await getDoc(usernameRef);
        
        if (!usernameSnap.exists()) {
            return null;
        }
        
        const { uid } = usernameSnap.data();
        return await getUserProfile(uid);
    } catch (error) {
        console.error("Error getting user by username:", error);
        return null;
    }
};

export const createUserProfile = async (uid: string, email: string, displayName: string, role: UserRole = 'buyer', emailVerified: boolean = false): Promise<{ profile: UserProfile; isNew: boolean }> => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUser: UserProfile = {
            uid,
            email,
            displayName,
            role, // Use provided role or default to 'buyer'
            verificationStatus: 'none',
            emailVerified, // Set email verification status
            createdAt: Date.now(),
        };
        await setDoc(userRef, newUser);
        console.log("✅ User profile created:", newUser);
        return { profile: newUser, isNew: true };
    }
    const existingProfile = userSnap.data() as UserProfile;
    console.log("ℹ️ User profile already exists:", existingProfile);
    return { profile: existingProfile, isNew: false };
};

export const getUserProfile = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        }
        return null;
    } catch (error: any) {
        // Handle offline errors gracefully
        if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
            console.warn("Firestore is offline, profile will be fetched when online");
            return null;
        }
        console.error("Error fetching user profile:", error);
        // Return null instead of throwing - allows UI to continue
        return null;
    }
};

/**
 * Gets the artist profile data (stored as artistProfile field in users collection)
 * This contains additional artist info like artistName, artStyle, bio, portfolioImages
 */
export const getArtistProfile = async (uid: string): Promise<ArtistProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            // Artist profile is stored as a nested field in the user document
            if (userData.artistProfile) {
                return userData.artistProfile as ArtistProfile;
            }
        }
        return null;
    } catch (error: any) {
        console.error("Error fetching artist profile:", error);
        return null;
    }
};

export const updateUserRole = async (uid: string, role: UserRole) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { role });
};

export const getPendingVerifications = async () => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("verificationStatus", "==", "pending"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserProfile & { id: string; artistProfile?: any }));
    } catch (error: any) {
        console.error("Error fetching pending verifications:", error);
        // If query fails (e.g., missing index), try fetching all and filtering client-side
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn("Query requires index, falling back to client-side filter");
            const usersRef = collection(db, "users");
            const allUsersSnapshot = await getDocs(usersRef);
            return allUsersSnapshot.docs
                .filter(doc => doc.data().verificationStatus === 'pending')
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as UserProfile & { id: string; artistProfile?: any }));
        }
        throw error;
    }
};

/**
 * Badge options for artist verification approval
 */
export interface VerificationBadgeOptions {
    kiFreeVerified?: boolean;      // 🎨 KI-Frei Badge - nur wenn Prozess-Bilder überzeugend sind
    pioneerBadge?: boolean;        // 🚀 Pionier Badge - einer der ersten 50 verifizierten Künstler
    founderBadge?: boolean;        // ⭐ Gründer Badge - einer der ersten 100 Künstler
}

/**
 * Approves artist verification with optional badge awards
 * @param uid User ID to approve
 * @param adminId Admin who approved
 * @param badgeOptions Which badges to award (admin decides based on review)
 */
export const approveArtistVerification = async (
    uid: string, 
    adminId: string, 
    badgeOptions?: VerificationBadgeOptions
) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    const currentAchievements = userData.achievementData?.achievements || [];
    const newAchievements = [...currentAchievements];
    
    // Award badges based on admin selection
    const badgesToAward: string[] = [];
    
    if (badgeOptions?.kiFreeVerified) {
        badgesToAward.push('ki_free_verified');
    }
    if (badgeOptions?.pioneerBadge) {
        badgesToAward.push('first_artist'); // Pionier badge
    }
    if (badgeOptions?.founderBadge) {
        badgesToAward.push('founder'); // Gründer badge
    }
    
    // Add badges that user doesn't already have
    for (const badgeId of badgesToAward) {
        if (!newAchievements.some((a: any) => a.badgeId === badgeId)) {
            newAchievements.push({
                badgeId,
                unlockedAt: Date.now(),
                progress: { current: 1, target: 1 }
            });
        }
    }
    
    // Calculate updated stats
    const totalPoints = newAchievements.reduce((sum: number, a: any) => {
        const badgePoints: { [key: string]: number } = {
            'ki_free_verified': 100,
            'first_artist': 750,
            'founder': 500,
        };
        return sum + (badgePoints[a.badgeId] || 0);
    }, 0);
    
    // Preserve admin role - only set to 'seller' if user is not already admin
    const currentRole = userData.role;
    const updateData: any = {
        verificationStatus: 'verified',
        verifiedAt: Date.now(),
        verifiedBy: adminId,
    };
    
    // Only update role to 'seller' if not already admin
    if (currentRole !== 'admin') {
        updateData.role = 'seller';
    }
    
    // Only update achievement data if there are badges to award
    if (badgesToAward.length > 0) {
        updateData['achievementData.achievements'] = newAchievements;
        updateData['achievementData.stats.totalBadges'] = newAchievements.length;
        updateData['achievementData.stats.totalPoints'] = totalPoints;
        updateData['achievementData.stats.lastActiveAt'] = Date.now();
        
        // Mark KI-free status if badge awarded
        if (badgeOptions?.kiFreeVerified) {
            updateData.isKiFreeVerified = true;
        }
    }
    
    await updateDoc(userRef, updateData);
    
    return {
        success: true,
        badgesAwarded: badgesToAward,
    };
};

export const rejectArtistVerification = async (uid: string, adminId: string, reason?: string) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        verificationStatus: 'rejected',
    });
};

/**
 * Uploads a profile picture and deletes the old one if it exists
 * @param file The image file to upload
 * @param userId The user ID
 * @param oldProfilePictureUrl Optional URL of the old profile picture to delete
 * @returns The download URL of the uploaded profile picture
 */
export const uploadProfilePicture = async (
    file: File,
    userId: string,
    oldProfilePictureUrl?: string
): Promise<string> => {
    // Delete old profile picture if it exists
    if (oldProfilePictureUrl) {
        try {
            // Extract the path from the full URL
            // Firebase Storage URLs are like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
            const url = new URL(oldProfilePictureUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
            if (pathMatch) {
                const decodedPath = decodeURIComponent(pathMatch[1]);
                const oldStorageRef = ref(storage, decodedPath);
                await deleteObject(oldStorageRef);
                console.log("✅ Old profile picture deleted:", decodedPath);
            }
        } catch (error: any) {
            // If deletion fails (e.g., file doesn't exist), continue anyway
            console.warn("Could not delete old profile picture:", error);
        }
    }

    // Upload new profile picture
    const storageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ Profile picture uploaded:", downloadURL);
    return downloadURL;
};

/**
 * Updates the user's profile picture URL in Firestore
 * @param uid The user ID
 * @param profilePictureUrl The new profile picture URL
 */
export const updateProfilePicture = async (uid: string, profilePictureUrl: string) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        profilePictureUrl,
    });
};

/**
 * Gets all user profiles (for search functionality)
 * @returns Array of all user profiles
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id,
        } as UserProfile));
    } catch (error: any) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

/**
 * Gets all verified artists
 * @returns Array of verified artist profiles
 */
export const getVerifiedArtists = async (): Promise<(UserProfile & { artistProfile?: any })[]> => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("verificationStatus", "==", "verified"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id,
        } as UserProfile & { artistProfile?: any }));
    } catch (error: any) {
        console.error("Error fetching verified artists:", error);
        // Fallback to client-side filtering
        const usersRef = collection(db, "users");
        const allUsersSnapshot = await getDocs(usersRef);
        return allUsersSnapshot.docs
            .filter(doc => doc.data().verificationStatus === 'verified')
            .map(doc => ({
                ...doc.data(),
                uid: doc.id,
            } as UserProfile & { artistProfile?: any }));
    }
};
