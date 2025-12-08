import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { SavedAddress } from "@/types";

/**
 * Save an address for a user
 */
export const saveAddress = async (
    userId: string,
    address: Omit<SavedAddress, "id" | "userId" | "createdAt">
): Promise<string> => {
    // If this is set as default, unset other defaults
    if (address.isDefault) {
        const existingQuery = query(
            collection(db, "savedAddresses"),
            where("userId", "==", userId),
            where("isDefault", "==", true)
        );
        const existing = await getDocs(existingQuery);
        
        for (const docSnap of existing.docs) {
            await updateDoc(docSnap.ref, { isDefault: false });
        }
    }

    const addressData: Omit<SavedAddress, "id"> = {
        ...address,
        userId,
        createdAt: Date.now(),
    };

    const addressRef = await addDoc(collection(db, "savedAddresses"), addressData);
    return addressRef.id;
};

/**
 * Get all saved addresses for a user
 */
export const getUserAddresses = async (userId: string): Promise<SavedAddress[]> => {
    const addressesRef = collection(db, "savedAddresses");
    const q = query(
        addressesRef,
        where("userId", "==", userId),
        orderBy("isDefault", "desc"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as SavedAddress));
};

/**
 * Get default address for a user
 */
export const getDefaultAddress = async (userId: string): Promise<SavedAddress | null> => {
    const addressesRef = collection(db, "savedAddresses");
    const q = query(
        addressesRef,
        where("userId", "==", userId),
        where("isDefault", "==", true),
        limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }

    return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    } as SavedAddress;
};

/**
 * Update an address
 */
export const updateAddress = async (
    addressId: string,
    userId: string,
    updates: Partial<Omit<SavedAddress, "id" | "userId" | "createdAt">>
): Promise<void> => {
    const addressRef = doc(db, "savedAddresses", addressId);
    const addressSnap = await getDoc(addressRef);

    if (!addressSnap.exists()) {
        throw new Error("Address not found");
    }

    const address = addressSnap.data() as SavedAddress;
    if (address.userId !== userId) {
        throw new Error("Unauthorized");
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
        const existingQuery = query(
            collection(db, "savedAddresses"),
            where("userId", "==", userId),
            where("isDefault", "==", true)
        );
        const existing = await getDocs(existingQuery);
        
        for (const docSnap of existing.docs) {
            if (docSnap.id !== addressId) {
                await updateDoc(docSnap.ref, { isDefault: false });
            }
        }
    }

    await updateDoc(addressRef, updates);
};

/**
 * Delete an address
 */
export const deleteAddress = async (
    addressId: string,
    userId: string
): Promise<void> => {
    const addressRef = doc(db, "savedAddresses", addressId);
    const addressSnap = await getDoc(addressRef);

    if (!addressSnap.exists()) {
        throw new Error("Address not found");
    }

    const address = addressSnap.data() as SavedAddress;
    if (address.userId !== userId) {
        throw new Error("Unauthorized");
    }

    await deleteDoc(addressRef);
};


