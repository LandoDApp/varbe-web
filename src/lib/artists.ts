import { db } from "./firebase";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

/**
 * Get featured artists (verified artists with sales)
 */
export const getFeaturedArtists = async (count: number = 5): Promise<UserProfile[]> => {
    try {
        // Get verified artists
        const usersRef = collection(db, "users");
        const q = query(
            usersRef,
            where("verificationStatus", "==", "verified"),
            where("role", "in", ["seller", "admin"]),
            orderBy("createdAt", "desc"),
            limit(count * 2) // Get more to filter
        );

        const snapshot = await getDocs(q);
        const artists = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        } as UserProfile));

        // Filter artists that have featured flag or have sales
        // For now, just return verified artists (can be enhanced later)
        return artists.slice(0, count);
    } catch (error) {
        console.error("Error fetching featured artists:", error);
        return [];
    }
};

/**
 * Set artist as featured
 */
export const setFeaturedArtist = async (userId: string, featured: boolean): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        featured: featured,
        featuredAt: featured ? Date.now() : null,
    });
};



