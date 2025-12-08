import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc, limit, Timestamp } from "firebase/firestore";
import { Message, Conversation, ModerationResult } from "@/types";
import { createNotification } from "./notifications";
import { getUserProfile } from "./db";

/**
 * Create a new conversation between two users
 */
export const createConversation = async (
    participant1Id: string,
    participant2Id: string,
    listingId?: string
): Promise<string> => {
    // Check if conversation already exists
    const existingQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", participant1Id)
    );
    const existing = await getDocs(existingQuery);
    
    const existingConv = existing.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(participant1Id) && 
               data.participants.includes(participant2Id) &&
               (!listingId || data.listingId === listingId);
    });

    if (existingConv) {
        return existingConv.id;
    }

    // Create new conversation
    const convData: Omit<Conversation, "id"> = {
        participants: [participant1Id, participant2Id],
        listingId: listingId || null,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
        unreadCount: {
            [participant1Id]: 0,
            [participant2Id]: 0,
        },
    };

    const convRef = await addDoc(collection(db, "conversations"), convData);
    return convRef.id;
};

interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
    moderationResult?: ModerationResult;
}

/**
 * Send a message in a conversation with server-side content moderation
 * Two-step process:
 * 1. Call /api/dm/moderate for server-side moderation (has OPENAI_API_KEY)
 * 2. If passed, create message directly
 */
export const sendMessage = async (
    conversationId: string,
    senderId: string,
    content: string,
    images?: string[]
): Promise<SendMessageResult> => {
    // Verify sender is part of conversation
    const convRef = doc(db, "conversations", conversationId);
    const convSnap = await getDoc(convRef);

    if (!convSnap.exists()) {
        return {
            success: false,
            error: "Konversation nicht gefunden",
        };
    }

    const conv = convSnap.data() as Conversation;
    if (!conv.participants.includes(senderId)) {
        return {
            success: false,
            error: "Du bist nicht Teil dieser Konversation",
        };
    }

    // Step 1: Server-side moderation check via API (has OPENAI_API_KEY)
    try {
        const moderationResponse = await fetch('/api/dm/moderate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId,
                content,
                images,
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
    } catch (moderationError) {
        console.error("DM moderation API error:", moderationError);
        // If moderation API fails, still try to send (fallback behavior)
        // You could also return an error here to be stricter
    }

    // Step 2: Create message (moderation passed or fallback)
    const messageData: Omit<Message, "id"> = {
        conversationId,
        senderId,
        content,
        images: images || [],
        read: false,
        createdAt: Date.now(),
    };

    const messageRef = await addDoc(collection(db, "messages"), messageData);

    // Update conversation
    const otherParticipantId = conv.participants.find(id => id !== senderId)!;
    await updateDoc(convRef, {
        lastMessageAt: Date.now(),
        [`unreadCount.${otherParticipantId}`]: (conv.unreadCount[otherParticipantId] || 0) + 1,
    });

    // Notify recipient
    try {
        // Get sender profile for personalized notification
        const senderProfile = await getUserProfile(senderId);
        const senderName = senderProfile?.displayName || "Jemand";
        
        const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
        
        await createNotification(
            otherParticipantId,
            'new_message',
            `💬 Neue Nachricht von ${senderName}`,
            messagePreview,
            undefined,
            conv.listingId || undefined,
            `/messages/${conversationId}`
        );
    } catch (error) {
        console.error("Error creating message notification:", error);
        // Don't fail message sending if notification fails
    }

    return {
        success: true,
        messageId: messageRef.id,
    };
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
    const conversationsRef = collection(db, "conversations");
    const q = query(
        conversationsRef,
        where("participants", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Conversation));
};

/**
 * Get messages in a conversation
 */
export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    limitCount: number = 50
): Promise<Message[]> => {
    // Verify user is part of conversation
    const convRef = doc(db, "conversations", conversationId);
    const convSnap = await getDoc(convRef);

    if (!convSnap.exists()) {
        throw new Error("Conversation not found");
    }

    const conv = convSnap.data() as Conversation;
    if (!conv.participants.includes(userId)) {
        throw new Error("Unauthorized: You are not part of this conversation");
    }

    // Get messages
    const messagesRef = collection(db, "messages");
    const q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Message));

    // Mark messages as read
    const unreadMessages = messages.filter(m => !m.read && m.senderId !== userId);
    if (unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
            await updateDoc(doc(db, "messages", msg.id), {
                read: true,
            });
        }

        // Update conversation unread count
        await updateDoc(convRef, {
            [`unreadCount.${userId}`]: 0,
        });
    }

    return messages.reverse(); // Return in chronological order
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (
    conversationId: string,
    userId: string
): Promise<void> => {
    const convRef = doc(db, "conversations", conversationId);
    const convSnap = await getDoc(convRef);

    if (!convSnap.exists()) {
        throw new Error("Conversation not found");
    }

    const conv = convSnap.data() as Conversation;
    if (!conv.participants.includes(userId)) {
        throw new Error("Unauthorized");
    }

    // Mark all messages as read
    const messagesRef = collection(db, "messages");
    const q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        where("read", "==", false),
        where("senderId", "!=", userId)
    );

    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
    );

    await Promise.all(batch);

    // Update conversation
    await updateDoc(convRef, {
        [`unreadCount.${userId}`]: 0,
    });
};

