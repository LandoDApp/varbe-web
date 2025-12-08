/**
 * Script to fix listings that were incorrectly marked as 'sold' 
 * without a corresponding paid order.
 * 
 * This should be run once to clean up listings that were marked as sold
 * before the payment confirmation system was implemented.
 */

import { db } from "./firebase";
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { Artwork, Order } from "@/types";

/**
 * Reset listings that are marked as 'sold' but don't have a paid order
 */
export const fixIncorrectlySoldListings = async () => {
    console.log("🔍 Starting fix for incorrectly sold listings...");
    
    // Get all listings marked as 'sold'
    const artworksRef = collection(db, "artworks");
    const soldQuery = query(artworksRef, where("status", "==", "sold"));
    const soldSnapshot = await getDocs(soldQuery);
    
    console.log(`Found ${soldSnapshot.size} listings marked as 'sold'`);
    
    const fixedListings: string[] = [];
    const skippedListings: string[] = [];
    
    // Check each sold listing
    for (const listingDoc of soldSnapshot.docs) {
        const listing = { id: listingDoc.id, ...listingDoc.data() } as Artwork;
        
        // Check if there's a paid order for this listing
        const ordersRef = collection(db, "orders");
        const orderQuery = query(
            ordersRef,
            where("listingId", "==", listing.id),
            where("status", "==", "paid")
        );
        const orderSnapshot = await getDocs(orderQuery);
        
        if (orderSnapshot.empty) {
            // No paid order found - this listing was incorrectly marked as sold
            console.log(`⚠️  Listing ${listing.id} (${listing.title}) marked as sold but has no paid order`);
            
            // Determine correct status based on listing type
            let newStatus: 'available' | 'auction' | 'ended' = 'available';
            
            if (listing.listingType === 'auction' || listing.listingType === 'both') {
                // Check if auction has ended
                if (listing.auctionEndTime && listing.auctionEndTime < Date.now()) {
                    newStatus = 'ended';
                } else {
                    newStatus = 'auction';
                }
            }
            
            // Update listing status
            const listingRef = doc(db, "artworks", listing.id);
            await updateDoc(listingRef, {
                status: newStatus,
                updatedAt: Date.now(),
            });
            
            fixedListings.push(listing.id);
            console.log(`✅ Reset listing ${listing.id} to status '${newStatus}'`);
        } else {
            // Has paid order - this is correct
            skippedListings.push(listing.id);
            console.log(`✓ Listing ${listing.id} correctly has paid order`);
        }
    }
    
    console.log("\n========================================");
    console.log("📊 Fix Summary:");
    console.log(`✅ Fixed: ${fixedListings.length} listings`);
    console.log(`✓ Skipped (correct): ${skippedListings.length} listings`);
    console.log("========================================");
    
    return {
        fixed: fixedListings,
        skipped: skippedListings,
        totalFixed: fixedListings.length,
    };
};

/**
 * Check for pending orders that should have their listings marked as sold
 * (in case webhook failed or payment was processed manually)
 */
export const syncPaidOrdersToListings = async () => {
    console.log("🔍 Syncing paid orders to listings...");
    
    // Get all paid orders
    const ordersRef = collection(db, "orders");
    const paidOrdersQuery = query(ordersRef, where("status", "==", "paid"));
    const paidOrdersSnapshot = await getDocs(paidOrdersQuery);
    
    console.log(`Found ${paidOrdersSnapshot.size} paid orders`);
    
    let synced = 0;
    
    for (const orderDoc of paidOrdersSnapshot.docs) {
        const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
        
        // Check if listing is marked as sold
        const listingRef = doc(db, "artworks", order.listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
            const listing = listingSnap.data() as Artwork;
            
            if (listing.status !== 'sold') {
                // Listing should be marked as sold but isn't
                await updateDoc(listingRef, {
                    status: 'sold',
                    updatedAt: Date.now(),
                });
                console.log(`✅ Marked listing ${order.listingId} as sold (order ${order.id} is paid)`);
                synced++;
            }
        }
    }
    
    console.log(`✅ Synced ${synced} listings`);
    return synced;
};






