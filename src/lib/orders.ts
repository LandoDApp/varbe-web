import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { Order } from "@/types";
import { calculateFees } from "./fees";
import { calculateShippingDeadline } from "./shipping";
import { notifyNewOrder } from "./notifications";
import { getListing } from "./listings";

export const createOrder = async (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
    // Calculate fees (salePrice is the artwork price excluding shipping)
    // If salePrice is provided, use it; otherwise calculate from amount
    const salePrice = order.salePrice !== undefined 
        ? order.salePrice 
        : order.amount - (order.shippingCost || 0);
    const feeBreakdown = calculateFees(salePrice);
    
    // Remove undefined values (Firestore doesn't accept undefined)
    const cleanOrderData: any = {
        listingId: order.listingId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        amount: order.amount, // Total amount buyer pays (including shipping)
        salePrice: salePrice, // Artwork price (excluding shipping)
        varbeFee: feeBreakdown.varbeFee,
        stripeFee: feeBreakdown.stripeFee,
        artistEarnings: feeBreakdown.artistEarnings,
        status: 'pending' as const,
        earningsStatus: 'pending' as const, // Will become 'available' after buyer protection expires
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    
    // Only add optional fields if they are defined
    if (order.quantity !== undefined && order.quantity !== null) {
        cleanOrderData.quantity = order.quantity;
    }
    
    if (order.shippingCost !== undefined && order.shippingCost !== null) {
        cleanOrderData.shippingCost = order.shippingCost;
    }
    
    if (order.shippingAddress) {
        cleanOrderData.shippingAddress = order.shippingAddress;
    }
    
    if (order.shippingType) {
        cleanOrderData.shippingType = order.shippingType;
    }
    
    if (order.stripePaymentIntentId !== undefined && order.stripePaymentIntentId !== null) {
        cleanOrderData.stripePaymentIntentId = order.stripePaymentIntentId;
    }
    
    // Set shipping deadline (5 business days from now, will be updated when payment is confirmed)
    // For now, set it based on createdAt (will be updated to paidAt when payment is confirmed)
    cleanOrderData.shippingDeadline = calculateShippingDeadline(Date.now());
    
    const docRef = await addDoc(collection(db, "orders"), cleanOrderData);
    const orderId = docRef.id;
    
    // Create notification for seller/artist about new order
    try {
        const artwork = await getListing(order.listingId);
        if (artwork) {
            await notifyNewOrder(
                orderId,
                order.sellerId,
                order.listingId,
                artwork.title || "Artwork",
                order.quantity || 1,
                false // Pickup is no longer supported
            );
        }
    } catch (notifError) {
        console.error("Error creating new order notification:", notifError);
        // Don't fail order creation if notification fails
    }
    
    return orderId;
};

export const getUserOrders = async (userId: string) => {
    const q = query(
        collection(db, "orders"),
        where("buyerId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getUserSales = async (sellerId: string) => {
    // Only return orders that are paid, shipped, or delivered (actual sales)
    // Orders with status 'pending' or 'cancelled' are not considered sales
    try {
        const q = query(
            collection(db, "orders"),
            where("sellerId", "==", sellerId),
            where("status", "in", ["paid", "shipped", "delivered"]),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error: any) {
        // Fallback: If Firestore index is missing, filter client-side
        if (error?.code === 'failed-precondition') {
            console.warn("Firestore index missing for getUserSales, using fallback");
            const q = query(
                collection(db, "orders"),
                where("sellerId", "==", sellerId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            // Filter client-side to only include paid, shipped, or delivered orders
            return allOrders.filter(order => 
                order.status === 'paid' || 
                order.status === 'shipped' || 
                order.status === 'delivered'
            );
        }
        throw error;
    }
};

