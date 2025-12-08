import { db, storage } from "./firebase";
import { collection, addDoc, getDoc, getDocs, doc, query, orderBy, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Artwork, Bid } from "@/types";
import { notifyHighestBidder, notifyOutbid } from "./notifications";
import { formatPrice } from "./utils";

export const createListing = async (listing: Omit<Artwork, "id" | "createdAt">) => {
    try {
        console.log("📝 Creating listing document in Firestore...");
        console.log("Listing data:", listing);
        
        // Validate price
        if (!listing.price || isNaN(listing.price) || listing.price <= 0) {
            throw new Error("Invalid price. Price must be a positive number.");
        }
        
        // Validate minimum price (10€)
        if (listing.price < 10) {
            throw new Error("Der Mindestpreis beträgt 10€. Dies ist notwendig, damit die Stripe-Gebühren fair sind.");
        }
        
        // Validate buy now price minimum if set
        if (listing.buyNowPrice !== undefined && listing.buyNowPrice < 10) {
            throw new Error("Der Mindestpreis für 'Sofort Kaufen' beträgt 10€.");
        }
        
        // Remove undefined values (Firestore doesn't accept undefined)
        const cleanListing: any = {
            artistId: listing.artistId,
            title: listing.title,
            description: listing.description,
            images: listing.images,
            price: listing.price,
            currency: listing.currency,
            dimensions: listing.dimensions,
            technique: listing.technique,
            category: listing.category,
            condition: listing.condition,
            listingType: listing.listingType,
            status: listing.status,
            shippingType: listing.shippingType,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        
        // Add optional fields only if they exist
        if (listing.year !== undefined) cleanListing.year = listing.year;
        if (listing.auctionEndTime !== undefined) cleanListing.auctionEndTime = listing.auctionEndTime;
        if (listing.currentBid !== undefined) cleanListing.currentBid = listing.currentBid;
        if (listing.minBidIncrement !== undefined) cleanListing.minBidIncrement = listing.minBidIncrement;
        if (listing.buyNowPrice !== undefined) cleanListing.buyNowPrice = listing.buyNowPrice;
        if (listing.shippingCost !== undefined) cleanListing.shippingCost = listing.shippingCost; // Legacy
        if (listing.shippingType !== undefined) cleanListing.shippingType = listing.shippingType; // Legacy
        if (listing.quantity !== undefined) cleanListing.quantity = listing.quantity;
        if (listing.isDigital !== undefined) cleanListing.isDigital = listing.isDigital;
        if (listing.location !== undefined) cleanListing.location = listing.location;
        if (listing.shippingZones !== undefined) cleanListing.shippingZones = listing.shippingZones; // New shipping zones system
        
        // Story & Provenance fields
        if (listing.artistStory !== undefined && listing.artistStory.trim()) cleanListing.artistStory = listing.artistStory;
        if (listing.videoUrl !== undefined && listing.videoUrl.trim()) cleanListing.videoUrl = listing.videoUrl;
        if (listing.videoFile !== undefined) cleanListing.videoFile = listing.videoFile;
        if (listing.processImages !== undefined && listing.processImages.length > 0) cleanListing.processImages = listing.processImages;
        if (listing.artistSignature !== undefined) cleanListing.artistSignature = listing.artistSignature;
        
        // Generate certificate ID for new listings
        const certificateId = `VARBE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        cleanListing.certificateId = certificateId;
        cleanListing.certificateIssued = Date.now();
        
        // Geo-location fields
        if (listing.geoLocation !== undefined) cleanListing.geoLocation = listing.geoLocation;
        if (listing.pickupAvailable !== undefined) cleanListing.pickupAvailable = listing.pickupAvailable;
        if (listing.pickupDetails !== undefined) cleanListing.pickupDetails = listing.pickupDetails;
        if (listing.studioVisitAvailable !== undefined) cleanListing.studioVisitAvailable = listing.studioVisitAvailable;
        if (listing.studioVisitBookingUrl !== undefined) cleanListing.studioVisitBookingUrl = listing.studioVisitBookingUrl;
        if (listing.studioVisitDetails !== undefined) cleanListing.studioVisitDetails = listing.studioVisitDetails;
        
        // Package dimensions
        if (listing.packageDimensions !== undefined) cleanListing.packageDimensions = listing.packageDimensions;
        if (listing.packageWeight !== undefined) cleanListing.packageWeight = listing.packageWeight;
        
        console.log("Clean listing data (no undefined):", cleanListing);
        
        // Ensure Firestore is online before writing
        const { enableNetwork, waitForPendingWrites } = await import("firebase/firestore");
        try {
            console.log("🔌 Enabling Firestore network...");
            await enableNetwork(db);
            console.log("✅ Firestore network enabled");
            
            // Wait for any pending writes to complete
            console.log("⏳ Waiting for pending writes...");
            await waitForPendingWrites(db);
            console.log("✅ Pending writes completed");
        } catch (networkError: any) {
            console.error("❌ Network error:", networkError);
            throw new Error(`Firestore network error: ${networkError?.message || 'Could not connect to Firestore. Please check your internet connection and Firestore Rules.'}`);
        }
        
        // Add timeout to prevent infinite waiting
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Firestore operation timed out after 15 seconds. Please check:\n1. Your internet connection\n2. Firestore Rules in Firebase Console\n3. Browser console for network errors")), 15000);
        });
        
        console.log("⏳ Writing to Firestore...");
        console.log("Collection path: artworks");
        console.log("Document data keys:", Object.keys(cleanListing));
        
        const addDocPromise = addDoc(collection(db, "artworks"), cleanListing);
        
        const docRef = await Promise.race([addDocPromise, timeoutPromise]) as any;
        
        console.log("✅ Listing document created:", docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error("❌ Error in createListing:", error);
        console.error("Error code:", error?.code);
        console.error("Error message:", error?.message);
        
        // Handle offline errors
        if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
            throw new Error("Firestore is offline. Please check your internet connection and try again.");
        }
        
        throw error;
    }
};

export const placeBid = async (listingId: string, userId: string, amount: number) => {
    // Get current listing
    const listingRef = doc(db, "artworks", listingId);
    const listingSnap = await getDoc(listingRef);
    
    if (!listingSnap.exists()) {
        throw new Error("Listing not found");
    }
    
    const listing = listingSnap.data() as Artwork;
    
    // Check if listing is available for bidding
    if (listing.status === 'sold' || listing.status === 'ended') {
        throw new Error("This listing is no longer available");
    }
    
    // Check if user is the owner
    if (listing.artistId === userId) {
        throw new Error("You cannot bid on your own listing");
    }
    
    // Check if auction is still active
    if (listing.auctionEndTime && listing.auctionEndTime < Date.now()) {
        throw new Error("Auction has ended");
    }
    
    // Validate listing type
    if (listing.listingType === 'buy_now') {
        throw new Error("This listing does not accept bids");
    }
    
    // Validate bid amount
    const currentBid = listing.currentBid || listing.price;
    const minBid = currentBid + (listing.minBidIncrement || 10);
    
    if (amount < minBid) {
        throw new Error(`Bid must be at least €${formatPrice(minBid)}`);
    }
    
    // Round amount to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    // Get all existing bids to find the previous highest bidder
    const existingBidsQuery = query(
        collection(db, "bids"),
        where("listingId", "==", listingId),
        orderBy("amount", "desc")
    );
    const existingBidsSnapshot = await getDocs(existingBidsQuery);
    const existingBids: Bid[] = existingBidsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Bid));
    
    // Find the previous highest bidder (if any)
    // We need to find the user who had the highest bid BEFORE this new bid
    // If the current user already has bids, we need to find the highest bid from OTHER users
    let previousHighestBidderId: string | undefined = undefined;
    
    if (existingBids.length > 0) {
        // Find the highest bid from a different user (the one being outbid)
        const highestBidFromOtherUser = existingBids.find(bid => bid.userId !== userId);
        if (highestBidFromOtherUser) {
            previousHighestBidderId = highestBidFromOtherUser.userId;
        } else {
            // If all existing bids are from the current user, check if there's someone else
            // who should be notified (this shouldn't happen, but just in case)
            // Actually, if all bids are from current user, no one needs to be notified about being outbid
            previousHighestBidderId = undefined;
        }
    }
    
    // Create bid document
    const bidRef = await addDoc(collection(db, "bids"), {
        listingId,
        userId,
        amount,
        createdAt: Date.now(),
    });
    
    // Update listing with new current bid
    await updateDoc(listingRef, {
        currentBid: amount,
        updatedAt: Date.now(),
    });
    
    console.log(`✅ Bid placed: €${amount} on listing ${listingId}`);
    
    // Notify the new highest bidder
    try {
        await notifyHighestBidder(userId, listingId, listing.title, amount);
    } catch (error) {
        console.error("Error notifying highest bidder:", error);
        // Don't fail the bid if notification fails
    }
    
    // Notify the previous highest bidder that they've been outbid (if different user)
    if (previousHighestBidderId && previousHighestBidderId !== userId) {
        try {
            await notifyOutbid(previousHighestBidderId, listingId, listing.title, amount);
        } catch (error) {
            console.error("Error notifying outbid user:", error);
            // Don't fail the bid if notification fails
        }
    }
    
    return bidRef.id;
};

export const getBidsForListing = async (listingId: string): Promise<Bid[]> => {
    const q = query(
        collection(db, "bids"),
        where("listingId", "==", listingId),
        orderBy("amount", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Bid));
};

export const getListing = async (id: string) => {
    const docRef = doc(db, "artworks", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Artwork;
    }
    return null;
};

export const getAllListings = async () => {
    try {
        // Fetch all listings and filter client-side to avoid index issues
        console.log("📡 Fetching all listings from Firestore...");
        const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
        
        // Filter for approved listings client-side
        const approvedListings = allListings.filter(l => l.adminApprovalStatus === 'approved');
        console.log(`✅ Total listings: ${allListings.length}, Approved: ${approvedListings.length}`);
        console.log("📊 Listing details:", approvedListings.map(l => ({
            id: l.id,
            title: l.title,
            status: l.status,
            adminApproval: l.adminApprovalStatus
        })));
        
        return approvedListings;
    } catch (error: any) {
        console.error("Error fetching listings:", error);
        // If orderBy fails, try without it
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn("OrderBy requires index, fetching all and sorting client-side");
            const q = query(collection(db, "artworks"));
            const querySnapshot = await getDocs(q);
            const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
            const approvedListings = allListings.filter(l => l.adminApprovalStatus === 'approved');
            approvedListings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            console.log(`✅ Fetched ${approvedListings.length} approved listings (client-side sorted)`);
            return approvedListings;
        }
        throw error;
    }
};

export const getPendingListings = async () => {
    try {
        // Get all listings and filter client-side to catch all non-approved ones
        console.log("📡 Fetching all listings to find pending ones...");
        const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
        
        // Filter for pending or non-approved listings
        const pendingListings = allListings.filter(l => 
            l.adminApprovalStatus === 'pending' || 
            !l.adminApprovalStatus || 
            l.adminApprovalStatus !== 'approved'
        );
        
        console.log(`📊 Total listings: ${allListings.length}`);
        console.log(`📊 Pending/non-approved: ${pendingListings.length}`);
        console.log("📊 Approval statuses:", allListings.map(l => ({
            id: l.id,
            title: l.title,
            adminApprovalStatus: l.adminApprovalStatus || 'undefined'
        })));
        
        return pendingListings;
    } catch (error: any) {
        console.error("Error fetching pending listings:", error);
        // Fallback: try without orderBy
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn("OrderBy requires index, fetching all and filtering client-side");
            const q = query(collection(db, "artworks"));
            const querySnapshot = await getDocs(q);
            const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
            const pendingListings = allListings.filter(l => 
                l.adminApprovalStatus === 'pending' || 
                !l.adminApprovalStatus ||
                l.adminApprovalStatus !== 'approved'
            );
            pendingListings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            return pendingListings;
        }
        throw error;
    }
};

export const approveListing = async (listingId: string, adminId: string) => {
    const listingRef = doc(db, "artworks", listingId);
    await updateDoc(listingRef, {
        adminApprovalStatus: 'approved',
        adminApprovedAt: Date.now(),
        adminApprovedBy: adminId,
        status: 'available', // Make it available after approval
        updatedAt: Date.now(),
    });
};

export const rejectListing = async (listingId: string, adminId: string, reason: string) => {
    const listingRef = doc(db, "artworks", listingId);
    await updateDoc(listingRef, {
        adminApprovalStatus: 'rejected',
        adminRejectionReason: reason,
        adminApprovedBy: adminId,
        updatedAt: Date.now(),
    });
};

export const getAllListingsForAdmin = async () => {
    // Get all listings for admin (no filter)
    const q = query(
        collection(db, "artworks"),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
};

export const setFeaturedListing = async (listingId: string, featured: boolean, adminId: string) => {
    const listingRef = doc(db, "artworks", listingId);
    await updateDoc(listingRef, {
        featured,
        featuredAt: featured ? Date.now() : null,
        updatedAt: Date.now(),
    });
};

export const getFeaturedListings = async () => {
    try {
        const q = query(
            collection(db, "artworks"),
            where("featured", "==", true),
            where("adminApprovalStatus", "==", "approved"),
            orderBy("featuredAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
    } catch (error: any) {
        // Fallback: If Firestore index is missing or permission error, filter client-side
        console.warn("Firestore query failed for getFeaturedListings, using fallback:", error?.code, error?.message);
        try {
            // Try without orderBy first
            const q = query(
                collection(db, "artworks"),
                where("featured", "==", true),
                where("adminApprovalStatus", "==", "approved")
            );
            const querySnapshot = await getDocs(q);
            const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
            // Sort client-side
            listings.sort((a, b) => (b.featuredAt || 0) - (a.featuredAt || 0));
            console.log("✅ Fallback query succeeded (without orderBy)");
            return listings;
        } catch (fallbackError: any) {
            // If that also fails, fetch all and filter client-side
            console.warn("Fallback query also failed, fetching all and filtering client-side:", fallbackError?.code);
            try {
                const q = query(collection(db, "artworks"));
                const querySnapshot = await getDocs(q);
                const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
                const featured = allListings.filter(l => 
                    l.featured === true && 
                    l.adminApprovalStatus === 'approved'
                );
                featured.sort((a, b) => (b.featuredAt || 0) - (a.featuredAt || 0));
                console.log("✅ Fallback succeeded (fetching all and filtering client-side)");
                return featured;
            } catch (finalError: any) {
                // If even fetching all fails, return empty array instead of throwing
                console.error("All fallbacks failed for getFeaturedListings:", finalError);
                return [];
            }
        }
    }
};

export const getUserListings = async (artistId: string) => {
    const q = query(
        collection(db, "artworks"),
        where("artistId", "==", artistId),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
};

export const uploadListingImage = async (file: File, userId: string) => {
    const storageRef = ref(storage, `artworks/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

/**
 * Upload process images (behind-the-scenes photos)
 */
export const uploadProcessImage = async (file: File, userId: string) => {
    const storageRef = ref(storage, `process/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

/**
 * Upload artist signature for certificates
 */
export const uploadArtistSignature = async (file: File, userId: string) => {
    const storageRef = ref(storage, `signatures/${userId}/${Date.now()}_signature.png`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

/**
 * Upload video file (for artwork documentation)
 * Max 50MB, returns Firebase Storage URL
 */
export const uploadVideoFile = async (file: File, userId: string) => {
    // Validate video file
    if (!file.type.startsWith('video/')) {
        throw new Error('Die Datei muss ein Video sein');
    }
    
    // Max 50MB
    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`Video ist zu groß. Maximum: ${maxSizeMB}MB`);
    }
    
    const storageRef = ref(storage, `videos/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};;
