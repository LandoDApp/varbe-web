import { db } from "./firebase";
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";

/**
 * Increment view count for an artwork
 * Uses Firestore increment to avoid race conditions
 */
export const incrementViewCount = async (listingId: string): Promise<void> => {
    try {
        const listingRef = doc(db, "artworks", listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (!listingSnap.exists()) {
            console.warn(`Listing ${listingId} not found`);
            return;
        }

        // Use increment to atomically update the view count
        await updateDoc(listingRef, {
            views: increment(1),
            updatedAt: Date.now(),
        });
    } catch (error) {
        console.error("Error incrementing view count:", error);
        // Don't throw - views are not critical
    }
};

/**
 * Get view count for an artwork
 */
export const getViewCount = async (listingId: string): Promise<number> => {
    try {
        const listingRef = doc(db, "artworks", listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (!listingSnap.exists()) {
            return 0;
        }

        const data = listingSnap.data();
        return data.views || 0;
    } catch (error) {
        console.error("Error getting view count:", error);
        return 0;
    }
};



