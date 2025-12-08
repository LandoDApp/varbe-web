import { db } from "./firebase";
import { collection, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { storage } from "./firebase";
import { ref, deleteObject, listAll } from "firebase/storage";
import { UserProfile, Order, Artwork, Conversation, Message, SavedAddress } from "@/types";

/**
 * Export all user data (DSGVO Art. 15)
 */
export const exportUserData = async (userId: string): Promise<{
    profile: UserProfile | null;
    orders: Order[];
    artworks: Artwork[];
    conversations: Conversation[];
    messages: Message[];
    addresses: SavedAddress[];
}> => {
    try {
        // Get user profile
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const profile = userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } as UserProfile : null;

        // Get orders
        const ordersRef = collection(db, "orders");
        const ordersQuery = query(ordersRef, where("buyerId", "==", userId));
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

        // Get seller orders
        const sellerOrdersQuery = query(ordersRef, where("sellerId", "==", userId));
        const sellerOrdersSnapshot = await getDocs(sellerOrdersQuery);
        const sellerOrders = sellerOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        // Combine and deduplicate
        const allOrders = [...orders, ...sellerOrders];
        const uniqueOrders = allOrders.filter((order, index, self) =>
            index === self.findIndex(o => o.id === order.id)
        );

        // Get artworks
        const artworksRef = collection(db, "artworks");
        const artworksQuery = query(artworksRef, where("artistId", "==", userId));
        const artworksSnapshot = await getDocs(artworksQuery);
        const artworks = artworksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));

        // Get conversations
        const conversationsRef = collection(db, "conversations");
        const conversationsQuery = query(conversationsRef, where("participants", "array-contains", userId));
        const conversationsSnapshot = await getDocs(conversationsQuery);
        const conversations = conversationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));

        // Get messages
        const messagesRef = collection(db, "messages");
        const messagesQuery = query(messagesRef, where("senderId", "==", userId));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));

        // Get saved addresses
        const addressesRef = collection(db, "savedAddresses");
        const addressesQuery = query(addressesRef, where("userId", "==", userId));
        const addressesSnapshot = await getDocs(addressesQuery);
        const addresses = addressesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedAddress));

        return {
            profile,
            orders: uniqueOrders,
            artworks,
            conversations,
            messages,
            addresses
        };
    } catch (error) {
        console.error("Error exporting user data:", error);
        throw error;
    }
};

/**
 * Delete all user data (DSGVO Art. 17 - Right to erasure)
 */
export const deleteUserData = async (userId: string): Promise<void> => {
    try {
        // Delete user profile
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);

        // Delete artworks (but keep orders for legal reasons)
        const artworksRef = collection(db, "artworks");
        const artworksQuery = query(artworksRef, where("artistId", "==", userId));
        const artworksSnapshot = await getDocs(artworksQuery);
        for (const artworkDoc of artworksSnapshot.docs) {
            // Delete artwork images from storage
            const imagesRef = ref(storage, `artworks/${userId}/${artworkDoc.id}`);
            try {
                const imagesList = await listAll(imagesRef);
                for (const imageRef of imagesList.items) {
                    await deleteObject(imageRef);
                }
            } catch (error) {
                console.error(`Error deleting artwork images for ${artworkDoc.id}:`, error);
            }
            await deleteDoc(artworkDoc.ref);
        }

        // Delete conversations and messages
        const conversationsRef = collection(db, "conversations");
        const conversationsQuery = query(conversationsRef, where("participants", "array-contains", userId));
        const conversationsSnapshot = await getDocs(conversationsQuery);
        for (const convDoc of conversationsSnapshot.docs) {
            // Delete messages in conversation
            const messagesRef = collection(db, "messages");
            const messagesQuery = query(messagesRef, where("conversationId", "==", convDoc.id));
            const messagesSnapshot = await getDocs(messagesQuery);
            for (const msgDoc of messagesSnapshot.docs) {
                await deleteDoc(msgDoc.ref);
            }
            await deleteDoc(convDoc.ref);
        }

        // Delete saved addresses
        const addressesRef = collection(db, "savedAddresses");
        const addressesQuery = query(addressesRef, where("userId", "==", userId));
        const addressesSnapshot = await getDocs(addressesQuery);
        for (const addrDoc of addressesSnapshot.docs) {
            await deleteDoc(addrDoc.ref);
        }

        // Delete profile picture
        try {
            const profilePicRef = ref(storage, `profile-pictures/${userId}`);
            const profilePicList = await listAll(profilePicRef);
            for (const picRef of profilePicList.items) {
                await deleteObject(picRef);
            }
        } catch (error) {
            console.error("Error deleting profile picture:", error);
        }

        // Note: Orders are kept for legal/tax reasons but can be anonymized
        // Reviews are kept but can be anonymized
    } catch (error) {
        console.error("Error deleting user data:", error);
        throw error;
    }
};

/**
 * Anonymize user data in orders (for legal compliance)
 */
export const anonymizeOrders = async (userId: string): Promise<void> => {
    try {
        const ordersRef = collection(db, "orders");
        
        // Buyer orders
        const buyerQuery = query(ordersRef, where("buyerId", "==", userId));
        const buyerSnapshot = await getDocs(buyerQuery);
        for (const orderDoc of buyerSnapshot.docs) {
            await updateDoc(orderDoc.ref, {
                buyerId: "deleted_user",
                shippingAddress: null,
            });
        }

        // Seller orders
        const sellerQuery = query(ordersRef, where("sellerId", "==", userId));
        const sellerSnapshot = await getDocs(sellerQuery);
        for (const orderDoc of sellerSnapshot.docs) {
            await updateDoc(orderDoc.ref, {
                sellerId: "deleted_user",
            });
        }
    } catch (error) {
        console.error("Error anonymizing orders:", error);
        throw error;
    }
};


