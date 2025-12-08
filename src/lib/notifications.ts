import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { Notification } from "@/types";
import { formatPrice } from "./utils";

/**
 * Create a notification for a user
 */
export const createNotification = async (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    orderId?: string,
    listingId?: string,
    link?: string
): Promise<string> => {
    const notificationData = {
        userId,
        type,
        title,
        message,
        orderId: orderId || null,
        listingId: listingId || null,
        read: false,
        createdAt: Date.now(),
        link: link || null,
    };
    
    // Remove null values
    Object.keys(notificationData).forEach(key => {
        if (notificationData[key as keyof typeof notificationData] === null) {
            delete notificationData[key as keyof typeof notificationData];
        }
    });
    
    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    return docRef.id;
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef,
        where("userId", "==", userId),
        where("read", "==", false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
};

/**
 * Mark notification as read
 * Prevents marking the latest new_order notification as read to keep it visible
 */
export const markNotificationAsRead = async (notificationId: string, userId?: string): Promise<void> => {
    // If userId is provided, check if this is the latest sale notification
    if (userId) {
        const latestSale = await getLatestSaleNotification(userId);
        if (latestSale && latestSale.id === notificationId) {
            // Don't mark the latest sale notification as read
            console.log("Skipping mark as read for latest sale notification");
            return;
        }
    }
    
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
        read: true,
    });
};

/**
 * Get the latest new_order notification for a user
 */
const getLatestSaleNotification = async (userId: string): Promise<Notification | null> => {
    try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
            notificationsRef,
            where("userId", "==", userId),
            where("type", "==", "new_order"),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Notification;
    } catch (error: any) {
        // If index doesn't exist, try without orderBy (fallback)
        if (error?.code === 'failed-precondition') {
            // Extract the index creation URL from the error message
            const errorMessage = error.message || '';
            const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
            const indexUrl = urlMatch ? urlMatch[0] : null;
            
            if (indexUrl) {
                console.warn("❌ Firestore Index Required!");
                console.warn("📋 Index URL:", indexUrl);
                console.warn("🔗 Click this link to create the required index:");
                console.warn(indexUrl);
            } else {
                console.warn("❌ Firestore Index Required!");
                console.warn("📋 Please create a composite index for:");
                console.warn("   Collection: notifications");
                console.warn("   Fields: userId (Ascending), type (Ascending), createdAt (Descending)");
                console.warn("🔗 Go to: https://console.firebase.google.com/project/varbe-e96d2/firestore/indexes");
            }
            
            try {
                console.warn("Using fallback (without orderBy)...");
                const notificationsRef = collection(db, "notifications");
                const q = query(
                    notificationsRef,
                    where("userId", "==", userId),
                    where("type", "==", "new_order")
                );
                
                const snapshot = await getDocs(q);
                if (snapshot.empty) return null;
                
                // Sort client-side
                const notifications = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                } as Notification));
                
                notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                return notifications[0] || null;
            } catch (fallbackError) {
                console.error("Error fetching latest sale notification (fallback):", fallbackError);
                return null;
            }
        }
        console.error("Error fetching latest sale notification:", error);
        return null;
    }
};

/**
 * Mark all notifications as read for a user
 * Excludes the latest new_order notification to keep it visible
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    // Get the latest sale notification first
    const latestSale = await getLatestSaleNotification(userId);
    
    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef,
        where("userId", "==", userId),
        where("read", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const updates = snapshot.docs
        .filter(doc => {
            // Don't mark the latest sale notification as read
            if (latestSale && doc.id === latestSale.id) {
                return false;
            }
            return true;
        })
        .map(doc => 
            updateDoc(doc.ref, { read: true })
        );
    
    await Promise.all(updates);
};

/**
 * Set up real-time listener for notifications
 * Requires Firestore composite index for userId + createdAt
 * Always includes the latest new_order notification even if it's read
 */
export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void,
    limitCount: number = 20
): (() => void) => {
    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    return onSnapshot(
        q,
        async (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as Notification));
            
            // Always include the latest sale notification, even if it's read and not in the main list
            const latestSale = await getLatestSaleNotification(userId);
            if (latestSale) {
                // Check if it's already in the notifications list
                const alreadyIncluded = notifications.some(n => n.id === latestSale.id);
                if (!alreadyIncluded) {
                    // Add it to the beginning of the list
                    notifications.unshift(latestSale);
                } else {
                    // If it's already in the list, make sure it's at the top
                    const index = notifications.findIndex(n => n.id === latestSale.id);
                    if (index > 0) {
                        notifications.splice(index, 1);
                        notifications.unshift(latestSale);
                    }
                }
            }
            
            callback(notifications);
        },
        (error: any) => {
            console.error("Error in notifications query:", error);
            if (error.code === 'failed-precondition') {
                // Firestore automatically includes the index creation link in the error message
                console.error("❌ Firestore Index Required!");
                console.error("The error message above contains a link to create the required index.");
                console.error("Click the link in the error message to create the index automatically.");
                if (error.message) {
                    console.error("Error details:", error.message);
                }
            }
            callback([]);
        }
    );
};

/**
 * Create notification when order is paid (for buyer)
 */
export const notifyPurchaseSuccess = async (orderId: string, buyerId: string, listingId: string, artworkTitle: string): Promise<void> => {
    await createNotification(
        buyerId,
        'purchase_success',
        '🎉 Kauf erfolgreich!',
        `Du hast "${artworkTitle}" erfolgreich gekauft.`,
        orderId,
        listingId,
        `/orders/${orderId}`
    );
};

/**
 * Create notification when tracking is submitted (for buyer)
 */
export const notifyTrackingSubmitted = async (orderId: string, buyerId: string): Promise<void> => {
    await createNotification(
        buyerId,
        'tracking_submitted',
        '📦 Tracking-Nummer eingereicht',
        'Der Verkäufer hat eine Tracking-Nummer eingereicht. Sie wird gerade geprüft.',
        orderId,
        undefined,
        `/orders/${orderId}`
    );
};

/**
 * Create notification when tracking is approved (for buyer)
 */
export const notifyTrackingApproved = async (orderId: string, buyerId: string, trackingNumber: string): Promise<void> => {
    await createNotification(
        buyerId,
        'tracking_approved',
        '✅ Tracking-Nummer verfügbar!',
        `Deine Bestellung wurde versandt. Tracking-Nummer: ${trackingNumber}`,
        orderId,
        undefined,
        `/orders/${orderId}`
    );
};

/**
 * Create notification when order is shipped (for buyer)
 */
export const notifyOrderShipped = async (orderId: string, buyerId: string, trackingNumber: string): Promise<void> => {
    await createNotification(
        buyerId,
        'order_shipped',
        '🚚 Bestellung versandt!',
        `Deine Bestellung wurde versandt. Tracking-Nummer: ${trackingNumber}`,
        orderId,
        undefined,
        `/orders/${orderId}`
    );
};

/**
 * Create notification when order is delivered (for buyer)
 */
export const notifyOrderDelivered = async (orderId: string, buyerId: string, listingId: string): Promise<void> => {
    await createNotification(
        buyerId,
        'order_delivered',
        '📬 Bestellung zugestellt!',
        'Deine Bestellung wurde als zugestellt markiert. Der 14-Tage-Käuferschutz läuft jetzt.',
        orderId,
        listingId,
        `/orders/${orderId}`
    );
};

/**
 * Notify buyer to review the artist after delivery
 */
export const notifyPleaseReview = async (
    orderId: string,
    buyerId: string,
    artistId: string,
    listingId: string
): Promise<void> => {
    await createNotification(
        buyerId,
        'please_review',
        '⭐ Bitte bewerten!',
        'Deine Bestellung wurde zugestellt! Bitte nimm dir einen Moment Zeit, um den Künstler zu bewerten.',
        orderId,
        listingId,
        `/profile/${artistId}?review=true`
    );
};

/**
 * Create notification when a new order is created (for seller/artist)
 */
export const notifyNewOrder = async (
    orderId: string, 
    sellerId: string, 
    listingId: string, 
    artworkTitle: string, 
    quantity: number = 1,
    isPickup: boolean = false
): Promise<void> => {
    const quantityText = quantity > 1 ? ` (${quantity}x)` : '';
    const message = isPickup
        ? `Du hast eine neue Bestellung für "${artworkTitle}"${quantityText} erhalten. Der Käufer wird das Kunstwerk abholen.`
        : `Du hast eine neue Bestellung für "${artworkTitle}"${quantityText} erhalten. Bitte füge die Tracking-ID hinzu, sobald du versendest.`;
    
    await createNotification(
        sellerId,
        'new_order',
        '🛒 Neue Bestellung erhalten!',
        message,
        orderId,
        listingId,
        `/artist/orders`
    );
};

/**
 * Check if notification already exists for an order
 */
export const notificationExistsForOrder = async (userId: string, orderId: string): Promise<boolean> => {
    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef,
        where("userId", "==", userId),
        where("orderId", "==", orderId),
        where("type", "==", "new_order")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size > 0;
};

/**
 * Notify user that they are now the highest bidder
 */
export const notifyHighestBidder = async (
    userId: string,
    listingId: string,
    listingTitle: string,
    bidAmount: number
): Promise<void> => {
    await createNotification(
        userId,
        'highest_bidder',
        '🏆 Du bist jetzt Höchstbietender!',
        `Dein Gebot von €${formatPrice(bidAmount)} ist jetzt das höchste Gebot für "${listingTitle}".`,
        undefined,
        listingId,
        `/marketplace/${listingId}`
    );
};

/**
 * Notify user that they have been outbid
 */
export const notifyOutbid = async (
    userId: string,
    listingId: string,
    listingTitle: string,
    newHighestBid: number
): Promise<void> => {
    await createNotification(
        userId,
        'outbid',
        '⚠️ Du wurdest überboten',
        `Jemand hat ein höheres Gebot von €${formatPrice(newHighestBid)} für "${listingTitle}" abgegeben.`,
        undefined,
        listingId,
        `/marketplace/${listingId}`
    );
};

/**
 * Notify chatroom members about a new message
 * Only notifies members with notificationsEnabled=true and who are not currently online
 */
export const notifyChatroomMessage = async (
    roomId: string,
    roomName: string,
    senderId: string,
    senderName: string,
    messagePreview: string
): Promise<number> => {
    try {
        // Get all members of this chatroom who have notifications enabled
        const { collection: col, query: q, where: w, getDocs: gd } = await import("firebase/firestore");
        const { db: database } = await import("./firebase");
        
        const membersQuery = q(
            col(database, "chatroom_members"),
            w("roomId", "==", roomId),
            w("notificationsEnabled", "==", true)
        );
        
        const membersSnapshot = await gd(membersQuery);
        let notified = 0;
        
        for (const memberDoc of membersSnapshot.docs) {
            const member = memberDoc.data();
            
            // Don't notify the sender or online users
            if (member.userId === senderId || member.isOnline) {
                continue;
            }
            
            // Create notification for this member
            const notificationData = {
                userId: member.userId,
                type: 'chatroom_message',
                title: `💬 ${roomName}`,
                message: `${senderName}: ${messagePreview.slice(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
                chatroomId: roomId,
                read: false,
                createdAt: Date.now(),
                link: `/chatrooms/${roomId}`,
            };
            
            await addDoc(collection(db, "notifications"), notificationData);
            notified++;
        }
        
        return notified;
    } catch (error) {
        console.error("Error notifying chatroom members:", error);
        return 0;
    }
};

/**
 * Create missing notifications for orders that need tracking
 * This ensures that artists get notified about orders that need tracking, even if they were created before the notification system
 */
export const createMissingOrderNotifications = async (userId: string): Promise<number> => {
    try {
        const { getUserSales } = await import("./orders");
        const { getListing } = await import("./listings");
        
        const sales = await getUserSales(userId);
        let created = 0;
        
        // Find paid orders without tracking that don't have notifications yet
        for (const order of sales) {
            // Only create notification for paid orders that need tracking
            if (order.status === 'paid' && 
                !order.trackingNumber) {
                
                // Check if notification already exists
                const exists = await notificationExistsForOrder(userId, order.id);
                
                if (!exists) {
                    try {
                        const artwork = await getListing(order.listingId);
                        if (artwork) {
                            await notifyNewOrder(
                                order.id,
                                userId,
                                order.listingId,
                                artwork.title || "Artwork",
                                order.quantity || 1,
                                false // Pickup is no longer supported
                            );
                            created++;
                        }
                    } catch (error) {
                        console.error(`Error creating notification for order ${order.id}:`, error);
                    }
                }
            }
        }
        
        return created;
    } catch (error) {
        console.error("Error creating missing order notifications:", error);
        return 0;
    }
};

