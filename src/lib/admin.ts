import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";

/**
 * Delete all orders (Admin only)
 * WARNING: This is a destructive operation!
 */
export const deleteAllOrders = async (): Promise<number> => {
    const ordersRef = collection(db, "orders");
    const ordersSnapshot = await getDocs(ordersRef);
    
    let deleted = 0;
    const batchSize = 500; // Firestore batch limit
    
    // Process in batches
    const orders = ordersSnapshot.docs;
    for (let i = 0; i < orders.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchOrders = orders.slice(i, i + batchSize);
        
        batchOrders.forEach((orderDoc) => {
            batch.delete(orderDoc.ref);
        });
        
        await batch.commit();
        deleted += batchOrders.length;
    }
    
    return deleted;
};

/**
 * Delete all seller balances (Revenue) (Admin only)
 * WARNING: This is a destructive operation!
 */
export const deleteAllSellerBalances = async (): Promise<number> => {
    const balancesRef = collection(db, "sellerBalances");
    const balancesSnapshot = await getDocs(balancesRef);
    
    let deleted = 0;
    const batchSize = 500; // Firestore batch limit
    
    // Process in batches
    const balances = balancesSnapshot.docs;
    for (let i = 0; i < balances.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchBalances = balances.slice(i, i + batchSize);
        
        batchBalances.forEach((balanceDoc) => {
            batch.delete(balanceDoc.ref);
        });
        
        await batch.commit();
        deleted += batchBalances.length;
    }
    
    return deleted;
};

/**
 * Delete all notifications (Admin only)
 * WARNING: This is a destructive operation!
 */
export const deleteAllNotifications = async (): Promise<number> => {
    const notificationsRef = collection(db, "notifications");
    const notificationsSnapshot = await getDocs(notificationsRef);
    
    let deleted = 0;
    const batchSize = 500; // Firestore batch limit
    
    // Process in batches
    const notifications = notificationsSnapshot.docs;
    for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchNotifications = notifications.slice(i, i + batchSize);
        
        batchNotifications.forEach((notificationDoc) => {
            batch.delete(notificationDoc.ref);
        });
        
        await batch.commit();
        deleted += batchNotifications.length;
    }
    
    return deleted;
};





