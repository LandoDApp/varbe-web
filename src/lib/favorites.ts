import { db } from "./firebase";
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, getDoc } from "firebase/firestore";

export interface Favorite {
    id: string;
    userId: string;
    listingId: string;
    createdAt: number;
}

/**
 * Add artwork to favorites
 */
export const addToFavorites = async (userId: string, listingId: string): Promise<string> => {
    // Check if already favorited
    const existing = await getFavorite(userId, listingId);
    if (existing) {
        return existing.id;
    }

    const favoriteData = {
        userId,
        listingId,
        createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, "favorites"), favoriteData);
    return docRef.id;
};

/**
 * Remove artwork from favorites
 */
export const removeFromFavorites = async (userId: string, listingId: string): Promise<void> => {
    const favorite = await getFavorite(userId, listingId);
    if (favorite) {
        await deleteDoc(doc(db, "favorites", favorite.id));
    }
};

/**
 * Check if artwork is favorited by user
 */
export const getFavorite = async (userId: string, listingId: string): Promise<Favorite | null> => {
    const favoritesRef = collection(db, "favorites");
    const q = query(
        favoritesRef,
        where("userId", "==", userId),
        where("listingId", "==", listingId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    } as Favorite;
};

/**
 * Get all favorites for a user
 */
export const getUserFavorites = async (userId: string): Promise<Favorite[]> => {
    const favoritesRef = collection(db, "favorites");
    const q = query(
        favoritesRef,
        where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Favorite));
};

/**
 * Get favorite count for a listing
 */
export const getFavoriteCount = async (listingId: string): Promise<number> => {
    const favoritesRef = collection(db, "favorites");
    const q = query(
        favoritesRef,
        where("listingId", "==", listingId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
};



