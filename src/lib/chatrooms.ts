import { db } from "./firebase";
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot,
    serverTimestamp,
    increment,
    Timestamp
} from "firebase/firestore";
import { Chatroom, ChatMessage, ChatroomMember, ChatroomCategory, ChatroomRegion, ModerationResult } from "@/types";
// Moderation is now handled server-side via /api/chat/moderate

// ========================================
// CONSTANTS
// ========================================

export const CHATROOM_CATEGORIES: Record<ChatroomCategory, { label: string; emoji: string; description: string }> = {
    general: { label: 'General', emoji: '💬', description: 'General chat for everything' },
    illustration: { label: 'Illustration', emoji: '✏️', description: 'Drawings & Illustrations' },
    digital_art: { label: 'Digital Art', emoji: '🖥️', description: 'Digital Art & Design' },
    traditional: { label: 'Traditional', emoji: '🎨', description: 'Acrylic, Oil, Watercolor & more' },
    photography: { label: 'Photography', emoji: '📷', description: 'Photography & Photo Editing' },
    animation: { label: 'Animation', emoji: '🎬', description: 'Animation & Motion Design' },
    concept_art: { label: 'Concept Art', emoji: '🎮', description: 'Game Art & Concept Design' },
    subculture: { label: 'Subculture', emoji: '🔥', description: 'Scene, Streetart & Underground' },
    business: { label: 'Business', emoji: '💼', description: 'Freelance & Career Tips' },
    critique: { label: 'Feedback', emoji: '🔍', description: 'Constructive Critique & Reviews' },
    collab: { label: 'Collab', emoji: '🤝', description: 'Looking for Collaborations' },
};

export const CHATROOM_REGIONS: Record<ChatroomRegion, { label: string; flag: string; language: string }> = {
    global: { label: 'International', flag: '🌍', language: 'English' },
    de: { label: 'Deutschland', flag: '🇩🇪', language: 'Deutsch' },
    at: { label: 'Österreich', flag: '🇦🇹', language: 'Deutsch' },
    ch: { label: 'Schweiz', flag: '🇨🇭', language: 'Deutsch' },
    us: { label: 'USA', flag: '🇺🇸', language: 'English' },
    uk: { label: 'United Kingdom', flag: '🇬🇧', language: 'English' },
    fr: { label: 'France', flag: '🇫🇷', language: 'Français' },
    es: { label: 'España', flag: '🇪🇸', language: 'Español' },
    it: { label: 'Italia', flag: '🇮🇹', language: 'Italiano' },
    nl: { label: 'Nederland', flag: '🇳🇱', language: 'Nederlands' },
    pl: { label: 'Polska', flag: '🇵🇱', language: 'Polski' },
};

// ========================================
// CHATROOMS
// ========================================

/**
 * Get all active chatrooms with accurate member counts
 */
export async function getChatrooms(
    regionFilter?: ChatroomRegion,
    categoryFilter?: ChatroomCategory,
    limitCount: number = 50
): Promise<Chatroom[]> {
    // Simple query without composite index requirement
    const q = query(
        collection(db, "chatrooms"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    let rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chatroom));
    
    // Client-side filtering
    rooms = rooms.filter(r => r.isActive === true);
    
    if (regionFilter) {
        rooms = rooms.filter(r => r.region === regionFilter);
    }
    if (categoryFilter) {
        rooms = rooms.filter(r => r.category === categoryFilter);
    }
    
    // Get accurate counts from chatroom_members collection
    const membersSnapshot = await getDocs(collection(db, "chatroom_members"));
    const membersByRoom: Record<string, { total: number; online: number }> = {};
    
    // Count members and online users per room
    // Consider "online" if lastSeenAt is within the last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    membersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const roomId = data.roomId;
        
        if (!membersByRoom[roomId]) {
            membersByRoom[roomId] = { total: 0, online: 0 };
        }
        
        membersByRoom[roomId].total++;
        
        // Check if user is actually online (seen in last 5 minutes)
        if (data.isOnline && data.lastSeenAt && data.lastSeenAt > fiveMinutesAgo) {
            membersByRoom[roomId].online++;
        }
    });
    
    // Update rooms with accurate counts
    rooms = rooms.map(room => ({
        ...room,
        membersCount: membersByRoom[room.id]?.total || 0,
        onlineCount: membersByRoom[room.id]?.online || 0,
    }));
    
    // Sort by online users first, then by members count as secondary
    rooms.sort((a, b) => {
        const onlineDiff = (b.onlineCount || 0) - (a.onlineCount || 0);
        if (onlineDiff !== 0) return onlineDiff;
        return (b.membersCount || 0) - (a.membersCount || 0);
    });
    
    return rooms;
}

/**
 * Get unique member count across all chatrooms
 * A user in multiple rooms is only counted once
 */
export async function getUniqueMemberCount(): Promise<{ uniqueUsers: number; totalOnline: number }> {
    try {
        const membersSnapshot = await getDocs(collection(db, "chatroom_members"));
        
        const uniqueUserIds = new Set<string>();
        const onlineUserIds = new Set<string>();
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        membersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            
            if (userId) {
                uniqueUserIds.add(userId);
                
                // Check if user is actually online (seen in last 5 minutes)
                if (data.isOnline && data.lastSeenAt && data.lastSeenAt > fiveMinutesAgo) {
                    onlineUserIds.add(userId);
                }
            }
        });
        
        return {
            uniqueUsers: uniqueUserIds.size,
            totalOnline: onlineUserIds.size,
        };
    } catch (error) {
        console.error("Error getting unique member count:", error);
        return { uniqueUsers: 0, totalOnline: 0 };
    }
}

/**
 * Sync chatroom statistics - recalculates membersCount and onlineCount
 * Call this periodically or after bulk operations
 */
export async function syncChatroomStats(): Promise<void> {
    try {
        // Get all chatrooms
        const chatroomsSnapshot = await getDocs(collection(db, "chatrooms"));
        const membersSnapshot = await getDocs(collection(db, "chatroom_members"));
        
        // Count members per room
        const membersByRoom: Record<string, { total: number; online: number }> = {};
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        membersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const roomId = data.roomId;
            
            if (!membersByRoom[roomId]) {
                membersByRoom[roomId] = { total: 0, online: 0 };
            }
            
            membersByRoom[roomId].total++;
            
            if (data.isOnline && data.lastSeenAt && data.lastSeenAt > fiveMinutesAgo) {
                membersByRoom[roomId].online++;
            }
        });
        
        // Update each chatroom with accurate counts
        const updates = chatroomsSnapshot.docs.map(async (chatroomDoc) => {
            const roomId = chatroomDoc.id;
            const counts = membersByRoom[roomId] || { total: 0, online: 0 };
            
            await updateDoc(doc(db, "chatrooms", roomId), {
                membersCount: counts.total,
                onlineCount: counts.online,
                updatedAt: Date.now(),
            });
        });
        
        await Promise.all(updates);
        console.log(`✅ Synced stats for ${chatroomsSnapshot.docs.length} chatrooms`);
    } catch (error) {
        console.error("Error syncing chatroom stats:", error);
    }
}

/**
 * Clean up stale online statuses (users who left without calling leaveChatroom)
 * Call this periodically (e.g., every 10 minutes via cron)
 */
export async function cleanupStaleOnlineStatuses(): Promise<number> {
    try {
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        
        // Get all members marked as online
        const q = query(
            collection(db, "chatroom_members"),
            where("isOnline", "==", true)
        );
        
        const snapshot = await getDocs(q);
        let cleanedCount = 0;
        
        const updates = snapshot.docs.map(async (memberDoc) => {
            const data = memberDoc.data();
            
            // If lastSeenAt is older than 10 minutes, mark as offline
            if (data.lastSeenAt && data.lastSeenAt < tenMinutesAgo) {
                await updateDoc(memberDoc.ref, {
                    isOnline: false,
                    lastSeenAt: Date.now(),
                });
                cleanedCount++;
            }
        });
        
        await Promise.all(updates);
        
        // Sync chatroom stats after cleanup
        await syncChatroomStats();
        
        console.log(`🧹 Cleaned up ${cleanedCount} stale online statuses`);
        return cleanedCount;
    } catch (error) {
        console.error("Error cleaning up stale statuses:", error);
        return 0;
    }
}

/**
 * Get a single chatroom by ID
 */
export async function getChatroom(roomId: string): Promise<Chatroom | null> {
    const docRef = doc(db, "chatrooms", roomId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Chatroom;
}

/**
 * Create a new chatroom (Admin function)
 */
export interface CreateChatroomData {
    name: string;
    description: string;
    category: ChatroomCategory;
    region: ChatroomRegion;
    emoji: string;
    color: string;
    isPinned?: boolean;
    isModerated?: boolean;
}

export async function createChatroom(data: CreateChatroomData, adminId?: string): Promise<string> {
    // Generate URL-friendly ID from name
    const roomId = data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 50);
    
    // Check if room with this ID already exists
    const existingRoom = await getChatroom(roomId);
    if (existingRoom) {
        throw new Error(`Ein Chatroom mit dem Namen "${data.name}" existiert bereits.`);
    }
    
    const chatroom: Omit<Chatroom, 'id'> = {
        name: data.name,
        description: data.description,
        category: data.category,
        region: data.region,
        emoji: data.emoji,
        color: data.color,
        isActive: true,
        isPinned: data.isPinned || false,
        isModerated: data.isModerated || true,
        membersCount: 0,
        onlineCount: 0,
        messagesCount: 0,
        createdAt: Date.now(),
        createdBy: adminId,
    };
    
    await setDoc(doc(db, "chatrooms", roomId), chatroom);
    
    console.log(`✅ Chatroom "${data.name}" (${roomId}) created`);
    return roomId;
}

/**
 * Update a chatroom (Admin function)
 */
export async function updateChatroom(roomId: string, data: Partial<CreateChatroomData>): Promise<void> {
    const docRef = doc(db, "chatrooms", roomId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
        throw new Error(`Chatroom "${roomId}" nicht gefunden.`);
    }
    
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
    
    console.log(`✅ Chatroom "${roomId}" updated`);
}

/**
 * Delete a chatroom (Admin function)
 */
export async function deleteChatroom(roomId: string): Promise<void> {
    const docRef = doc(db, "chatrooms", roomId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
        throw new Error(`Chatroom "${roomId}" nicht gefunden.`);
    }
    
    // Delete all members of this room
    const membersQuery = query(
        collection(db, "chatroom_members"),
        where("roomId", "==", roomId)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    const memberDeletes = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(memberDeletes);
    
    // Delete all messages in this room
    const messagesQuery = query(
        collection(db, "chat_messages"),
        where("roomId", "==", roomId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const messageDeletes = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(messageDeletes);
    
    // Delete the chatroom
    await deleteDoc(docRef);
    
    console.log(`✅ Chatroom "${roomId}" and all associated data deleted`);
}

/**
 * Toggle chatroom active status (Admin function)
 */
export async function toggleChatroomActive(roomId: string): Promise<boolean> {
    const docRef = doc(db, "chatrooms", roomId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
        throw new Error(`Chatroom "${roomId}" nicht gefunden.`);
    }
    
    const currentStatus = docSnap.data().isActive;
    const newStatus = !currentStatus;
    
    await updateDoc(docRef, {
        isActive: newStatus,
        updatedAt: Date.now(),
    });
    
    console.log(`✅ Chatroom "${roomId}" is now ${newStatus ? 'active' : 'inactive'}`);
    return newStatus;
}

/**
 * Get all chatrooms for admin (including inactive)
 */
export async function getAllChatroomsForAdmin(): Promise<Chatroom[]> {
    const q = query(collection(db, "chatrooms"), limit(100));
    const snapshot = await getDocs(q);
    
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Chatroom))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Get featured/pinned chatrooms
 */
export async function getFeaturedChatrooms(): Promise<Chatroom[]> {
    // Simple query without composite index
    const q = query(
        collection(db, "chatrooms"),
        limit(50)
    );
    
    const snapshot = await getDocs(q);
    const rooms = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Chatroom))
        .filter(r => r.isActive === true && r.isPinned === true)
        .sort((a, b) => {
            // Sort by online users first, then by members count
            const onlineDiff = (b.onlineCount || 0) - (a.onlineCount || 0);
            if (onlineDiff !== 0) return onlineDiff;
            return (b.membersCount || 0) - (a.membersCount || 0);
        })
        .slice(0, 10);
    
    return rooms;
}

// ========================================
// MESSAGES
// ========================================

/**
 * Get messages for a chatroom (latest first)
 */
export async function getChatMessages(
    roomId: string,
    limitCount: number = 50
): Promise<ChatMessage[]> {
    const q = query(
        collection(db, "chat_messages"),
        where("roomId", "==", roomId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
        .reverse(); // Reverse to show oldest first
}

/**
 * Subscribe to new messages in a chatroom (real-time)
 */
export function subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 100
): () => void {
    const q = query(
        collection(db, "chat_messages"),
        where("roomId", "==", roomId),
        orderBy("createdAt", "asc"),
        limit(limitCount)
    );
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        } as ChatMessage));
        callback(messages);
    });
}

export interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
    moderationResult?: ModerationResult;
}

/**
 * Send a message to a chatroom WITHOUT moderation
 * Use this ONLY after calling /api/chat/moderate for server-side moderation
 * (Client-side moderation doesn't work because OPENAI_API_KEY isn't available in browser)
 */
export async function sendMessageDirect(
    roomId: string,
    userId: string,
    text: string,
    type: ChatMessage['type'] = 'text',
    imageUrl?: string,
    replyTo?: string,
    senderName?: string
): Promise<SendMessageResult> {
    try {
        const messageId = `${roomId}_${Date.now()}_${userId.slice(0, 8)}`;
        
        const message: Omit<ChatMessage, 'id'> = {
            roomId,
            userId,
            text,
            type,
            createdAt: Date.now(),
        };
        
        if (imageUrl) message.imageUrl = imageUrl;
        if (replyTo) message.replyTo = replyTo;
        
        await setDoc(doc(db, "chat_messages", messageId), message);
        
        // Update room's last message timestamp
        try {
            await updateDoc(doc(db, "chatrooms", roomId), {
                lastMessageAt: Date.now(),
                messagesCount: increment(1),
            });
        } catch (e) {
            console.warn("Could not update room stats:", e);
        }
        
        // Notify members (async, don't wait for it)
        notifyChatroomMembersAsync(roomId, userId, text, senderName);
        
        return {
            success: true,
            messageId,
        };
    } catch (error) {
        console.error("Error sending message:", error);
        return {
            success: false,
            error: 'Nachricht konnte nicht gesendet werden.',
        };
    }
}

/**
 * Send a message to a chatroom with server-side moderation
 * Two-step process:
 * 1. Call /api/chat/moderate for server-side moderation (has OPENAI_API_KEY)
 * 2. If passed, create message directly
 */
export async function sendMessage(
    roomId: string,
    userId: string,
    text: string,
    type: ChatMessage['type'] = 'text',
    imageUrl?: string,
    replyTo?: string,
    senderName?: string
): Promise<SendMessageResult> {
    try {
        // Step 1: Server-side moderation check via API
        const moderationResponse = await fetch('/api/chat/moderate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                text,
                imageUrl,
            }),
        });

        const moderationResult = await moderationResponse.json();

        if (!moderationResult.success) {
            return {
                success: false,
                error: moderationResult.error || 'Nachricht konnte nicht gesendet werden.',
                moderationResult: moderationResult.moderationResult,
            };
        }

        // Step 2: Create message (moderation already passed on server)
        return await sendMessageDirect(roomId, userId, text, type, imageUrl, replyTo, senderName);
        
    } catch (error) {
        console.error("Error sending message:", error);
        return {
            success: false,
            error: 'Nachricht konnte nicht gesendet werden.',
        };
    }
}

/**
 * Async notification helper - doesn't block message sending
 */
async function notifyChatroomMembersAsync(
    roomId: string,
    senderId: string,
    messageText: string,
    senderName?: string
): Promise<void> {
    try {
        // Get room info for the name
        const room = await getChatroom(roomId);
        if (!room) return;
        
        // Import notification function dynamically to avoid circular deps
        const { notifyChatroomMessage } = await import("./notifications");
        
        await notifyChatroomMessage(
            roomId,
            room.name,
            senderId,
            senderName || 'Jemand',
            messageText
        );
    } catch (error) {
        // Don't let notification errors affect message sending
        console.warn("Could not send chatroom notifications:", error);
    }
}

/**
 * Delete a message (soft delete or hard delete)
 */
export async function deleteMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, "chat_messages", messageId));
}

/**
 * Edit a message
 */
export async function editMessage(messageId: string, newText: string): Promise<void> {
    await updateDoc(doc(db, "chat_messages", messageId), {
        text: newText,
        isEdited: true,
        updatedAt: Date.now(),
    });
}

/**
 * Add reaction to a message
 */
export async function addReaction(
    messageId: string,
    emoji: string,
    userId: string
): Promise<void> {
    const docRef = doc(db, "chat_messages", messageId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const message = docSnap.data() as ChatMessage;
    const reactions = message.reactions || {};
    
    if (!reactions[emoji]) {
        reactions[emoji] = [];
    }
    
    if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
    }
    
    await updateDoc(docRef, { reactions });
}

/**
 * Remove reaction from a message
 */
export async function removeReaction(
    messageId: string,
    emoji: string,
    userId: string
): Promise<void> {
    const docRef = doc(db, "chat_messages", messageId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const message = docSnap.data() as ChatMessage;
    const reactions = message.reactions || {};
    
    if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter(id => id !== userId);
        if (reactions[emoji].length === 0) {
            delete reactions[emoji];
        }
    }
    
    await updateDoc(docRef, { reactions });
}

// ========================================
// ROOM MEMBERSHIP
// ========================================

/**
 * Join a chatroom (set online status - temporary visitor)
 */
export async function joinChatroom(roomId: string, userId: string): Promise<void> {
    const memberId = `${roomId}_${userId}`;
    
    try {
        // Check if already a member
        const existingDoc = await getDoc(doc(db, "chatroom_members", memberId));
        if (existingDoc.exists()) {
            // Just update online status
            await updateDoc(doc(db, "chatroom_members", memberId), {
                isOnline: true,
                lastSeenAt: Date.now(),
            });
            
            // Increment online count
            try {
                await updateDoc(doc(db, "chatrooms", roomId), {
                    onlineCount: increment(1),
                });
            } catch (e) {
                console.warn("Could not update online count:", e);
            }
            return;
        }
        
        // Create temporary visitor entry (not a permanent member yet)
        const member: Omit<ChatroomMember, 'id'> = {
            roomId,
            userId,
            isOnline: true,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
            role: 'visitor' as any, // Visitor, not member yet
            notificationsEnabled: false,
        };
        
        await setDoc(doc(db, "chatroom_members", memberId), member);
        
        // Update room online count only (not members count)
        try {
            await updateDoc(doc(db, "chatrooms", roomId), {
                onlineCount: increment(1),
            });
        } catch (e) {
            console.warn("Could not update online count:", e);
        }
    } catch (error) {
        console.error("Error joining chatroom:", error);
    }
}

/**
 * Become a permanent member of a chatroom (enables notifications, shows on profile)
 */
export async function becomeMember(roomId: string, userId: string): Promise<void> {
    const memberId = `${roomId}_${userId}`;
    
    // Check if already exists
    const existingDoc = await getDoc(doc(db, "chatroom_members", memberId));
    
    if (existingDoc.exists()) {
        // Upgrade to member
        await updateDoc(doc(db, "chatroom_members", memberId), {
            role: 'member',
            notificationsEnabled: true,
            memberSince: Date.now(),
        });
    } else {
        // Create new membership
        const member: Omit<ChatroomMember, 'id'> = {
            roomId,
            userId,
            isOnline: true,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
            role: 'member',
            notificationsEnabled: true,
        };
        
        await setDoc(doc(db, "chatroom_members", memberId), member);
    }
    
    // Update room member count
    try {
        await updateDoc(doc(db, "chatrooms", roomId), {
            membersCount: increment(1),
        });
    } catch (e) {
        console.warn("Could not update members count:", e);
    }
}

/**
 * Get membership status for a user in a chatroom
 */
export async function getMembership(roomId: string, userId: string): Promise<ChatroomMember | null> {
    const memberId = `${roomId}_${userId}`;
    
    try {
        const docSnap = await getDoc(doc(db, "chatroom_members", memberId));
        if (!docSnap.exists()) return null;
        
        const data = docSnap.data() as ChatroomMember;
        // Only return if they're a permanent member (not just visitor)
        if (data.role === 'member' || data.role === 'moderator' || data.role === 'owner') {
            return { id: docSnap.id, ...data };
        }
        return null;
    } catch (error) {
        console.error("Error getting membership:", error);
        return null;
    }
}

/**
 * Get all chatrooms a user is a member of
 */
export async function getUserChatrooms(userId: string): Promise<string[]> {
    try {
        const q = query(
            collection(db, "chatroom_members"),
            where("userId", "==", userId),
            limit(50)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs
            .filter(doc => {
                const data = doc.data();
                return data.role === 'member' || data.role === 'moderator' || data.role === 'owner';
            })
            .map(doc => doc.data().roomId);
    } catch (error) {
        console.error("Error getting user chatrooms:", error);
        return [];
    }
}

/**
 * Leave membership (downgrade from member to visitor, or remove completely)
 */
export async function leaveMembership(roomId: string, userId: string): Promise<void> {
    const memberId = `${roomId}_${userId}`;
    
    try {
        const memberDoc = await getDoc(doc(db, "chatroom_members", memberId));
        
        if (!memberDoc.exists()) return;
        
        const data = memberDoc.data();
        const wasMember = data.role === 'member' || data.role === 'moderator' || data.role === 'owner';
        
        // Downgrade to visitor (keep online status tracking)
        await updateDoc(doc(db, "chatroom_members", memberId), {
            role: 'visitor',
            notificationsEnabled: false,
        });
        
        // Decrement member count if they were a member
        if (wasMember) {
            try {
                await updateDoc(doc(db, "chatrooms", roomId), {
                    membersCount: increment(-1),
                });
            } catch (e) {
                console.warn("Could not update members count:", e);
            }
        }
    } catch (error) {
        console.error("Error leaving membership:", error);
        throw error;
    }
}

/**
 * Leave a chatroom (go offline)
 */
export async function leaveChatroom(roomId: string, userId: string): Promise<void> {
    const memberId = `${roomId}_${userId}`;
    
    try {
        // Check if member document exists first
        const memberDoc = await getDoc(doc(db, "chatroom_members", memberId));
        if (memberDoc.exists() && memberDoc.data()?.isOnline) {
            await updateDoc(doc(db, "chatroom_members", memberId), {
                isOnline: false,
                lastSeenAt: Date.now(),
            });
            
            await updateDoc(doc(db, "chatrooms", roomId), {
                onlineCount: increment(-1),
            });
        }
    } catch (error) {
        console.error("Error leaving chatroom:", error);
        // Silently fail - user might not have joined properly
    }
}

/**
 * Get online members in a chatroom
 */
export async function getOnlineMembers(roomId: string): Promise<ChatroomMember[]> {
    const q = query(
        collection(db, "chatroom_members"),
        where("roomId", "==", roomId),
        where("isOnline", "==", true),
        limit(100)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatroomMember));
}

/**
 * Subscribe to online members (real-time)
 */
export function subscribeToOnlineMembers(
    roomId: string,
    callback: (members: ChatroomMember[]) => void
): () => void {
    const q = query(
        collection(db, "chatroom_members"),
        where("roomId", "==", roomId),
        where("isOnline", "==", true),
        limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        } as ChatroomMember));
        callback(members);
    });
}

// ========================================
// SEEDING (For Development)
// ========================================

export async function seedDefaultChatrooms(): Promise<void> {
    const defaultRooms: Omit<Chatroom, 'id'>[] = [
        // German rooms
        {
            name: 'Allgemeiner Chat DE',
            description: 'Der Hauptchat für deutschsprachige Künstler. Willkommen!',
            category: 'general',
            region: 'de',
            emoji: '💬',
            color: '#CCFF00',
            isActive: true,
            isPinned: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        {
            name: 'Digital Art Lounge',
            description: 'Alles rund um digitale Kunst, Software und Tablets.',
            category: 'digital_art',
            region: 'de',
            emoji: '🖥️',
            color: '#FF10F0',
            isActive: true,
            isPinned: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        {
            name: 'Freelance & Business',
            description: 'Tipps für Selbstständige, Preise, Verträge und mehr.',
            category: 'business',
            region: 'de',
            emoji: '💼',
            color: '#00D4FF',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        {
            name: 'Feedback & Kritik',
            description: 'Teile deine Arbeiten und erhalte konstruktives Feedback.',
            category: 'critique',
            region: 'de',
            emoji: '🔍',
            color: '#FFD700',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        {
            name: 'Streetart & Underground',
            description: 'Graffiti, Streetart, Subkultur und alternative Kunst.',
            category: 'subculture',
            region: 'de',
            emoji: '🔥',
            color: '#FF4500',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        
        // Global rooms
        {
            name: 'Global Art Chat',
            description: 'The international hub for artists worldwide. English speaking.',
            category: 'general',
            region: 'global',
            emoji: '🌍',
            color: '#CCFF00',
            isActive: true,
            isPinned: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        {
            name: 'Illustration Station',
            description: 'Share and discuss illustration work from around the world.',
            category: 'illustration',
            region: 'global',
            emoji: '✏️',
            color: '#9B59B6',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        {
            name: 'Collab Corner',
            description: 'Find collaboration partners for your projects.',
            category: 'collab',
            region: 'global',
            emoji: '🤝',
            color: '#2ECC71',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        
        // UK room
        {
            name: 'UK Artists Lounge',
            description: 'For artists based in the United Kingdom.',
            category: 'general',
            region: 'uk',
            emoji: '🇬🇧',
            color: '#3498DB',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        
        // US room
        {
            name: 'US Creatives',
            description: 'American artists unite! Share your work and connect.',
            category: 'general',
            region: 'us',
            emoji: '🇺🇸',
            color: '#E74C3C',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
        
        // French room
        {
            name: 'Café des Artistes',
            description: 'La communauté francophone des artistes.',
            category: 'general',
            region: 'fr',
            emoji: '🇫🇷',
            color: '#1ABC9C',
            isActive: true,
            membersCount: 0,
            onlineCount: 0,
            messagesCount: 0,
            createdAt: Date.now(),
        },
    ];
    
    for (const room of defaultRooms) {
        const roomId = room.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await setDoc(doc(db, "chatrooms", roomId), room);
    }
    
    console.log(`✅ Seeded ${defaultRooms.length} chatrooms`);
}

