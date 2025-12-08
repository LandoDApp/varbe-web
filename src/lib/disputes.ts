import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
import { Dispute, Order } from "@/types";
import { createNotification } from "./notifications";

/**
 * Create a dispute for an order
 */
export const createDispute = async (
    orderId: string,
    buyerId: string,
    reason: string,
    description: string,
    images?: string[]
): Promise<string> => {
    // Get order to verify buyer and get seller ID
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }

    const order = orderSnap.data() as Order;
    
    if (order.buyerId !== buyerId) {
        throw new Error("Unauthorized: You can only create disputes for your own orders");
    }

    // Check if dispute already exists
    const existingDisputesQuery = query(
        collection(db, "disputes"),
        where("orderId", "==", orderId),
        where("status", "in", ["open", "under_review"])
    );
    const existingDisputes = await getDocs(existingDisputesQuery);
    
    if (!existingDisputes.empty) {
        throw new Error("A dispute for this order already exists");
    }

    // Create dispute
    const disputeData: Omit<Dispute, "id"> = {
        orderId,
        buyerId,
        artistId: order.sellerId,
        reason,
        description,
        images: images || [],
        status: 'open',
        createdAt: Date.now(),
    };

    const disputeRef = await addDoc(collection(db, "disputes"), disputeData);
    const disputeId = disputeRef.id;

    // Update order status
    await updateDoc(orderRef, {
        disputeStatus: 'disputed',
        buyerProtectionStatus: 'disputed',
        updatedAt: Date.now(),
    });

    // Notify artist about dispute
    try {
        await createNotification(
            order.sellerId,
            'dispute_opened',
            '⚠️ Neue Beschwerde erhalten',
            `Ein Käufer hat eine Beschwerde für Bestellung #${orderId.slice(0, 8)} eingereicht. Grund: ${reason}`,
            orderId,
            order.listingId,
            `/artist/orders`
        );
    } catch (error) {
        console.error("Error creating dispute notification:", error);
    }

    return disputeId;
};

/**
 * Get disputes for a user (buyer or artist)
 */
export const getUserDisputes = async (userId: string): Promise<Dispute[]> => {
    const disputesRef = collection(db, "disputes");
    const q = query(
        disputesRef,
        where("buyerId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const buyerDisputes = await getDocs(q);
    const buyerDisputesList = buyerDisputes.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Dispute));

    // Also get disputes where user is the artist
    const artistDisputesQuery = query(
        disputesRef,
        where("artistId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const artistDisputes = await getDocs(artistDisputesQuery);
    const artistDisputesList = artistDisputes.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Dispute));

    // Combine and deduplicate
    const allDisputes = [...buyerDisputesList, ...artistDisputesList];
    const uniqueDisputes = allDisputes.filter((dispute, index, self) =>
        index === self.findIndex(d => d.id === dispute.id)
    );

    return uniqueDisputes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

/**
 * Get all disputes (admin only)
 */
export const getAllDisputes = async (status?: Dispute['status']): Promise<Dispute[]> => {
    let q;
    if (status) {
        q = query(
            collection(db, "disputes"),
            where("status", "==", status),
            orderBy("createdAt", "desc")
        );
    } else {
        q = query(
            collection(db, "disputes"),
            orderBy("createdAt", "desc")
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Dispute));
};

/**
 * Artist responds to dispute
 */
export const respondToDispute = async (
    disputeId: string,
    artistId: string,
    response: string,
    evidenceImages?: string[]
): Promise<void> => {
    const disputeRef = doc(db, "disputes", disputeId);
    const disputeSnap = await getDoc(disputeRef);

    if (!disputeSnap.exists()) {
        throw new Error("Dispute not found");
    }

    const dispute = disputeSnap.data() as Dispute;

    if (dispute.artistId !== artistId) {
        throw new Error("Unauthorized: You can only respond to disputes for your own orders");
    }

    await updateDoc(disputeRef, {
        artistResponse: response,
        artistEvidenceImages: evidenceImages || [],
        status: 'under_review',
        updatedAt: Date.now(),
    });

    // Notify buyer
    try {
        await createNotification(
            dispute.buyerId,
            'dispute_response',
            '📝 Antwort auf Beschwerde',
            `Der Künstler hat auf deine Beschwerde geantwortet.`,
            dispute.orderId,
            undefined,
            `/orders/${dispute.orderId}`
        );
    } catch (error) {
        console.error("Error creating dispute response notification:", error);
    }
};

/**
 * Admin resolves dispute
 */
export const resolveDispute = async (
    disputeId: string,
    adminId: string,
    decision: 'buyer_wins' | 'artist_wins' | 'partial_refund',
    refundPercentage?: number,
    adminNote?: string
): Promise<void> => {
    const disputeRef = doc(db, "disputes", disputeId);
    const disputeSnap = await getDoc(disputeRef);

    if (!disputeSnap.exists()) {
        throw new Error("Dispute not found");
    }

    const dispute = disputeSnap.data() as Dispute;

    // Get order
    const orderRef = doc(db, "orders", dispute.orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        throw new Error("Order not found");
    }

    const order = orderSnap.data() as Order;

    // Update dispute
    await updateDoc(disputeRef, {
        status: 'resolved',
        adminDecision: decision,
        adminNote: adminNote || null,
        refundPercentage: refundPercentage || null,
        resolvedAt: Date.now(),
        resolvedBy: adminId,
        updatedAt: Date.now(),
    });

    // Handle refund if buyer wins
    if (decision === 'buyer_wins' || decision === 'partial_refund') {
        const refundAmount = decision === 'buyer_wins' 
            ? order.amount 
            : order.amount * (refundPercentage || 0) / 100;

        // Update order
        await updateDoc(orderRef, {
            disputeStatus: 'resolved',
            refundAmount: refundAmount,
            refundedAt: Date.now(),
            buyerProtectionStatus: 'refunded',
            updatedAt: Date.now(),
        });

        // TODO: Process actual refund via Stripe
        // This would require Stripe refund API call
    } else {
        // Artist wins - release earnings
        await updateDoc(orderRef, {
            disputeStatus: 'resolved',
            buyerProtectionStatus: 'expired',
            earningsStatus: 'available',
            updatedAt: Date.now(),
        });
    }

    // Notify both parties
    try {
        await createNotification(
            dispute.buyerId,
            'dispute_resolved',
            '✅ Beschwerde entschieden',
            `Deine Beschwerde wurde entschieden: ${decision === 'buyer_wins' ? 'Du erhältst eine Rückerstattung' : decision === 'partial_refund' ? `Du erhältst ${refundPercentage}% Rückerstattung` : 'Die Beschwerde wurde abgelehnt'}`,
            dispute.orderId,
            undefined,
            `/orders/${dispute.orderId}`
        );

        await createNotification(
            dispute.artistId,
            'dispute_resolved',
            '✅ Beschwerde entschieden',
            `Die Beschwerde wurde entschieden: ${decision === 'buyer_wins' ? 'Rückerstattung wurde gewährt' : decision === 'partial_refund' ? `${refundPercentage}% Rückerstattung` : 'Du hast gewonnen'}`,
            dispute.orderId,
            undefined,
            `/artist/orders`
        );
    } catch (error) {
        console.error("Error creating dispute resolution notifications:", error);
    }
};



