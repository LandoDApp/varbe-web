import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { Report, ContentReport } from "@/types";

export const createReport = async (report: Omit<Report, "id" | "createdAt">) => {
    // Build report data, filtering out undefined values (Firestore doesn't allow undefined)
    const reportData: Record<string, any> = {
        reportedBy: report.reportedBy,
        reason: report.reason,
        status: 'pending' as const,
        createdAt: Date.now(),
    };
    
    // Include listingId if provided (for artwork reports)
    if (report.listingId) {
        reportData.listingId = report.listingId;
    }
    
    // Only include description if it's provided and not empty
    if (report.description && report.description.trim()) {
        reportData.description = report.description.trim();
    }
    
    // Include optional fields if they exist
    if (report.reviewedBy !== undefined) {
        reportData.reviewedBy = report.reviewedBy;
    }
    if (report.reviewedAt !== undefined) {
        reportData.reviewedAt = report.reviewedAt;
    }
    
    const docRef = await addDoc(collection(db, "reports"), reportData);
    return docRef.id;
};

/**
 * Create a report for any content type (feed_post, comment, user, etc.)
 */
export const createContentReport = async (data: {
    reporterId: string;
    contentType: 'feed_post' | 'comment' | 'user' | 'artwork' | 'message';
    contentId: string;
    reason: string;
    description?: string;
}) => {
    const reportData = {
        reportedBy: data.reporterId,
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason,
        description: data.description || '',
        status: 'pending' as const,
        createdAt: Date.now(),
    };
    
    const docRef = await addDoc(collection(db, "content_reports"), reportData);
    return docRef.id;
};

export const getReports = async (status?: Report['status']) => {
    let q;
    if (status) {
        q = query(
            collection(db, "reports"),
            where("status", "==", status),
            orderBy("createdAt", "desc")
        );
    } else {
        q = query(
            collection(db, "reports"),
            orderBy("createdAt", "desc")
        );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

export const updateReportStatus = async (reportId: string, status: Report['status'], adminId: string) => {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
        status,
        reviewedBy: adminId,
        reviewedAt: Date.now(),
    });
};

/**
 * Get all content reports (for admin dashboard)
 */
export const getContentReports = async (status?: ContentReport['status']) => {
    let q;
    if (status) {
        q = query(
            collection(db, "content_reports"),
            where("status", "==", status),
            orderBy("createdAt", "desc")
        );
    } else {
        q = query(
            collection(db, "content_reports"),
            orderBy("createdAt", "desc")
        );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentReport));
};

/**
 * Update content report status (admin action)
 */
export const updateContentReportStatus = async (reportId: string, status: ContentReport['status'], adminId: string) => {
    const reportRef = doc(db, "content_reports", reportId);
    await updateDoc(reportRef, {
        status,
        reviewedBy: adminId,
        reviewedAt: Date.now(),
    });
};




