import { db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { Order } from "@/types";
import { notifyTrackingSubmitted, notifyTrackingApproved } from "./notifications";

/**
 * Calculate shipping deadline (5 business days from payment)
 */
export const calculateShippingDeadline = (paidAt: number): number => {
    const BUSINESS_DAYS = 5;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    
    let daysAdded = 0;
    let currentDate = new Date(paidAt);
    let businessDaysCounted = 0;
    
    while (businessDaysCounted < BUSINESS_DAYS) {
        currentDate = new Date(currentDate.getTime() + MS_PER_DAY);
        const dayOfWeek = currentDate.getDay();
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDaysCounted++;
        }
        daysAdded++;
    }
    
    return currentDate.getTime();
};

/**
 * Check if shipping deadline has passed
 */
export const isShippingDeadlinePassed = (deadline: number): boolean => {
    return Date.now() > deadline;
};

/**
 * Get days until shipping deadline
 */
export const getDaysUntilDeadline = (deadline: number): number => {
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return 0;
    
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return days;
};

/**
 * Get business days since payment
 */
export const getBusinessDaysSincePayment = (paidAt: number): number => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let days = 0;
    let currentDate = new Date(paidAt);
    const now = Date.now();
    
    while (currentDate.getTime() < now) {
        currentDate = new Date(currentDate.getTime() + MS_PER_DAY);
        const dayOfWeek = currentDate.getDay();
        
        // Count only business days
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days++;
        }
    }
    
    return days;
};

/**
 * Add shipping tracking to order (validates with AfterShip)
 */
export const addShippingTracking = async (
    orderId: string,
    trackingNumber: string,
    shippingProvider: string
): Promise<void> => {
    // Use AfterShip API to validate tracking number
    const response = await fetch('/api/aftership/add-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderId,
            trackingNumber,
            shippingProvider,
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add tracking');
    }
    
    const data = await response.json();
    
    // Notify buyer that tracking was added
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        try {
            await notifyTrackingApproved(orderId, order.buyerId, trackingNumber);
        } catch (notifError) {
            console.error("Error creating tracking approved notification:", notifError);
        }
    }
    
    return data;
};

/**
 * Approve tracking number (admin only)
 */
export const approveTracking = async (
    orderId: string,
    adminId: string
): Promise<void> => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }
    
    const order = orderSnap.data() as Order;
    
    if (!order.trackingNumber) {
        throw new Error("No tracking number to approve");
    }
    
    const trackingApprovedAt = Date.now();
    const shippedAt = trackingApprovedAt;
    
    await updateDoc(orderRef, {
        trackingStatus: 'approved',
        trackingApprovedAt,
        trackingApprovedBy: adminId,
        shippedAt,
        status: 'shipped', // Update order status to shipped
        updatedAt: Date.now(),
    });
    
    // Notify buyer that tracking is approved
    try {
        await notifyTrackingApproved(orderId, order.buyerId, order.trackingNumber);
    } catch (notifError) {
        console.error("Error creating tracking approved notification:", notifError);
    }
};

/**
 * Reject tracking number (admin only)
 */
export const rejectTracking = async (
    orderId: string,
    adminId: string,
    reason: string
): Promise<void> => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }
    
    await updateDoc(orderRef, {
        trackingStatus: 'rejected',
        trackingRejectionReason: reason,
        updatedAt: Date.now(),
    });
};

/**
 * Get orders with pending tracking (for admin)
 */
export const getPendingTrackingOrders = async (): Promise<Order[]> => {
    const ordersRef = collection(db, "orders");
    const pendingTrackingQuery = query(
        ordersRef,
        where("trackingStatus", "==", "pending")
    );
    
    const snapshot = await getDocs(pendingTrackingQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

/**
 * Mark order as picked up (for Selbstabholung)
 */
export const markOrderAsPickedUp = async (orderId: string): Promise<void> => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }
    
    const order = orderSnap.data() as Order;
    
    if (order.shippingType !== 'pickup') {
        throw new Error("Order is not a pickup order");
    }
    
    if (order.status !== 'paid') {
        throw new Error("Order must be paid before marking as picked up");
    }
    
    const pickupCompletedAt = Date.now();
    const buyerProtectionEndsAt = pickupCompletedAt + (14 * 24 * 60 * 60 * 1000); // 14 days
    
    await updateDoc(orderRef, {
        status: 'delivered',
        pickupCompletedAt,
        deliveredAt: pickupCompletedAt,
        buyerProtectionEndsAt,
        buyerProtectionStatus: 'active',
        earningsStatus: 'pending',
        updatedAt: Date.now(),
    });
};

/**
 * Check orders that need shipping reminders/warnings/cancellation
 * This should be run daily (e.g., via cron job)
 */
export const checkShippingDeadlines = async (): Promise<{
    reminders: number;
    warnings: number;
    cancellations: number;
}> => {
    const ordersRef = collection(db, "orders");
    const paidOrdersQuery = query(
        ordersRef,
        where("status", "==", "paid")
    );
    
    const paidOrdersSnapshot = await getDocs(paidOrdersQuery);
    const now = Date.now();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    
    let reminders = 0;
    let warnings = 0;
    let cancellations = 0;
    
    for (const orderDoc of paidOrdersSnapshot.docs) {
        const order = orderDoc.data() as Order;
        
        // Calculate business days since payment
        // Use paidAt if available, otherwise fall back to createdAt (for old orders)
        const paymentTimestamp = order.paidAt || order.createdAt;
        const businessDaysSincePayment = getBusinessDaysSincePayment(paymentTimestamp);
        
        // Day 3: Send reminder
        if (businessDaysSincePayment >= 3 && !order.shippingReminderSent) {
            // TODO: Send email/notification
            await updateDoc(doc(db, "orders", orderDoc.id), {
                shippingReminderSent: true,
                updatedAt: now,
            });
            reminders++;
        }
        
        // Day 5: Send warning
        if (businessDaysSincePayment >= 5 && !order.shippingWarningSent) {
            // TODO: Send email/notification
            await updateDoc(doc(db, "orders", orderDoc.id), {
                shippingWarningSent: true,
                updatedAt: now,
            });
            warnings++;
        }
        
        // Day 6: Auto-cancel
        if (businessDaysSincePayment >= 6 && !order.autoCancelledAt) {
            await cancelOrderForLateShipping(orderDoc.id);
            cancellations++;
        }
    }
    
    return { reminders, warnings, cancellations };
};

/**
 * Cancel order due to late shipping (day 6)
 */
export const cancelOrderForLateShipping = async (orderId: string): Promise<void> => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }
    
    const order = orderSnap.data() as Order;
    
    // Mark order as cancelled
    await updateDoc(orderRef, {
        status: 'cancelled',
        autoCancelledAt: Date.now(),
        updatedAt: Date.now(),
    });
    
    // TODO: Process refund via Stripe
    // For now, we just mark it as cancelled
    // In production, you would:
    // 1. Create Stripe refund
    // 2. Update order with refund ID
    // 3. Mark listing as available again
    
    // Mark listing as available again
    if (order.listingId) {
        const listingRef = doc(db, "artworks", order.listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
            const listingData = listingSnap.data();
            await updateDoc(listingRef, {
                status: listingData.listingType === 'auction' ? 'ended' : 'available',
                updatedAt: Date.now(),
            });
        }
    }
    
    // TODO: Send notification to seller about account warning
    // TODO: Track cancellation count for seller
};

/**
 * Delete orders that have been pending for a week and are not paid
 * This should be run daily (e.g., via cron job)
 */
export const deleteOldPendingOrders = async (): Promise<number> => {
    const ordersRef = collection(db, "orders");
    const pendingOrdersQuery = query(
        ordersRef,
        where("status", "==", "pending")
    );
    
    const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);
    const now = Date.now();
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    const ordersToDelete: string[] = [];
    
    for (const orderDoc of pendingOrdersSnapshot.docs) {
        const order = orderDoc.data() as Order;
        
        // Check if order is pending and older than 1 week (and not paid)
        const orderAge = now - order.createdAt;
        if (orderAge >= ONE_WEEK_MS && order.status === 'pending') {
            ordersToDelete.push(orderDoc.id);
        }
    }
    
    // Delete orders in batches (Firestore batch limit is 500)
    const batchSize = 500;
    let deleted = 0;
    
    for (let i = 0; i < ordersToDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchOrders = ordersToDelete.slice(i, i + batchSize);
        
        batchOrders.forEach((orderId) => {
            const orderRef = doc(db, "orders", orderId);
            batch.delete(orderRef);
        });
        
        await batch.commit();
        deleted += batchOrders.length;
    }
    
    return deleted;
};

