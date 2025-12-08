import { db } from "./firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Artwork, ArtCategory } from "@/types";

/**
 * Get similar artworks based on category, technique, and price range
 */
export const getSimilarArtworks = async (
    artworkId: string,
    category: ArtCategory,
    technique?: string,
    maxPrice?: number,
    count: number = 4
): Promise<Artwork[]> => {
    try {
        const artworksRef = collection(db, "artworks");
        
        // Simplified query - only filter by category
        // Filter approved status and other conditions in memory to avoid composite index
        let q = query(
            artworksRef,
            where("category", "==", category),
            limit(100) // Get more to filter in memory
        );

        const snapshot = await getDocs(q);
        let artworks = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Artwork))
            .filter(a => 
                a.id !== artworkId && // Exclude current artwork
                a.adminApprovalStatus === 'approved' && // Filter approved in memory
                (a.status === 'available' || a.status === 'auction') // Filter status in memory
            );

        // Filter by technique if provided
        if (technique) {
            artworks = artworks.filter(a => a.technique === technique);
        }

        // Filter by price range if provided (within 50% of maxPrice)
        if (maxPrice) {
            const minPrice = maxPrice * 0.5;
            const maxPriceRange = maxPrice * 1.5;
            artworks = artworks.filter(a => {
                const price = a.price || 0;
                return price >= minPrice && price <= maxPriceRange;
            });
        }

        // Shuffle and return limited count
        const shuffled = artworks.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    } catch (error) {
        console.error("Error fetching similar artworks:", error);
        return [];
    }
};

/**
 * Get artworks by same artist
 * Uses simpler query to avoid composite index requirements
 */
export const getArtworksBySameArtist = async (
    artistId: string,
    excludeArtworkId: string,
    count: number = 4
): Promise<Artwork[]> => {
    try {
        const artworksRef = collection(db, "artworks");
        // Simplified query - only filter by artistId
        // Filter approved status and other conditions in memory to avoid composite index
        const q = query(
            artworksRef,
            where("artistId", "==", artistId),
            limit(50) // Get more to filter in memory
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Artwork))
            .filter(a => 
                a.id !== excludeArtworkId &&
                a.adminApprovalStatus === 'approved' && // Filter approved in memory
                (a.status === 'available' || a.status === 'auction') // Filter status in memory
            )
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) // Sort by date in memory
            .slice(0, count);
    } catch (error) {
        console.error("Error fetching artworks by same artist:", error);
        return [];
    }
};

