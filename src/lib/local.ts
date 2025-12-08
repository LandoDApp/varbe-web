import { db } from "./firebase";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc,
    doc,
    addDoc, 
    updateDoc, 
    deleteDoc,
    orderBy, 
    limit,
    arrayUnion,
    arrayRemove,
    increment
} from "firebase/firestore";
import { LocalEvent, ArtistMedium, UserProfile } from "@/types";

// ========================================
// ARTIST TYPES FOR LOCAL PAGE
// ========================================

// Extended type for artists with location data
export interface LocalArtistData {
    uid: string;
    displayName: string;
    artistName?: string;
    bio?: string;
    artStyle?: string;
    medium?: ArtistMedium;
    profilePictureUrl?: string;
    verificationStatus: string;
    
    // Location from artistProfile.studioLocation
    location?: {
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    
    // Availability from artistProfile
    openForCommissions?: boolean;
    openStudio?: boolean;
    openForCollabs?: boolean;
    studioHours?: string;
    
    // Stats
    followersCount?: number;
    artworksCount?: number;
    
    // Calculated distance
    distance?: number;
}

// ========================================
// LOCAL ARTISTS (from users collection)
// ========================================

/**
 * Get all verified artists with location data
 * Uses the existing users collection, not a separate localArtists collection
 */
export const getLocalArtists = async (limitCount: number = 50): Promise<LocalArtistData[]> => {
    try {
        const usersRef = collection(db, "users");
        // Get verified artists
        const q = query(
            usersRef,
            where("verificationStatus", "==", "verified"),
            orderBy("createdAt", "desc"),
            limit(limitCount * 2) // Get more to filter those with locations
        );
        const snapshot = await getDocs(q);
        
        // Map to LocalArtistData and filter those with location
        const artists: LocalArtistData[] = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const artistProfile = data.artistProfile;
            
            // Check if artist has location data AND wants to be shown on map
            const showOnMap = artistProfile?.studioLocation?.showOnMap !== false; // Default to true
            if (artistProfile?.studioLocation?.latitude && artistProfile?.studioLocation?.longitude && showOnMap) {
                artists.push({
                    uid: doc.id,
                    displayName: data.displayName || 'Artist',
                    artistName: artistProfile?.artistName,
                    bio: artistProfile?.bio || data.bio,
                    artStyle: artistProfile?.artStyle,
                    medium: mapArtStyleToMedium(artistProfile?.artStyle),
                    profilePictureUrl: data.profilePictureUrl,
                    verificationStatus: data.verificationStatus,
                    location: {
                        city: artistProfile.studioLocation.city || 'Unknown',
                        country: artistProfile.studioLocation.country || 'Unknown',
                        latitude: artistProfile.studioLocation.latitude,
                        longitude: artistProfile.studioLocation.longitude,
                    },
                    openForCommissions: artistProfile?.openForCommissions,
                    openStudio: artistProfile?.openForVisits,
                    openForCollabs: true, // Default
                    studioHours: artistProfile?.visitBookingUrl ? 'By appointment' : undefined,
                    followersCount: data.followersCount || 0,
                    artworksCount: 0, // Would need to count from artworks collection
                });
            }
        });
        
        return artists.slice(0, limitCount);
    } catch (error) {
        console.error("Error fetching local artists:", error);
        // Fallback: try to get all users and filter client-side
        try {
            const usersRef = collection(db, "users");
            const allSnapshot = await getDocs(usersRef);
            const artists: LocalArtistData[] = [];
            
            allSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.verificationStatus !== 'verified') return;
                
                const artistProfile = data.artistProfile;
                if (artistProfile?.studioLocation?.latitude && artistProfile?.studioLocation?.longitude) {
                    artists.push({
                        uid: doc.id,
                        displayName: data.displayName || 'Artist',
                        artistName: artistProfile?.artistName,
                        bio: artistProfile?.bio || data.bio,
                        artStyle: artistProfile?.artStyle,
                        medium: mapArtStyleToMedium(artistProfile?.artStyle),
                        profilePictureUrl: data.profilePictureUrl,
                        verificationStatus: data.verificationStatus,
                        location: {
                            city: artistProfile.studioLocation.city || 'Unknown',
                            country: artistProfile.studioLocation.country || 'Unknown',
                            latitude: artistProfile.studioLocation.latitude,
                            longitude: artistProfile.studioLocation.longitude,
                        },
                        openForCommissions: artistProfile?.openForCommissions,
                        openStudio: artistProfile?.openForVisits,
                        openForCollabs: true,
                        followersCount: data.followersCount || 0,
                        artworksCount: 0,
                    });
                }
            });
            
            return artists.slice(0, limitCount);
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            return [];
        }
    }
};

/**
 * Map art style string to medium enum
 */
function mapArtStyleToMedium(artStyle?: string): ArtistMedium {
    if (!artStyle) return 'mixed';
    const style = artStyle.toLowerCase();
    if (style.includes('digital') || style.includes('3d') || style.includes('nft')) return 'digital';
    if (style.includes('photo') || style.includes('foto')) return 'photography';
    if (style.includes('illust') || style.includes('zeichn') || style.includes('draw')) return 'illustration';
    if (style.includes('skulptur') || style.includes('sculpture') || style.includes('3d')) return 'sculpture';
    if (style.includes('oil') || style.includes('acrylic') || style.includes('watercolor') || style.includes('öl') || style.includes('acryl')) return 'traditional';
    return 'mixed';
}

/**
 * Get a single artist by UID
 */
export const getLocalArtist = async (uid: string): Promise<LocalArtistData | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const snapshot = await getDoc(userRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            const artistProfile = data.artistProfile;
            
            return {
                uid: snapshot.id,
                displayName: data.displayName || 'Artist',
                artistName: artistProfile?.artistName,
                bio: artistProfile?.bio || data.bio,
                artStyle: artistProfile?.artStyle,
                medium: mapArtStyleToMedium(artistProfile?.artStyle),
                profilePictureUrl: data.profilePictureUrl,
                verificationStatus: data.verificationStatus,
                location: artistProfile?.studioLocation ? {
                    city: artistProfile.studioLocation.city || 'Unknown',
                    country: artistProfile.studioLocation.country || 'Unknown',
                    latitude: artistProfile.studioLocation.latitude || 0,
                    longitude: artistProfile.studioLocation.longitude || 0,
                } : undefined,
                openForCommissions: artistProfile?.openForCommissions,
                openStudio: artistProfile?.openForVisits,
                openForCollabs: true,
                followersCount: data.followersCount || 0,
                artworksCount: 0,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching local artist:", error);
        return null;
    }
};

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
export const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// ========================================
// LOCAL EVENTS
// ========================================

/**
 * Get upcoming events
 */
export const getUpcomingEvents = async (limitCount: number = 20): Promise<LocalEvent[]> => {
    try {
        const eventsRef = collection(db, "localEvents");
        const now = Date.now();
        const q = query(
            eventsRef, 
            where("date", ">=", now),
            orderBy("date", "asc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LocalEvent));
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        // Fallback: get all events and filter client-side
        try {
            const eventsRef = collection(db, "localEvents");
            const allEventsSnapshot = await getDocs(eventsRef);
            const now = Date.now();
            return allEventsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as LocalEvent))
                .filter(event => event.date >= now)
                .sort((a, b) => a.date - b.date)
                .slice(0, limitCount);
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            return [];
        }
    }
};

/**
 * Get featured events
 */
export const getFeaturedEvents = async (): Promise<LocalEvent[]> => {
    try {
        const eventsRef = collection(db, "localEvents");
        const q = query(eventsRef, where("featured", "==", true));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LocalEvent));
    } catch (error) {
        console.error("Error fetching featured events:", error);
        return [];
    }
};

/**
 * Get a single event by ID
 */
export const getLocalEvent = async (eventId: string): Promise<LocalEvent | null> => {
    try {
        const eventRef = doc(db, "localEvents", eventId);
        const snapshot = await getDoc(eventRef);
        
        if (snapshot.exists()) {
            return {
                id: snapshot.id,
                ...snapshot.data()
            } as LocalEvent;
        }
        return null;
    } catch (error) {
        console.error("Error fetching local event:", error);
        return null;
    }
};

/**
 * Create a new event
 */
export const createLocalEvent = async (eventData: Omit<LocalEvent, 'id' | 'createdAt' | 'attendeesCount' | 'attendees' | 'artistsCount' | 'participatingArtists'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "localEvents"), {
            ...eventData,
            attendeesCount: 0,
            attendees: [],
            artistsCount: 0,
            participatingArtists: [],
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating local event:", error);
        throw error;
    }
};

/**
 * RSVP to an event
 */
export const rsvpToEvent = async (eventId: string, userId: string): Promise<void> => {
    try {
        const eventRef = doc(db, "localEvents", eventId);
        await updateDoc(eventRef, {
            attendees: arrayUnion(userId),
            attendeesCount: increment(1)
        });
    } catch (error) {
        console.error("Error RSVPing to event:", error);
        throw error;
    }
};

/**
 * Cancel RSVP to an event
 */
export const cancelRsvp = async (eventId: string, userId: string): Promise<void> => {
    try {
        const eventRef = doc(db, "localEvents", eventId);
        await updateDoc(eventRef, {
            attendees: arrayRemove(userId),
            attendeesCount: increment(-1)
        });
    } catch (error) {
        console.error("Error canceling RSVP:", error);
        throw error;
    }
};

/**
 * Check if user has RSVP'd to an event
 */
export const hasRsvp = async (eventId: string, userId: string): Promise<boolean> => {
    try {
        const event = await getLocalEvent(eventId);
        return event?.attendees.includes(userId) || false;
    } catch (error) {
        console.error("Error checking RSVP:", error);
        return false;
    }
};

// ========================================
// SEED DEMO LOCATION DATA FOR EXISTING USERS
// ========================================

/**
 * Add location data to an existing verified artist
 * This updates the artistProfile.studioLocation field
 */
export const addLocationToArtist = async (
    uid: string, 
    locationData: {
        city: string;
        country: string;
        latitude: number;
        longitude: number;
        showOnMap?: boolean;
    }
): Promise<void> => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            'artistProfile.studioLocation': {
                ...locationData,
                showOnMap: locationData.showOnMap ?? true
            }
        });
        console.log(`✅ Added location to artist ${uid}`);
    } catch (error) {
        console.error("Error adding location to artist:", error);
        throw error;
    }
};

/**
 * Add demo locations to all verified artists who don't have one
 */
export const seedDemoLocations = async (): Promise<number> => {
    // Demo locations around the world
    const demoLocations = [
        { city: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
        { city: 'Munich', country: 'Germany', latitude: 48.1351, longitude: 11.5820 },
        { city: 'Hamburg', country: 'Germany', latitude: 53.5511, longitude: 9.9937 },
        { city: 'Bremen', country: 'Germany', latitude: 53.0793, longitude: 8.8017 },
        { city: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060 },
        { city: 'Los Angeles', country: 'USA', latitude: 34.0522, longitude: -118.2437 },
        { city: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
        { city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
        { city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
        { city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
    ];
    
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("verificationStatus", "==", "verified"));
        const snapshot = await getDocs(q);
        
        let count = 0;
        for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            const artistProfile = data.artistProfile;
            
            // Skip if already has location
            if (artistProfile?.studioLocation?.latitude) continue;
            
            // Pick a random demo location
            const location = demoLocations[count % demoLocations.length];
            
            // Add small random offset to avoid overlapping markers
            const offset = (Math.random() - 0.5) * 0.1;
            
            await addLocationToArtist(userDoc.id, {
                city: location.city,
                country: location.country,
                latitude: location.latitude + offset,
                longitude: location.longitude + offset,
                showOnMap: true
            });
            
            count++;
        }
        
        console.log(`✅ Added demo locations to ${count} artists`);
        return count;
    } catch (error) {
        console.error("Error seeding demo locations:", error);
        throw error;
    }
};

// ========================================
// ARTIST MAP VISIBILITY
// ========================================

/**
 * Update whether an artist is visible on the map
 */
export const updateArtistMapVisibility = async (uid: string, showOnMap: boolean): Promise<void> => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            'artistProfile.studioLocation.showOnMap': showOnMap
        });
        console.log(`✅ Updated map visibility for ${uid}: ${showOnMap}`);
    } catch (error) {
        console.error("Error updating map visibility:", error);
        throw error;
    }
};

/**
 * Update artist's location with current position
 */
export const updateArtistLocation = async (
    uid: string, 
    latitude: number, 
    longitude: number,
    city?: string,
    country?: string
): Promise<void> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        
        const data = userSnap.data();
        const existingLocation = data.artistProfile?.studioLocation || {};
        
        await updateDoc(userRef, {
            'artistProfile.studioLocation': {
                ...existingLocation,
                latitude,
                longitude,
                city: city || existingLocation.city || 'Unbekannt',
                country: country || existingLocation.country || 'Unbekannt',
                showOnMap: existingLocation.showOnMap ?? true,
                updatedAt: Date.now()
            }
        });
        console.log(`✅ Updated location for ${uid}`);
    } catch (error) {
        console.error("Error updating artist location:", error);
        throw error;
    }
};

/**
 * Get artist's current map visibility status
 */
export const getArtistMapVisibility = async (uid: string): Promise<boolean> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return false;
        
        const data = userSnap.data();
        return data.artistProfile?.studioLocation?.showOnMap ?? false;
    } catch (error) {
        console.error("Error getting map visibility:", error);
        return false;
    }
};

// ========================================
// EVENT CREATION
// ========================================

export interface CreateEventData {
    title: string;
    description: string;
    category: 'art_walk' | 'exhibition' | 'open_studio' | 'workshop' | 'meetup' | 'market';
    date: number;
    startTime: string;
    endTime: string;
    location: {
        name: string;
        address: string;
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    freeEntry: boolean;
    price?: number;
    maxAttendees?: number;
}

/**
 * Create a new event (only verified artists can create events)
 */
export const createEvent = async (hostId: string, hostName: string, eventData: CreateEventData): Promise<string> => {
    try {
        // Verify host is a verified artist
        const userRef = doc(db, "users", hostId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        
        const userData = userSnap.data();
        if (userData.verificationStatus !== 'verified') {
            throw new Error("Only verified artists can create events");
        }
        
        const eventsRef = collection(db, "localEvents");
        
        // Build event data, filtering out undefined values (Firestore doesn't allow undefined)
        const newEvent: Record<string, any> = {
            hostId,
            hostName,
            title: eventData.title,
            description: eventData.description,
            category: eventData.category,
            date: eventData.date,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            location: eventData.location,
            freeEntry: eventData.freeEntry,
            featured: false,
            attendeesCount: 0,
            attendees: [],
            artistsCount: 1,
            participatingArtists: [hostId],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Only add optional fields if they have values
        if (eventData.price !== undefined && eventData.price !== null) {
            newEvent.price = eventData.price;
        }
        if (eventData.maxAttendees !== undefined && eventData.maxAttendees !== null) {
            newEvent.maxAttendees = eventData.maxAttendees;
        }
        if (eventData.imageUrl) {
            newEvent.imageUrl = eventData.imageUrl;
        }
        if (eventData.ticketUrl) {
            newEvent.ticketUrl = eventData.ticketUrl;
        }
        if (eventData.tags && eventData.tags.length > 0) {
            newEvent.tags = eventData.tags;
        }
        
        const docRef = await addDoc(eventsRef, newEvent);
        console.log(`✅ Event created: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
};

/**
 * Get events created by a specific user
 */
export const getUserCreatedEvents = async (userId: string): Promise<LocalEvent[]> => {
    try {
        const eventsRef = collection(db, "localEvents");
        const q = query(
            eventsRef,
            where("hostId", "==", userId),
            orderBy("date", "desc")
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LocalEvent));
    } catch (error) {
        console.error("Error fetching user events:", error);
        return [];
    }
};

/**
 * Get events a user is attending
 */
export const getUserAttendingEvents = async (userId: string): Promise<LocalEvent[]> => {
    try {
        const eventsRef = collection(db, "localEvents");
        const q = query(
            eventsRef,
            where("attendees", "array-contains", userId),
            orderBy("date", "asc")
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LocalEvent));
    } catch (error) {
        console.error("Error fetching attending events:", error);
        return [];
    }
};

// ========================================
// EVENT REGISTRATION (Anmeldung)
// ========================================

/**
 * Register for an event (Anmelden)
 */
export const registerForEvent = async (eventId: string, userId: string): Promise<void> => {
    try {
        const eventRef = doc(db, "localEvents", eventId);
        await updateDoc(eventRef, {
            attendees: arrayUnion(userId),
            attendeesCount: increment(1)
        });
    } catch (error) {
        console.error("Error registering for event:", error);
        throw error;
    }
};

/**
 * Unregister from an event (Abmelden)
 */
export const unregisterFromEvent = async (eventId: string, userId: string): Promise<void> => {
    try {
        const eventRef = doc(db, "localEvents", eventId);
        await updateDoc(eventRef, {
            attendees: arrayRemove(userId),
            attendeesCount: increment(-1)
        });
    } catch (error) {
        console.error("Error unregistering from event:", error);
        throw error;
    }
};

/**
 * Check if user is registered for an event
 */
export const isUserRegistered = async (eventId: string, userId: string): Promise<boolean> => {
    try {
        const event = await getLocalEvent(eventId);
        return event?.attendees.includes(userId) || false;
    } catch (error) {
        console.error("Error checking registration:", error);
        return false;
    }
};

/**
 * Get all attendees for an event with their profile data
 */
export const getEventAttendees = async (eventId: string): Promise<Array<{
    uid: string;
    displayName: string;
    profilePictureUrl?: string;
    verificationStatus?: string;
}>> => {
    try {
        const event = await getLocalEvent(eventId);
        if (!event || !event.attendees.length) return [];
        
        const attendees = [];
        for (const attendeeId of event.attendees) {
            const userRef = doc(db, "users", attendeeId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                attendees.push({
                    uid: userSnap.id,
                    displayName: data.displayName || 'User',
                    profilePictureUrl: data.profilePictureUrl,
                    verificationStatus: data.verificationStatus
                });
            }
        }
        return attendees;
    } catch (error) {
        console.error("Error fetching event attendees:", error);
        return [];
    }
};

// ========================================
// EVENT POSTS (Timeline)
// ========================================

export interface EventPostData {
    text: string;
    images?: string[];
    isPinned?: boolean;
}

/**
 * Create a post for an event (only host can post)
 */
export const createEventPost = async (
    eventId: string, 
    authorId: string, 
    postData: EventPostData
): Promise<string> => {
    try {
        // Verify author is the event host
        const event = await getLocalEvent(eventId);
        if (!event) throw new Error("Event not found");
        if (event.hostId !== authorId) throw new Error("Only the event host can create posts");
        
        const postsRef = collection(db, "eventPosts");
        const newPost = {
            eventId,
            authorId,
            text: postData.text,
            images: postData.images || [],
            isPinned: postData.isPinned || false,
            likesCount: 0,
            commentsCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        const docRef = await addDoc(postsRef, newPost);
        
        // Update post count on event
        const eventRef = doc(db, "localEvents", eventId);
        await updateDoc(eventRef, {
            postsCount: increment(1)
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error creating event post:", error);
        throw error;
    }
};

/**
 * Get all posts for an event
 */
export const getEventPosts = async (eventId: string): Promise<Array<{
    id: string;
    eventId: string;
    authorId: string;
    text: string;
    images?: string[];
    isPinned?: boolean;
    likesCount: number;
    commentsCount: number;
    createdAt: number;
}>> => {
    try {
        const postsRef = collection(db, "eventPosts");
        const q = query(
            postsRef,
            where("eventId", "==", eventId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any;
    } catch (error) {
        console.error("Error fetching event posts:", error);
        return [];
    }
};

/**
 * Like an event post
 */
export const likeEventPost = async (postId: string, userId: string): Promise<void> => {
    try {
        const likeRef = doc(db, "eventPostLikes", `${postId}_${userId}`);
        const likeSnap = await getDoc(likeRef);
        
        if (likeSnap.exists()) {
            // Unlike
            await deleteDoc(likeRef);
            const postRef = doc(db, "eventPosts", postId);
            await updateDoc(postRef, {
                likesCount: increment(-1)
            });
        } else {
            // Like
            await addDoc(collection(db, "eventPostLikes"), {
                postId,
                userId,
                createdAt: Date.now()
            });
            const postRef = doc(db, "eventPosts", postId);
            await updateDoc(postRef, {
                likesCount: increment(1)
            });
        }
    } catch (error) {
        console.error("Error liking event post:", error);
        throw error;
    }
};

// ========================================
// EVENT COMMENTS
// ========================================

export interface EventCommentData {
    text: string;
    parentCommentId?: string;
}

/**
 * Add a comment to an event post (only registered attendees can comment)
 */
export const addEventComment = async (
    eventId: string,
    postId: string,
    userId: string,
    commentData: EventCommentData
): Promise<string> => {
    try {
        // Verify user is registered for the event
        const isRegistered = await isUserRegistered(eventId, userId);
        if (!isRegistered) {
            throw new Error("Du musst für das Event angemeldet sein, um kommentieren zu können.");
        }
        
        const commentsRef = collection(db, "eventComments");
        const newComment = {
            eventId,
            postId,
            userId,
            text: commentData.text,
            parentCommentId: commentData.parentCommentId || null,
            likesCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        const docRef = await addDoc(commentsRef, newComment);
        
        // Update comment count on post
        const postRef = doc(db, "eventPosts", postId);
        await updateDoc(postRef, {
            commentsCount: increment(1)
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding event comment:", error);
        throw error;
    }
};

/**
 * Get comments for an event post
 */
export const getEventPostComments = async (postId: string): Promise<Array<{
    id: string;
    eventId: string;
    postId: string;
    userId: string;
    text: string;
    parentCommentId?: string;
    likesCount: number;
    createdAt: number;
}>> => {
    try {
        const commentsRef = collection(db, "eventComments");
        const q = query(
            commentsRef,
            where("postId", "==", postId),
            orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any;
    } catch (error) {
        console.error("Error fetching event comments:", error);
        return [];
    }
};

/**
 * Delete an event comment (only comment author or event host)
 */
export const deleteEventComment = async (
    commentId: string, 
    userId: string, 
    eventId: string
): Promise<void> => {
    try {
        const commentRef = doc(db, "eventComments", commentId);
        const commentSnap = await getDoc(commentRef);
        
        if (!commentSnap.exists()) throw new Error("Comment not found");
        
        const commentData = commentSnap.data();
        const event = await getLocalEvent(eventId);
        
        // Check if user is comment author or event host
        if (commentData.userId !== userId && event?.hostId !== userId) {
            throw new Error("Not authorized to delete this comment");
        }
        
        const postId = commentData.postId;
        await deleteDoc(commentRef);
        
        // Update comment count on post
        const postRef = doc(db, "eventPosts", postId);
        await updateDoc(postRef, {
            commentsCount: increment(-1)
        });
    } catch (error) {
        console.error("Error deleting event comment:", error);
        throw error;
    }
};
