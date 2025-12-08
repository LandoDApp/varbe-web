/**
 * VARBE Profile Comments (Guestbook-Style)
 * 
 * Users can leave comments on other users' profiles.
 * Profile owners can delete comments on their own profile.
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
    deleteDoc,
    limit,
    updateDoc,
    increment
} from "firebase/firestore";
import { ProfileComment } from "@/types";

// ========================================
// PROFILE COMMENT OPERATIONS
// ========================================

/**
 * Add a comment to a user's profile
 */
export async function addProfileComment(
    profileUserId: string,
    authorId: string,
    text: string
): Promise<string> {
    const commentData = {
        profileUserId,
        authorId,
        text: text.trim(),
        likesCount: 0,
        createdAt: Date.now(),
    };
    
    const docRef = await addDoc(collection(db, "profileComments"), commentData);
    return docRef.id;
}

/**
 * Get comments for a user's profile
 */
export async function getProfileComments(
    profileUserId: string,
    limitCount: number = 50
): Promise<ProfileComment[]> {
    try {
        const q = query(
            collection(db, "profileComments"),
            where("profileUserId", "==", profileUserId),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ProfileComment));
    } catch (error) {
        console.error("Error fetching profile comments:", error);
        // Fallback: get all and filter client-side
        try {
            const allSnapshot = await getDocs(collection(db, "profileComments"));
            return allSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as ProfileComment))
                .filter(c => c.profileUserId === profileUserId)
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, limitCount);
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            return [];
        }
    }
}

/**
 * Delete a profile comment
 * Only the profile owner or the comment author can delete
 */
export async function deleteProfileComment(
    commentId: string,
    requestingUserId: string
): Promise<void> {
    const commentRef = doc(db, "profileComments", commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
        throw new Error("Comment not found");
    }
    
    const comment = commentSnap.data() as ProfileComment;
    
    // Check permission: profile owner OR comment author
    if (comment.profileUserId !== requestingUserId && comment.authorId !== requestingUserId) {
        throw new Error("You don't have permission to delete this comment");
    }
    
    await deleteDoc(commentRef);
}

/**
 * Like a profile comment
 */
export async function likeProfileComment(commentId: string): Promise<void> {
    const commentRef = doc(db, "profileComments", commentId);
    await updateDoc(commentRef, {
        likesCount: increment(1)
    });
}

/**
 * Get comment count for a profile
 */
export async function getProfileCommentCount(profileUserId: string): Promise<number> {
    try {
        const q = query(
            collection(db, "profileComments"),
            where("profileUserId", "==", profileUserId)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting comment count:", error);
        return 0;
    }
}


