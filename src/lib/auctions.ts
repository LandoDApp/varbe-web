import { db } from "./firebase";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { Artwork, Bid, Order } from "@/types";
import { createOrder } from "./orders";

/**
 * Process ended auctions and create orders for winners
 * This should be called periodically (e.g., via Cloud Function or cron job)
 */
export const processEndedAuctions = async () => {
    const now = Date.now();
    const artworksRef = collection(db, "artworks");
    
    // Find all active auction listings that have ended
    const q = query(
        artworksRef,
        where("listingType", "in", ["auction", "both"]),
        where("status", "in", ["available", "auction"])
    );
    
    const snapshot = await getDocs(q);
    const endedAuctions: Artwork[] = [];
    
    snapshot.forEach((docSnap) => {
        const artwork = { id: docSnap.id, ...docSnap.data() } as Artwork;
        if (artwork.auctionEndTime && artwork.auctionEndTime < now && artwork.status !== 'sold' && artwork.status !== 'ended') {
            endedAuctions.push(artwork);
        }
    });
    
    console.log(`Found ${endedAuctions.length} ended auctions to process`);
    
    for (const artwork of endedAuctions) {
        try {
            await processEndedAuction(artwork);
        } catch (error) {
            console.error(`Error processing auction ${artwork.id}:`, error);
        }
    }
    
    return endedAuctions.length;
};

/**
 * Process a single ended auction
 */
export const processEndedAuction = async (artwork: Artwork) => {
    if (!artwork.auctionEndTime || artwork.auctionEndTime >= Date.now()) {
        return; // Auction hasn't ended yet
    }
    
    if (artwork.status === 'sold' || artwork.status === 'ended') {
        return; // Already processed
    }
    
    // Get the highest bid
    const bidsRef = collection(db, "bids");
    const bidsQuery = query(
        bidsRef,
        where("listingId", "==", artwork.id),
        where("amount", ">", 0)
    );
    
    const bidsSnapshot = await getDocs(bidsQuery);
    const bids: Bid[] = [];
    
    bidsSnapshot.forEach((docSnap) => {
        bids.push({ id: docSnap.id, ...docSnap.data() } as Bid);
    });
    
    if (bids.length === 0) {
        // No bids, mark as ended
        const artworkRef = doc(db, "artworks", artwork.id);
        await updateDoc(artworkRef, {
            status: 'ended',
            updatedAt: Date.now(),
        });
        console.log(`Auction ${artwork.id} ended with no bids`);
        return;
    }
    
    // Find highest bid
    const highestBid = bids.reduce((max, bid) => bid.amount > max.amount ? bid : max);
    
    // Create order for the winner (status will be 'pending' until payment is confirmed)
    const totalAmount = highestBid.amount + (artwork.shippingCost || 0);
    
    const orderData: any = {
        listingId: artwork.id,
        buyerId: highestBid.userId,
        sellerId: artwork.artistId,
        amount: totalAmount,
    };
    
    // Only add shippingCost if it exists
    if (artwork.shippingCost !== undefined && artwork.shippingCost !== null) {
        orderData.shippingCost = artwork.shippingCost;
    }
    
    const orderId = await createOrder(orderData);
    
    // DO NOT mark artwork as sold here - wait for payment confirmation via Stripe webhook
    // The listing will be marked as 'sold' only after successful payment
    
    // Mark auction as ended (but not sold yet - that happens after payment)
    const artworkRef = doc(db, "artworks", artwork.id);
    await updateDoc(artworkRef, {
        status: 'ended', // Changed from 'sold' to 'ended' - will be 'sold' after payment
        updatedAt: Date.now(),
    });
    
    console.log(`✅ Created order ${orderId} for auction ${artwork.id} winner ${highestBid.userId} (awaiting payment)`);
    
    return orderId;
};

/**
 * Check if an auction has ended (client-side helper)
 */
export const isAuctionEnded = (artwork: Artwork): boolean => {
    if (!artwork.auctionEndTime) return false;
    return artwork.auctionEndTime < Date.now();
};

/**
 * Get time remaining until auction ends (in milliseconds)
 */
export const getTimeRemaining = (artwork: Artwork): number => {
    if (!artwork.auctionEndTime) return 0;
    return Math.max(0, artwork.auctionEndTime - Date.now());
};

