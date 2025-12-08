/**
 * VARBE Social Feed System
 * 
 * Instagram-style feed where artists can post updates, sketches, thoughts
 * and link them to their artworks for purchase.
 * 
 * NOW WITH CONTENT MODERATION:
 * - AI-generated art detection (critical for Varbe's anti-AI stance)
 * - Explicit content filtering
 * - Toxicity detection for text
 * - Spam prevention
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
    startAfter,
    increment,
    serverTimestamp,
    DocumentSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FeedPost, FeedLike, FeedComment, Follow, FeedPostType, ModerationResult } from "@/types";
import { moderatePost, moderateText, isUserBanned } from "./moderation";

// ========================================
// FEED POSTS
// ========================================

interface CreatePostData {
    artistId: string;
    type: FeedPostType;
    text: string;
    images?: string[];
    video?: string;
    linkedListingId?: string;
    tags?: string[];
    visibility?: 'public' | 'followers' | 'subscribers';
}

interface CreatePostResult {
    success: boolean;
    postId?: string;
    error?: string;
    moderationResult?: ModerationResult;
    pendingReview?: boolean; // True if post was flagged and needs admin review
    pendingReviewMessage?: string; // Message to show user about pending review
}

export async function createPost(data: CreatePostData): Promise<CreatePostResult> {
    // Check if user is banned
    const banStatus = await isUserBanned(data.artistId);
    if (banStatus.banned) {
        return {
            success: false,
            error: banStatus.expiresAt 
                ? `Dein Konto ist vorübergehend gesperrt bis ${new Date(banStatus.expiresAt).toLocaleDateString('de-DE')}. Grund: ${banStatus.reason}`
                : `Dein Konto ist dauerhaft gesperrt. Grund: ${banStatus.reason}`,
        };
    }

    // Generate temporary content ID for moderation
    const tempContentId = `feed_post_${Date.now()}_${data.artistId.slice(0, 8)}`;

    // Run content moderation on text and images
    const moderationResult = await moderatePost(
        data.text,
        data.images || [],
        'feed_post',
        data.artistId,
        tempContentId,
        'de' // Default to German, could be made dynamic
    );

    // Only block for spam (rate limiting) - everything else gets posted but flagged for review
    if (!moderationResult.passed && moderationResult.reasons.includes('spam')) {
        return {
            success: false,
            error: '📵 Zu viele Beiträge in kurzer Zeit. Bitte warte einen Moment.',
            moderationResult,
        };
    }

    // Determine moderation status
    // - 'approved': No issues found
    // - 'pending_review': Flagged content, needs admin review before being publicly visible
    // - 'pending': Minor concerns, requires review
    const isFlagged = !moderationResult.passed || moderationResult.requiresReview;
    const moderationStatus = isFlagged ? 'pending_review' : 'approved';

    // Build post object, only including defined values (Firestore doesn't accept undefined)
    const post: Record<string, any> = {
        artistId: data.artistId,
        type: data.type,
        text: data.text,
        images: data.images || [],
        visibility: data.visibility || 'public',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: Date.now(),
        // Add moderation status and reasons
        moderationStatus,
        moderationScores: moderationResult.scores,
        moderationReasons: moderationResult.reasons || [],
        // Flag for admin dashboard
        needsAdminReview: isFlagged,
    };
    
    // Only add optional fields if they have values
    if (data.video) post.video = data.video;
    if (data.linkedListingId) post.linkedListingId = data.linkedListingId;
    if (data.tags && data.tags.length > 0) post.tags = data.tags;
    
    const docRef = await addDoc(collection(db, "feed_posts"), post);

    // Build user-friendly message about pending review
    let pendingReviewMessage = '';
    if (isFlagged) {
        const reasonMessages: Record<string, string> = {
            'ai_generated': '🤖 Dein Bild wird auf KI-Generierung geprüft.',
            'explicit_content': '🔞 Dein Beitrag wird auf unangemessene Inhalte geprüft.',
            'violence': '⚠️ Dein Beitrag wird auf gewalttätige Inhalte geprüft.',
            'harassment': '💬 Dein Text wird auf belästigende Sprache geprüft.',
            'hate_speech': '🛑 Dein Text wird auf Hassrede geprüft.',
            'self_harm': '💙 Dein Beitrag enthält sensible Inhalte und wird geprüft.',
            'illicit': '⚠️ Dein Beitrag wird auf problematische Inhalte geprüft.',
        };

        const reasons = moderationResult.reasons
            .filter(r => r !== 'spam')
            .map(r => reasonMessages[r])
            .filter(Boolean);

        pendingReviewMessage = reasons.length > 0 
            ? `📋 Dein Beitrag wurde gepostet, muss aber von einem Admin freigegeben werden:\n${reasons.join('\n')}`
            : '📋 Dein Beitrag wurde gepostet und wird von einem Admin überprüft.';
    }
    
    return {
        success: true,
        postId: docRef.id,
        moderationResult,
        pendingReview: isFlagged,
        pendingReviewMessage: isFlagged ? pendingReviewMessage : undefined,
    };
}

/**
 * Create a post after server-side moderation
 * Use this after calling the /api/feed/create endpoint for server-side moderation
 * (Client-side moderation doesn't work because API keys aren't available in browser)
 */
export async function createPostDirect(
    data: CreatePostData,
    moderationData?: {
        scores?: ModerationResult['scores'];
        needsReview?: boolean;
        status?: string;
        reasons?: string[];
    }
): Promise<{ success: boolean; postId?: string; error?: string; pendingReview?: boolean; pendingReviewMessage?: string }> {
    try {
        const needsReview = moderationData?.needsReview || false;
        const moderationStatus = moderationData?.status || (needsReview ? 'pending_review' : 'approved');
        
        // Build post object
        const post: Record<string, any> = {
            artistId: data.artistId,
            type: data.type,
            text: data.text,
            images: data.images || [],
            visibility: data.visibility || 'public',
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            createdAt: Date.now(),
            moderationStatus,
            moderationScores: moderationData?.scores || {},
            moderationReasons: moderationData?.reasons || [],
            needsAdminReview: needsReview,
        };
        
        // Only add optional fields if they have values
        if (data.video) post.video = data.video;
        if (data.linkedListingId) post.linkedListingId = data.linkedListingId;
        if (data.tags && data.tags.length > 0) post.tags = data.tags;
        
        const docRef = await addDoc(collection(db, "feed_posts"), post);

        // Build pending review message
        let pendingReviewMessage = '';
        if (needsReview && moderationData?.reasons) {
            const reasonMessages: Record<string, string> = {
                'ai_generated': '🤖 Dein Bild wird auf KI-Generierung geprüft.',
                'explicit_content': '🔞 Dein Beitrag wird auf unangemessene Inhalte geprüft.',
                'violence': '⚠️ Dein Beitrag wird auf gewalttätige Inhalte geprüft.',
                'harassment': '💬 Dein Text wird auf belästigende Sprache geprüft.',
                'hate_speech': '🛑 Dein Text wird auf Hassrede geprüft.',
                'self_harm': '💙 Dein Beitrag enthält sensible Inhalte und wird geprüft.',
                'illicit': '⚠️ Dein Beitrag wird auf problematische Inhalte geprüft.',
            };

            const reasons = moderationData.reasons
                .filter(r => r !== 'spam')
                .map(r => reasonMessages[r])
                .filter(Boolean);

            pendingReviewMessage = reasons.length > 0 
                ? `📋 Dein Beitrag wurde gepostet, muss aber von einem Admin freigegeben werden:\n${reasons.join('\n')}`
                : '📋 Dein Beitrag wurde gepostet und wird von einem Admin überprüft.';
        }
        
        return {
            success: true,
            postId: docRef.id,
            pendingReview: needsReview,
            pendingReviewMessage: needsReview ? pendingReviewMessage : undefined,
        };
    } catch (error: any) {
        console.error("Error creating post:", error);
        return {
            success: false,
            error: error.message || 'Post konnte nicht erstellt werden.',
        };
    }
}

export async function getPost(postId: string): Promise<FeedPost | null> {
    const docRef = doc(db, "feed_posts", postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FeedPost;
    }
    return null;
}

export async function updatePost(postId: string, data: Partial<FeedPost>): Promise<void> {
    const docRef = doc(db, "feed_posts", postId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
    });
}

export async function deletePost(postId: string): Promise<void> {
    // Delete the post
    await deleteDoc(doc(db, "feed_posts", postId));
    
    // TODO: Also delete likes and comments for this post
}

// Get public feed (all posts, sorted by newest)
// Filters out posts that are pending admin review
export async function getPublicFeed(
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot,
    currentUserId?: string // Optional: include user's own pending posts
): Promise<{ posts: FeedPost[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(
        collection(db, "feed_posts"),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(limitCount * 2) // Fetch more to account for filtered posts
    );
    
    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    
    // Filter out pending_review posts (unless they belong to the current user)
    const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
    const filteredPosts = allPosts.filter(post => {
        const postData = post as FeedPost & { moderationStatus?: string; needsAdminReview?: boolean };
        // Show post if:
        // 1. It's approved (or has no moderation status - legacy posts)
        // 2. It belongs to the current user (so they can see their pending posts)
        const isApproved = !postData.moderationStatus || postData.moderationStatus === 'approved';
        const isOwnPost = currentUserId && postData.artistId === currentUserId;
        return isApproved || isOwnPost;
    }).slice(0, limitCount);
    
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    return { posts: filteredPosts, lastDoc: newLastDoc };
}

// Get all public posts (for search)
// Filters out posts that are pending admin review
export async function getAllPublicPosts(): Promise<FeedPost[]> {
    const q = query(
        collection(db, "feed_posts"),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(500) // Limit for performance
    );
    
    const snapshot = await getDocs(q);
    const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
    
    // Filter out pending_review posts
    return allPosts.filter(post => {
        const postData = post as FeedPost & { moderationStatus?: string };
        return !postData.moderationStatus || postData.moderationStatus === 'approved';
    });
}

// Get feed from artists the user follows
export async function getFollowingFeed(
    userId: string,
    limitCount: number = 20
): Promise<FeedPost[]> {
    // First get list of followed artists
    const followsQuery = query(
        collection(db, "follows"),
        where("followerId", "==", userId)
    );
    const followsSnapshot = await getDocs(followsQuery);
    const followedIds = followsSnapshot.docs.map(doc => doc.data().followingId);
    
    if (followedIds.length === 0) {
        return [];
    }
    
    // Then get posts from those artists
    // Note: Firestore 'in' query limited to 30 items, may need pagination for users following many artists
    const artistChunks = [];
    for (let i = 0; i < followedIds.length; i += 30) {
        artistChunks.push(followedIds.slice(i, i + 30));
    }
    
    const allPosts: FeedPost[] = [];
    
    for (const chunk of artistChunks) {
        const postsQuery = query(
            collection(db, "feed_posts"),
            where("artistId", "in", chunk),
            where("visibility", "in", ["public", "followers"]),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
        allPosts.push(...posts);
    }
    
    // Sort all posts by date and return top N
    allPosts.sort((a, b) => b.createdAt - a.createdAt);
    return allPosts.slice(0, limitCount);
}

// Get posts by a specific artist
export async function getArtistPosts(
    artistId: string,
    limitCount: number = 20
): Promise<FeedPost[]> {
    const q = query(
        collection(db, "feed_posts"),
        where("artistId", "==", artistId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
}

// Get featured posts (admin-curated)
export async function getFeaturedPosts(limitCount: number = 10): Promise<FeedPost[]> {
    const q = query(
        collection(db, "feed_posts"),
        where("featured", "==", true),
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(limitCount * 2) // Fetch more to account for filtered posts
    );
    
    const snapshot = await getDocs(q);
    const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
    
    // Filter out pending_review posts (featured posts should always be approved)
    return allPosts.filter(post => {
        const postData = post as FeedPost & { moderationStatus?: string };
        return !postData.moderationStatus || postData.moderationStatus === 'approved';
    }).slice(0, limitCount);
}

// ========================================
// LIKES
// ========================================

export async function likePost(postId: string, userId: string): Promise<void> {
    // Check if already liked
    const existingLike = await getLike(postId, userId);
    if (existingLike) return;
    
    // Add like
    await addDoc(collection(db, "feed_likes"), {
        postId,
        userId,
        createdAt: Date.now(),
    });
    
    // Increment like count on post
    const postRef = doc(db, "feed_posts", postId);
    await updateDoc(postRef, {
        likesCount: increment(1),
    });
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
    // Find the like document
    const q = query(
        collection(db, "feed_likes"),
        where("postId", "==", postId),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    // Delete the like
    await deleteDoc(snapshot.docs[0].ref);
    
    // Decrement like count on post
    const postRef = doc(db, "feed_posts", postId);
    await updateDoc(postRef, {
        likesCount: increment(-1),
    });
}

export async function getLike(postId: string, userId: string): Promise<FeedLike | null> {
    const q = query(
        collection(db, "feed_likes"),
        where("postId", "==", postId),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FeedLike;
}

export async function getPostLikes(postId: string, limitCount: number = 50): Promise<FeedLike[]> {
    const q = query(
        collection(db, "feed_likes"),
        where("postId", "==", postId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedLike));
}

// ========================================
// COMMENTS
// ========================================

interface AddCommentResult {
    success: boolean;
    commentId?: string;
    error?: string;
    moderationResult?: ModerationResult;
}

export async function addComment(
    postId: string,
    userId: string,
    text: string,
    parentCommentId?: string
): Promise<AddCommentResult> {
    // Check if user is banned
    const banStatus = await isUserBanned(userId);
    if (banStatus.banned) {
        return {
            success: false,
            error: 'Dein Konto ist gesperrt. Du kannst keine Kommentare verfassen.',
        };
    }

    // Generate temporary content ID for moderation
    const tempContentId = `comment_${Date.now()}_${userId.slice(0, 8)}`;

    // Run content moderation on text
    const moderationResult = await moderateText(
        text,
        'comment',
        userId,
        tempContentId,
        'de'
    );

    // If moderation failed, don't create the comment
    if (!moderationResult.passed) {
        const reasonMessages: Record<string, string> = {
            'harassment': '🛑 Dein Kommentar enthält möglicherweise belästigende Sprache.',
            'hate_speech': '🛑 Dein Kommentar enthält möglicherweise Hassrede.',
            'spam': '📵 Bitte warte einen Moment bevor du weitere Kommentare postest.',
        };

        const errorMessage = moderationResult.details || 
            moderationResult.reasons.map(r => reasonMessages[r] || `Verstoß: ${r}`).join('\n') ||
            'Dein Kommentar konnte nicht veröffentlicht werden.';

        return {
            success: false,
            error: errorMessage,
            moderationResult,
        };
    }

    // Build comment object, only including defined values
    const comment: Record<string, any> = {
        postId,
        userId,
        text,
        likesCount: 0,
        createdAt: Date.now(),
        // Add moderation status
        moderationStatus: moderationResult.requiresReview ? 'pending' : 'approved',
    };
    
    // Only add parentCommentId if it's a reply
    if (parentCommentId) comment.parentCommentId = parentCommentId;
    
    const docRef = await addDoc(collection(db, "feed_comments"), comment);
    
    // Increment comment count on post
    const postRef = doc(db, "feed_posts", postId);
    await updateDoc(postRef, {
        commentsCount: increment(1),
    });
    
    return {
        success: true,
        commentId: docRef.id,
        moderationResult,
    };
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
    await deleteDoc(doc(db, "feed_comments", commentId));
    
    // Decrement comment count on post
    const postRef = doc(db, "feed_posts", postId);
    await updateDoc(postRef, {
        commentsCount: increment(-1),
    });
}

export async function getPostComments(
    postId: string,
    limitCount: number = 50
): Promise<FeedComment[]> {
    const q = query(
        collection(db, "feed_comments"),
        where("postId", "==", postId),
        orderBy("createdAt", "asc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedComment));
}

// ========================================
// FOLLOWS
// ========================================

export async function followArtist(followerId: string, artistId: string): Promise<void> {
    // Check if already following
    const existing = await getFollow(followerId, artistId);
    if (existing) return;
    
    await addDoc(collection(db, "follows"), {
        followerId,
        followingId: artistId,
        notifyOnPost: true,
        createdAt: Date.now(),
    });
}

export async function unfollowArtist(followerId: string, artistId: string): Promise<void> {
    const q = query(
        collection(db, "follows"),
        where("followerId", "==", followerId),
        where("followingId", "==", artistId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
    }
}

export async function getFollow(followerId: string, artistId: string): Promise<Follow | null> {
    const q = query(
        collection(db, "follows"),
        where("followerId", "==", followerId),
        where("followingId", "==", artistId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Follow;
}

export async function getFollowers(artistId: string): Promise<Follow[]> {
    const q = query(
        collection(db, "follows"),
        where("followingId", "==", artistId),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow));
}

export async function getFollowing(userId: string): Promise<Follow[]> {
    const q = query(
        collection(db, "follows"),
        where("followerId", "==", userId),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow));
}

export async function getFollowerCount(artistId: string): Promise<number> {
    const q = query(
        collection(db, "follows"),
        where("followingId", "==", artistId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
}

export async function getFollowingCount(userId: string): Promise<number> {
    const q = query(
        collection(db, "follows"),
        where("followerId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
}

// ========================================
// REPOSTS
// ========================================

export interface Repost {
    id: string;
    originalPostId: string;
    userId: string;
    comment?: string;
    createdAt: number;
}

export async function repostPost(postId: string, userId: string, comment?: string): Promise<string> {
    // Check if already reposted
    const existing = await getRepost(postId, userId);
    if (existing) return existing.id;
    
    // Create repost record
    const repostData: Record<string, any> = {
        originalPostId: postId,
        userId,
        createdAt: Date.now(),
    };
    if (comment) repostData.comment = comment;
    
    const docRef = await addDoc(collection(db, "feed_reposts"), repostData);
    
    // Increment shares count on original post
    const postRef = doc(db, "feed_posts", postId);
    await updateDoc(postRef, {
        sharesCount: increment(1),
    });
    
    return docRef.id;
}

export async function unrepostPost(postId: string, userId: string): Promise<void> {
    const q = query(
        collection(db, "feed_reposts"),
        where("originalPostId", "==", postId),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    await deleteDoc(snapshot.docs[0].ref);
    
    // Decrement shares count on original post
    const postRef = doc(db, "feed_posts", postId);
    await updateDoc(postRef, {
        sharesCount: increment(-1),
    });
}

export async function getRepost(postId: string, userId: string): Promise<Repost | null> {
    const q = query(
        collection(db, "feed_reposts"),
        where("originalPostId", "==", postId),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Repost;
}

export async function getPostReposts(postId: string, limitCount: number = 50): Promise<Repost[]> {
    const q = query(
        collection(db, "feed_reposts"),
        where("originalPostId", "==", postId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Repost));
}

export async function getUserReposts(userId: string, limitCount: number = 50): Promise<Repost[]> {
    const q = query(
        collection(db, "feed_reposts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Repost));
}

// Get reposts with full original post data populated
export async function getUserRepostsWithPosts(userId: string, limitCount: number = 50): Promise<(Repost & { originalPost?: FeedPost })[]> {
    const reposts = await getUserReposts(userId, limitCount);
    
    // Fetch all original posts
    const repostsWithPosts = await Promise.all(
        reposts.map(async (repost) => {
            const originalPost = await getPost(repost.originalPostId);
            return { ...repost, originalPost: originalPost || undefined };
        })
    );
    
    return repostsWithPosts.filter(r => r.originalPost); // Filter out deleted posts
}

// Get user's liked posts
export async function getUserLikedPosts(userId: string, limitCount: number = 50): Promise<FeedPost[]> {
    const q = query(
        collection(db, "feed_likes"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const likes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedLike));
    
    // Fetch all posts
    const posts = await Promise.all(
        likes.map(async (like) => {
            const post = await getPost(like.postId);
            return post;
        })
    );
    
    return posts.filter((p): p is FeedPost => p !== null);
}

// Get combined feed with reposts merged chronologically
export interface FeedItemWithRepost {
    id: string;
    type: 'post' | 'repost';
    createdAt: number;
    post?: FeedPost;
    reposterId?: string;
    repostComment?: string;
}

export async function getCombinedFeed(
    limitCount: number = 50
): Promise<FeedItemWithRepost[]> {
    // Get regular posts
    const { posts } = await getPublicFeed(limitCount);
    
    // Get all reposts (from all users)
    const repostsQuery = query(
        collection(db, "feed_reposts"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    const repostsSnapshot = await getDocs(repostsQuery);
    const reposts = repostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Repost));
    
    // Convert posts to feed items
    const postItems: FeedItemWithRepost[] = posts.map(post => ({
        id: `post-${post.id}`,
        type: 'post',
        createdAt: post.createdAt,
        post,
    }));
    
    // Convert reposts to feed items (fetch original posts)
    const repostItems: FeedItemWithRepost[] = await Promise.all(
        reposts.map(async (repost) => {
            const originalPost = await getPost(repost.originalPostId);
            return {
                id: `repost-${repost.id}`,
                type: 'repost' as const,
                createdAt: repost.createdAt,
                post: originalPost || undefined,
                reposterId: repost.userId,
                repostComment: repost.comment,
            };
        })
    );
    
    // Combine and sort by creation time
    const combined = [...postItems, ...repostItems.filter(r => r.post)]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limitCount);
    
    return combined;
}

// ========================================
// IMAGE UPLOADS
// ========================================

export async function uploadFeedImage(file: File, userId: string): Promise<string> {
    const storageRef = ref(storage, `feed/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

