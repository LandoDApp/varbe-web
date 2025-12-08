import { db } from "./firebase";
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { Order } from "@/types";

/**
 * Sync all pending orders with Stripe to check if they were actually paid
 * This function runs client-side and uses the Stripe sessions from the API
 */
export const syncOrdersWithStripe = async (stripeSessions: Record<string, {
    id: string;
    payment_status: string;
    status: string;
    payment_intent: string | null;
}>) => {
    console.log("🔄 Syncing orders with Stripe...");
    
    try {
        // Get all pending orders (client-side, so we have auth context)
        console.log("🔍 Fetching pending orders from Firestore...");
        const ordersRef = collection(db, "orders");
        const pendingOrdersQuery = query(ordersRef, where("status", "==", "pending"));
        
        let pendingOrdersSnapshot;
        try {
            pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);
            console.log(`✅ Found ${pendingOrdersSnapshot.size} pending orders`);
        } catch (firestoreError) {
            const err = firestoreError as Error;
            console.error("❌ Firestore query error:", err.message);
            throw new Error(`Failed to fetch orders: ${err.message}`);
        }
        
        let synced = 0;
        let errors = 0;
        
        // Check each pending order
        for (const orderDoc of pendingOrdersSnapshot.docs) {
            const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
            const session = stripeSessions[order.id];
            
            if (session) {
                console.log(`🔍 Checking order ${order.id} with session ${session.id}`);
                console.log(`📋 Payment status: ${session.payment_status}, Session status: ${session.status}`);
                
                // If payment was successful, update order
                if (session.payment_status === "paid" && session.status === "complete") {
                    try {
                        const orderRef = doc(db, "orders", order.id);
                        await updateDoc(orderRef, {
                            status: "paid",
                            stripePaymentIntentId: session.payment_intent,
                            updatedAt: Date.now(),
                        });
                        console.log(`✅ Order ${order.id} marked as paid`);
                        
                        // Update listing quantity and mark as sold only if quantity reaches 0
                        if (order.listingId) {
                            try {
                                const listingRef = doc(db, "artworks", order.listingId);
                                const listingSnap = await getDoc(listingRef);
                                
                                if (listingSnap.exists()) {
                                    const listingData = listingSnap.data();
                                    const orderQuantity = order.quantity || 1;
                                    const currentQuantity = listingData.quantity !== undefined ? listingData.quantity : 1;
                                    const newQuantity = Math.max(0, currentQuantity - orderQuantity);
                                    
                                    const updateData: any = {
                                        updatedAt: Date.now(),
                                    };
                                    
                                    // Update quantity
                                    if (listingData.quantity !== undefined) {
                                        updateData.quantity = newQuantity;
                                    }
                                    
                                    // Mark as sold only if quantity reaches 0
                                    if (newQuantity === 0 && listingData.status !== 'sold') {
                                        updateData.status = 'sold';
                                        console.log(`✅ Listing ${order.listingId} marked as sold (quantity reached 0)`);
                                    } else if (newQuantity > 0) {
                                        console.log(`✅ Listing ${order.listingId} quantity updated: ${currentQuantity} -> ${newQuantity}`);
                                    }
                                    
                                    await updateDoc(listingRef, updateData);
                                }
                            } catch (listingError) {
                                console.error(`❌ Could not update listing ${order.listingId}:`, listingError);
                            }
                        }
                        
                        synced++;
                    } catch (updateError) {
                        console.error(`❌ Could not update order ${order.id}:`, updateError);
                        errors++;
                    }
                }
            } else {
                console.log(`ℹ️ No Stripe session found for order ${order.id}`);
            }
        }
        
        console.log(`✅ Synced ${synced} orders, ${errors} errors`);
        return { synced, errors, total: pendingOrdersSnapshot.size };
    } catch (error) {
        console.error("❌ Error syncing orders with Stripe:", error);
        throw error;
    }
};

