import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { Order } from "@/types";
import { calculateFees } from "./fees";

/**
 * Migrate old orders to include fee breakdown and earnings calculation
 * This runs client-side with auth context, so it can only migrate orders for the current user
 */
export const migrateOrdersToNewFeeSystem = async (userId: string): Promise<{ updated: number; errors: number }> => {
    console.log("🔄 Starting order migration for user:", userId);
    
    // Only migrate orders for this user (as seller)
    const ordersRef = collection(db, "orders");
    const userOrdersQuery = query(ordersRef, where("sellerId", "==", userId));
    const ordersSnapshot = await getDocs(userOrdersQuery);
    
    console.log(`📊 Found ${ordersSnapshot.size} orders to check`);
    
    let updated = 0;
    let errors = 0;
    
    for (const orderDoc of ordersSnapshot.docs) {
        try {
            const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
            
            // Skip if already migrated
            if (order.salePrice !== undefined && order.varbeFee !== undefined && order.artistEarnings !== undefined) {
                console.log(`⏭️ Order ${orderDoc.id} already migrated, skipping`);
                continue;
            }
            
            // Calculate sale price (amount - shipping)
            const salePrice = order.amount - (order.shippingCost || 0);
            
            // Calculate fees
            const feeBreakdown = calculateFees(salePrice);
            
            // Update order with fee breakdown
            const updateData: any = {
                salePrice: salePrice,
                varbeFee: feeBreakdown.varbeFee,
                stripeFee: feeBreakdown.stripeFee,
                artistEarnings: feeBreakdown.artistEarnings,
                updatedAt: Date.now(),
            };
            
            // Set earningsStatus if not set
            if (!order.earningsStatus) {
                if (order.status === 'delivered' && order.buyerProtectionEndsAt) {
                    // Check if protection expired
                    const now = Date.now();
                    if (order.buyerProtectionEndsAt < now) {
                        updateData.earningsStatus = 'available';
                    } else {
                        updateData.earningsStatus = 'pending';
                    }
                } else if (order.status === 'delivered') {
                    // Old order marked as delivered but no protection date
                    // Set protection end date (14 days from now, or from deliveredAt if exists)
                    const deliveredAt = order.deliveredAt || Date.now();
                    updateData.deliveredAt = deliveredAt;
                    updateData.buyerProtectionEndsAt = deliveredAt + (14 * 24 * 60 * 60 * 1000);
                    updateData.buyerProtectionStatus = 'active';
                    updateData.earningsStatus = 'pending';
                } else if (order.status === 'paid' || order.status === 'shipped') {
                    updateData.earningsStatus = 'pending';
                }
            }
            
            await updateDoc(doc(db, "orders", orderDoc.id), updateData);
            console.log(`✅ Migrated order ${orderDoc.id}`);
            updated++;
        } catch (error) {
            console.error(`❌ Error migrating order ${orderDoc.id}:`, error);
            errors++;
        }
    }
    
    console.log(`✅ Migration complete: ${updated} updated, ${errors} errors`);
    return { updated, errors };
};

