import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { Review, Order } from "@/types";

/**
 * Check if a user can review an artist (must have a delivered order)
 */
export const canReviewArtist = async (buyerId: string, artistId: string): Promise<{ canReview: boolean; orderId?: string; reason?: string }> => {
    try {
        // Check if buyer has any delivered orders from this artist
        const ordersRef = collection(db, "orders");
        const deliveredOrdersQuery = query(
            ordersRef,
            where("buyerId", "==", buyerId),
            where("sellerId", "==", artistId),
            where("status", "==", "delivered")
        );
        
        const snapshot = await getDocs(deliveredOrdersQuery);
        
        if (snapshot.empty) {
            return { 
                canReview: false, 
                reason: "Du hast noch keine abgeschlossene Bestellung von diesem Künstler." 
            };
        }
        
        // Check if buyer already reviewed this artist for any of these orders
        const reviewsRef = collection(db, "reviews");
        const existingReviewsQuery = query(
            reviewsRef,
            where("buyerId", "==", buyerId),
            where("artistId", "==", artistId)
        );
        
        const existingReviewsSnapshot = await getDocs(existingReviewsQuery);
        
        if (!existingReviewsSnapshot.empty) {
            // Check if there's an order that hasn't been reviewed yet
            const reviewedOrderIds = existingReviewsSnapshot.docs.map(doc => doc.data().orderId);
            const deliveredOrderIds = snapshot.docs.map(doc => doc.id);
            
            const unreviewedOrderId = deliveredOrderIds.find(id => !reviewedOrderIds.includes(id));
            
            if (!unreviewedOrderId) {
                return { 
                    canReview: false, 
                    reason: "Du hast diesen Künstler bereits für alle deine Bestellungen bewertet." 
                };
            }
            
            return { 
                canReview: true, 
                orderId: unreviewedOrderId 
            };
        }
        
        // Use the first delivered order
        const firstOrder = snapshot.docs[0];
        return { 
            canReview: true, 
            orderId: firstOrder.id 
        };
        
    } catch (error: any) {
        console.error("Error checking if user can review:", error);
        return { 
            canReview: false, 
            reason: "Fehler beim Prüfen der Bewertungsberechtigung." 
        };
    }
};

/**
 * Create a review for an artist
 */
export const createReview = async (
    artistId: string,
    buyerId: string,
    orderId: string,
    rating: number,
    comment?: string
): Promise<string> => {
    // Validate rating
    if (rating < 1 || rating > 5) {
        throw new Error("Bewertung muss zwischen 1 und 5 Sternen liegen.");
    }
    
    // Verify that the order exists and is delivered
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Bestellung nicht gefunden.");
    }
    
    const order = orderSnap.data() as Order;
    
    if (order.status !== 'delivered') {
        throw new Error("Du kannst nur Künstler bewerten, deren Bestellungen bereits zugestellt wurden.");
    }
    
    if (order.buyerId !== buyerId) {
        throw new Error("Du kannst nur deine eigenen Bestellungen bewerten.");
    }
    
    if (order.sellerId !== artistId) {
        throw new Error("Diese Bestellung gehört nicht zu diesem Künstler.");
    }
    
    // Check if review already exists for this order
    const reviewsRef = collection(db, "reviews");
    const existingReviewQuery = query(
        reviewsRef,
        where("orderId", "==", orderId),
        where("buyerId", "==", buyerId)
    );
    
    const existingReviewSnapshot = await getDocs(existingReviewQuery);
    if (!existingReviewSnapshot.empty) {
        throw new Error("Du hast diese Bestellung bereits bewertet.");
    }
    
    // Create review
    const reviewData = {
        artistId,
        buyerId,
        orderId,
        rating,
        comment: comment?.trim() || null,
        createdAt: Date.now(),
    };
    
    // Remove null values
    Object.keys(reviewData).forEach(key => {
        if (reviewData[key as keyof typeof reviewData] === null) {
            delete reviewData[key as keyof typeof reviewData];
        }
    });
    
    const docRef = await addDoc(collection(db, "reviews"), reviewData);
    return docRef.id;
};

/**
 * Get reviews for an artist
 */
export const getArtistReviews = async (artistId: string, limitCount: number = 50): Promise<Review[]> => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
        reviewsRef,
        where("artistId", "==", artistId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

/**
 * Get average rating for an artist
 */
export const getArtistAverageRating = async (artistId: string): Promise<{ average: number; count: number }> => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
        reviewsRef,
        where("artistId", "==", artistId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return { average: 0, count: 0 };
    }
    
    const reviews = snapshot.docs.map(doc => doc.data() as Review);
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = totalRating / reviews.length;
    
    return {
        average: Math.round(average * 10) / 10, // Round to 1 decimal
        count: reviews.length
    };
};

/**
 * Get review for a specific order
 */
export const getReviewForOrder = async (orderId: string): Promise<Review | null> => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
        reviewsRef,
        where("orderId", "==", orderId),
        limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Review;
};



