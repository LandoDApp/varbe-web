/**
 * VARBE Commission System (Kommissionsbörse)
 * 
 * Reverse marketplace where buyers post requests and artists can apply.
 * Artists bid on commissions with their proposed price and timeline.
 */

import { db, storage } from "./firebase";
import { 
    collection, 
    addDoc, 
    getDoc, 
    getDocs, 
    doc, 
    query, 
    orderBy, 
    where, 
    updateDoc, 
    deleteDoc,
    limit,
    increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Commission, CommissionApplication, ArtCategory, Technique } from "@/types";

// ========================================
// COMMISSIONS
// ========================================

interface CreateCommissionData {
    buyerId: string;
    title: string;
    description: string;
    category: ArtCategory;
    technique?: Technique;
    dimensions?: {
        width: number;
        height: number;
        unit: 'cm' | 'inch';
    };
    budget: {
        min: number;
        max: number;
        currency: string;
    };
    deadline?: string;
    deadlineDate?: number;
    referenceImages?: string[];
}

export async function createCommission(data: CreateCommissionData): Promise<string> {
    // Build commission object, only including defined values (Firestore doesn't accept undefined)
    const commission: Record<string, any> = {
        buyerId: data.buyerId,
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        referenceImages: data.referenceImages || [],
        status: 'open',
        applicationsCount: 0,
        maxApplications: 10,
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };
    
    // Only add optional fields if they have values
    if (data.technique) commission.technique = data.technique;
    if (data.dimensions) commission.dimensions = data.dimensions;
    if (data.deadline) commission.deadline = data.deadline;
    if (data.deadlineDate) commission.deadlineDate = data.deadlineDate;
    
    const docRef = await addDoc(collection(db, "commissions"), commission);
    return docRef.id;
}

export async function getCommission(commissionId: string): Promise<Commission | null> {
    const docRef = doc(db, "commissions", commissionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Commission;
    }
    return null;
}

export async function updateCommission(commissionId: string, data: Partial<Commission>): Promise<void> {
    const docRef = doc(db, "commissions", commissionId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

// Get all open commissions (for artists to browse)
export async function getOpenCommissions(limitCount: number = 20): Promise<Commission[]> {
    const q = query(
        collection(db, "commissions"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
}

// Get commissions by category
export async function getCommissionsByCategory(category: ArtCategory, limitCount: number = 20): Promise<Commission[]> {
    const q = query(
        collection(db, "commissions"),
        where("status", "==", "open"),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
}

// Get commissions created by a buyer
export async function getBuyerCommissions(buyerId: string): Promise<Commission[]> {
    const q = query(
        collection(db, "commissions"),
        where("buyerId", "==", buyerId),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
}

// Close/expire a commission
export async function closeCommission(commissionId: string, reason: 'cancelled' | 'expired' = 'cancelled'): Promise<void> {
    await updateCommission(commissionId, { status: reason });
}

// Select an artist for a commission
export async function selectArtist(
    commissionId: string, 
    artistId: string, 
    applicationId: string,
    agreedPrice: number,
    agreedDeadline?: number
): Promise<void> {
    await updateCommission(commissionId, {
        status: 'in_progress',
        selectedArtistId: artistId,
        selectedApplicationId: applicationId,
        agreedPrice,
        agreedDeadline,
    });
    
    // Update application status
    await updateApplication(applicationId, { status: 'accepted' });
    
    // Reject all other applications
    const applications = await getCommissionApplications(commissionId);
    for (const app of applications) {
        if (app.id !== applicationId) {
            await updateApplication(app.id, { status: 'rejected' });
        }
    }
}

// Mark commission as complete
export async function completeCommission(commissionId: string): Promise<void> {
    await updateCommission(commissionId, { status: 'completed' });
}

// ========================================
// APPLICATIONS
// ========================================

interface CreateApplicationData {
    commissionId: string;
    artistId: string;
    proposedPrice: number;
    proposedTimeline: string;
    message: string;
    portfolioLinks?: string[];
}

export async function createApplication(data: CreateApplicationData): Promise<string> {
    // Check if artist already applied
    const existingApp = await getArtistApplication(data.commissionId, data.artistId);
    if (existingApp) {
        throw new Error("Du hast dich bereits auf diesen Auftrag beworben.");
    }
    
    // Check if commission still accepts applications
    const commission = await getCommission(data.commissionId);
    if (!commission || commission.status !== 'open') {
        throw new Error("Dieser Auftrag ist nicht mehr offen für Bewerbungen.");
    }
    
    if (commission.applicationsCount >= (commission.maxApplications || 10)) {
        throw new Error("Maximale Anzahl an Bewerbungen erreicht.");
    }
    
    const application: Omit<CommissionApplication, 'id'> = {
        commissionId: data.commissionId,
        artistId: data.artistId,
        proposedPrice: data.proposedPrice,
        proposedTimeline: data.proposedTimeline,
        message: data.message,
        portfolioLinks: data.portfolioLinks || [],
        status: 'pending',
        createdAt: Date.now(),
    };
    
    const docRef = await addDoc(collection(db, "commission_applications"), application);
    
    // Increment application count
    const commissionRef = doc(db, "commissions", data.commissionId);
    await updateDoc(commissionRef, {
        applicationsCount: increment(1),
    });
    
    return docRef.id;
}

export async function getApplication(applicationId: string): Promise<CommissionApplication | null> {
    const docRef = doc(db, "commission_applications", applicationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CommissionApplication;
    }
    return null;
}

export async function updateApplication(applicationId: string, data: Partial<CommissionApplication>): Promise<void> {
    const docRef = doc(db, "commission_applications", applicationId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

// Get all applications for a commission
export async function getCommissionApplications(commissionId: string): Promise<CommissionApplication[]> {
    const q = query(
        collection(db, "commission_applications"),
        where("commissionId", "==", commissionId),
        orderBy("createdAt", "asc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommissionApplication));
}

// Get specific artist's application for a commission
export async function getArtistApplication(commissionId: string, artistId: string): Promise<CommissionApplication | null> {
    const q = query(
        collection(db, "commission_applications"),
        where("commissionId", "==", commissionId),
        where("artistId", "==", artistId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CommissionApplication;
}

// Get all applications by an artist
export async function getArtistApplications(artistId: string): Promise<CommissionApplication[]> {
    const q = query(
        collection(db, "commission_applications"),
        where("artistId", "==", artistId),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommissionApplication));
}

// Withdraw an application
export async function withdrawApplication(applicationId: string, commissionId: string): Promise<void> {
    await updateApplication(applicationId, { status: 'withdrawn' });
    
    // Decrement application count
    const commissionRef = doc(db, "commissions", commissionId);
    await updateDoc(commissionRef, {
        applicationsCount: increment(-1),
    });
}

// ========================================
// IMAGE UPLOADS
// ========================================

export async function uploadReferenceImage(file: File, commissionId: string): Promise<string> {
    const storageRef = ref(storage, `commissions/${commissionId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

// ========================================
// STATS
// ========================================

export async function getCommissionStats() {
    const openQuery = query(collection(db, "commissions"), where("status", "==", "open"));
    const completedQuery = query(collection(db, "commissions"), where("status", "==", "completed"));
    
    const [openSnap, completedSnap] = await Promise.all([
        getDocs(openQuery),
        getDocs(completedQuery)
    ]);
    
    return {
        openCommissions: openSnap.size,
        completedCommissions: completedSnap.size,
    };
}

