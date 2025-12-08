import { db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { Order, SellerBalance } from "@/types";
import { calculateFees } from "./fees";
import { notifyOrderDelivered } from "./notifications";

/**
 * Calculate seller balance from orders
 */
export const calculateSellerBalance = async (sellerId: string): Promise<SellerBalance> => {
    // Get all paid orders for this seller
    const ordersRef = collection(db, "orders");
    const sellerOrdersQuery = query(
        ordersRef,
        where("sellerId", "==", sellerId)
    );
    
    const ordersSnapshot = await getDocs(sellerOrdersQuery);
    const orders: Order[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Order));
    
    // Filter for paid/delivered orders only
    const paidOrders = orders.filter(o => 
        o.status === 'paid' || 
        o.status === 'shipped' || 
        o.status === 'delivered'
    );
    
    const now = Date.now();
    
    let availableBalance = 0;
    let pendingBalance = 0;
    let totalEarnings = 0;
    
    for (const order of paidOrders) {
        // Calculate earnings if not present (for old orders)
        let earnings = order.artistEarnings;
        if (!earnings && order.salePrice) {
            // Calculate from salePrice
            const feeBreakdown = calculateFees(order.salePrice);
            earnings = feeBreakdown.artistEarnings;
        } else if (!earnings && order.amount) {
            // Fallback: estimate from total amount (excluding shipping)
            const salePrice = order.amount - (order.shippingCost || 0);
            const feeBreakdown = calculateFees(salePrice);
            earnings = feeBreakdown.artistEarnings;
        } else if (!earnings) {
            // No way to calculate, skip
            console.warn(`Order ${order.id} has no earnings data and cannot be calculated`);
            continue;
        }
        
        totalEarnings += earnings;
        
        // Check if buyer protection has expired
        if (order.buyerProtectionEndsAt && order.buyerProtectionEndsAt < now) {
            // Protection expired, earnings are available (unless already paid out)
            if (order.earningsStatus !== 'paid_out') {
                availableBalance += earnings;
            }
        } else if (order.deliveredAt) {
            // Protection still active (delivered but protection not expired)
            pendingBalance += earnings;
        } else if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
            // Not delivered yet or delivered but no protection date set, still pending
            // For old orders without deliveredAt, assume they're still in protection
            pendingBalance += earnings;
        }
    }
    
    // Calculate next payout date (15th of next month)
    const nextPayoutDate = getNextPayoutDate();
    
    return {
        userId: sellerId,
        availableBalance,
        pendingBalance,
        totalEarnings,
        nextPayoutDate,
    };
};

/**
 * Get next payout date (15th of next month)
 */
export const getNextPayoutDate = (): number => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    
    // If we're past the 15th, next payout is 15th of next month
    // Otherwise, next payout is 15th of this month
    const targetMonth = dayOfMonth > 15 ? now.getMonth() + 1 : now.getMonth();
    const targetYear = targetMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
    const finalMonth = targetMonth % 12;
    
    return new Date(targetYear, finalMonth, 15).getTime();
};

/**
 * Update order buyer protection when order is marked as delivered
 */
export const markOrderAsDelivered = async (orderId: string): Promise<void> => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }
    
    const order = orderSnap.data() as Order;
    
    if (order.status !== 'shipped') {
        throw new Error("Order must be shipped before marking as delivered");
    }
    
    const deliveredAt = Date.now();
    const buyerProtectionEndsAt = deliveredAt + (14 * 24 * 60 * 60 * 1000); // 14 days
    
    await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt,
        buyerProtectionEndsAt,
        buyerProtectionStatus: 'active',
        earningsStatus: 'pending', // Still in buyer protection
        updatedAt: Date.now(),
    });
    
    // Notify buyer that order is delivered
    try {
        await notifyOrderDelivered(orderId, order.buyerId, order.listingId);
    } catch (notifError) {
        console.error("Error creating delivery notification:", notifError);
    }
};

/**
 * Release earnings after buyer protection expires
 * This should be called periodically (e.g., daily cron job)
 * Note: We fetch all delivered orders and filter client-side since Firestore
 * doesn't support queries on optional fields efficiently
 */
export const releaseExpiredEarnings = async (): Promise<number> => {
    const now = Date.now();
    const ordersRef = collection(db, "orders");
    
    // Get all delivered orders (we'll filter client-side)
    const deliveredOrdersQuery = query(
        ordersRef,
        where("status", "==", "delivered")
    );
    
    const deliveredOrdersSnapshot = await getDocs(deliveredOrdersQuery);
    let released = 0;
    
    for (const orderDoc of deliveredOrdersSnapshot.docs) {
        const order = orderDoc.data() as Order;
        
        // Check if buyer protection has expired and earnings are still pending
        if (
            order.buyerProtectionEndsAt && 
            order.buyerProtectionEndsAt < now &&
            (order.earningsStatus === 'pending' || !order.earningsStatus)
        ) {
            await updateDoc(doc(db, "orders", orderDoc.id), {
                earningsStatus: 'available',
                buyerProtectionStatus: 'expired',
                updatedAt: Date.now(),
            });
            released++;
        }
    }
    
    return released;
};

/**
 * Get seller's earnings breakdown
 */
export const getSellerEarnings = async (sellerId: string) => {
    const ordersRef = collection(db, "orders");
    const sellerOrdersQuery = query(
        ordersRef,
        where("sellerId", "==", sellerId),
        where("status", "in", ["paid", "shipped", "delivered"])
    );
    
    const ordersSnapshot = await getDocs(sellerOrdersQuery);
    const orders: Order[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Order));
    
    return {
        orders,
        balance: await calculateSellerBalance(sellerId),
    };
};

