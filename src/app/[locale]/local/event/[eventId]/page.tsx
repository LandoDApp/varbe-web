"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import { LocalEvent } from "@/types";
import { 
    getLocalEvent,
    registerForEvent,
    unregisterFromEvent,
    isUserRegistered,
    getEventAttendees,
    getEventPosts,
    createEventPost,
    addEventComment,
    getEventPostComments,
    likeEventPost
} from "@/lib/local";
import { useParams } from "next/navigation";

interface EventAttendee {
    uid: string;
    displayName: string;
    profilePictureUrl?: string;
    verificationStatus?: string;
}

interface EventPost {
    id: string;
    eventId: string;
    authorId: string;
    text: string;
    images?: string[];
    isPinned?: boolean;
    likesCount: number;
    commentsCount: number;
    createdAt: number;
}

interface EventComment {
    id: string;
    eventId: string;
    postId: string;
    userId: string;
    text: string;
    parentCommentId?: string;
    likesCount: number;
    createdAt: number;
    // Populated
    user?: {
        displayName: string;
        profilePictureUrl?: string;
    };
}

export default function EventDetailPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const eventId = params.eventId as string;
    
    // Event data
    const [event, setEvent] = useState<LocalEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registering, setRegistering] = useState(false);
    
    // Attendees
    const [attendees, setAttendees] = useState<EventAttendee[]>([]);
    const [showAllAttendees, setShowAllAttendees] = useState(false);
    
    // Posts (Timeline)
    const [posts, setPosts] = useState<EventPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    
    // New post form (for host)
    const [showPostForm, setShowPostForm] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [creatingPost, setCreatingPost] = useState(false);
    
    // Comments
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [postComments, setPostComments] = useState<Record<string, EventComment[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [addingComment, setAddingComment] = useState<string | null>(null);
    
    // Fetch event data
    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                const eventData = await getLocalEvent(eventId);
                if (eventData) {
                    setEvent(eventData);
                    
                    // Check if user is registered
                    if (user) {
                        const registered = await isUserRegistered(eventId, user.uid);
                        setIsRegistered(registered);
                    }
                    
                    // Fetch attendees
                    const attendeesData = await getEventAttendees(eventId);
                    setAttendees(attendeesData);
                    
                    // Fetch posts
                    const postsData = await getEventPosts(eventId);
                    setPosts(postsData);
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, user]);
    
    // Format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric',
            month: 'long', 
            day: 'numeric' 
        });
    };
    
    // Format relative time
    const formatRelativeTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hrs ago`;
        if (days < 7) return `${days} days ago`;
        return new Date(timestamp).toLocaleDateString('en-US');
    };
    
    // Handle registration
    const handleRegister = async () => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
        
        setRegistering(true);
        try {
            if (isRegistered) {
                await unregisterFromEvent(eventId, user.uid);
                setIsRegistered(false);
                setAttendees(prev => prev.filter(a => a.uid !== user.uid));
                if (event) {
                    setEvent({ ...event, attendeesCount: event.attendeesCount - 1 });
                }
            } else {
                await registerForEvent(eventId, user.uid);
                setIsRegistered(true);
                setAttendees(prev => [...prev, {
                    uid: user.uid,
                    displayName: profile?.displayName || 'User',
                    profilePictureUrl: profile?.profilePictureUrl,
                    verificationStatus: profile?.verificationStatus
                }]);
                if (event) {
                    setEvent({ ...event, attendeesCount: event.attendeesCount + 1 });
                }
            }
        } catch (error) {
            console.error("Error handling registration:", error);
        } finally {
            setRegistering(false);
        }
    };
    
    // Create post (host only)
    const handleCreatePost = async () => {
        if (!user || !event || event.hostId !== user.uid) return;
        if (!newPostText.trim()) return;
        
        setCreatingPost(true);
        try {
            const postId = await createEventPost(eventId, user.uid, {
                text: newPostText.trim()
            });
            
            // Add to posts list
            setPosts(prev => [{
                id: postId,
                eventId,
                authorId: user.uid,
                text: newPostText.trim(),
                likesCount: 0,
                commentsCount: 0,
                createdAt: Date.now()
            }, ...prev]);
            
            setNewPostText('');
            setShowPostForm(false);
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Error creating post.");
        } finally {
            setCreatingPost(false);
        }
    };
    
    // Load comments for a post
    const loadComments = async (postId: string) => {
        if (postComments[postId]) return; // Already loaded
        
        try {
            const comments = await getEventPostComments(postId);
            
            // Fetch user data for each comment
            const commentsWithUsers = await Promise.all(
                comments.map(async (comment) => {
                    // Find user in attendees or fetch
                    const attendee = attendees.find(a => a.uid === comment.userId);
                    return {
                        ...comment,
                        user: attendee ? {
                            displayName: attendee.displayName,
                            profilePictureUrl: attendee.profilePictureUrl
                        } : { displayName: 'User' }
                    };
                })
            );
            
            setPostComments(prev => ({
                ...prev,
                [postId]: commentsWithUsers
            }));
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    };
    
    // Toggle comments
    const toggleComments = async (postId: string) => {
        if (expandedPost === postId) {
            setExpandedPost(null);
        } else {
            setExpandedPost(postId);
            await loadComments(postId);
        }
    };
    
    // Add comment
    const handleAddComment = async (postId: string) => {
        if (!user || !isRegistered) {
            alert("You must be registered to comment.");
            return;
        }
        
        const text = newComment[postId]?.trim();
        if (!text) return;
        
        setAddingComment(postId);
        try {
            const commentId = await addEventComment(eventId, postId, user.uid, { text });
            
            // Add to comments
            const newCommentObj: EventComment = {
                id: commentId,
                eventId,
                postId,
                userId: user.uid,
                text,
                likesCount: 0,
                createdAt: Date.now(),
                user: {
                    displayName: profile?.displayName || 'User',
                    profilePictureUrl: profile?.profilePictureUrl
                }
            };
            
            setPostComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newCommentObj]
            }));
            
            // Update comment count
            setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
            ));
            
            setNewComment(prev => ({ ...prev, [postId]: '' }));
        } catch (error: any) {
            console.error("Error adding comment:", error);
            alert(error.message || "Error adding comment.");
        } finally {
            setAddingComment(null);
        }
    };
    
    // Like post
    const handleLikePost = async (postId: string) => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
        
        try {
            await likeEventPost(postId, user.uid);
            // Toggle like in UI (simplified - actual implementation should track liked state)
            setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
            ));
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };
    
    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
                    <p className="font-heading text-xl">Loading Event...</p>
                </div>
                <Footer />
            </main>
        );
    }
    
    if (!event) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
                    <span className="text-6xl mb-4 block">😢</span>
                    <h1 className="font-heading text-2xl mb-2">Event not found</h1>
                    <p className="text-gray-600 mb-6">This event doesn't exist or has been deleted.</p>
                    <Link href="/local">
                        <Button variant="accent">← Back to Local Radar</Button>
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }
    
    const isHost = user?.uid === event.hostId;
    const eventDate = new Date(event.date);
    const isPast = eventDate < new Date();
    const isFull = event.maxAttendees ? event.attendeesCount >= event.maxAttendees : false;
    
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-accent to-accent-pink border-b-4 border-black">
                <div className="container mx-auto max-w-4xl px-4 py-8">
                    {/* Back Link */}
                    <Link href="/local" className="inline-flex items-center gap-2 text-black/70 hover:text-black mb-4 font-body">
                        ← Back to Local Radar
                    </Link>
                    
                    {/* Event Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            {/* Category Badge */}
                            <span className="inline-block px-3 py-1 bg-white border-2 border-black font-heading text-sm mb-3">
                                {event.category === 'exhibition' && '🖼️ Exhibition'}
                                {event.category === 'open_studio' && '🏠 Open Studio'}
                                {event.category === 'workshop' && '🎨 Workshop'}
                                {event.category === 'art_walk' && '🚶 Art Walk'}
                                {event.category === 'meetup' && '☕ Meetup'}
                                {event.category === 'market' && '🛒 Art Market'}
                            </span>
                            
                            <h1 className="text-3xl md:text-4xl font-heading mb-2">{event.title}</h1>
                            
                            {/* Host Info */}
                            <Link href={`/profile/${event.hostId}`} className="inline-flex items-center gap-2 hover:underline">
                                <div className="w-8 h-8 bg-white border-2 border-black rounded-full overflow-hidden">
                                    {event.hostProfilePicture ? (
                                        <img src={event.hostProfilePicture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="flex items-center justify-center h-full text-sm">👤</span>
                                    )}
                                </div>
                                <span className="font-body">Organized by <strong>{event.hostName}</strong></span>
                            </Link>
                        </div>
                        
                        {/* Price & Registration */}
                        <div className="flex flex-col items-end gap-3">
                            <span className={`px-4 py-2 border-3 border-black font-heading text-lg ${
                                event.freeEntry ? 'bg-accent' : 'bg-white'
                            }`}>
                                {event.freeEntry ? '🎫 FREE' : `🎫 ${event.price}€`}
                            </span>
                            
                            {!isPast && (
                                <Button
                                    variant={isRegistered ? 'secondary' : 'accent'}
                                    className="text-lg px-6"
                                    onClick={handleRegister}
                                    disabled={registering || (isFull && !isRegistered)}
                                >
                                    {registering ? '...' : isRegistered ? '✓ REGISTERED' : isFull ? 'FULLY BOOKED' : 'REGISTER'}
                                </Button>
                            )}
                            
                            {isPast && (
                                <span className="px-4 py-2 bg-gray-200 border-2 border-black font-heading text-sm">
                                    EVENT ENDED
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Event Details */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Event Info Card */}
                        <div className="border-4 border-black bg-white shadow-comic p-6">
                            <h2 className="font-heading text-xl mb-4">📋 EVENT DETAILS</h2>
                            
                            <div className="space-y-4">
                                {/* Date & Time */}
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <p className="font-bold">{formatDate(event.date)}</p>
                                        <p className="text-gray-600 font-body">{event.startTime} - {event.endTime}</p>
                                    </div>
                                </div>
                                
                                {/* Location */}
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl">📍</span>
                                    <div>
                                        <p className="font-bold">{event.location.name}</p>
                                        <p className="text-gray-600 font-body">{event.location.address}</p>
                                        <p className="text-gray-500 font-body text-sm">{event.location.city}, {event.location.country}</p>
                                    </div>
                                </div>
                                
                                {/* Attendees */}
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl">👥</span>
                                    <div>
                                        <p className="font-bold">{event.attendeesCount} Attendees</p>
                                        {event.maxAttendees && (
                                            <p className="text-gray-600 font-body text-sm">
                                                {event.maxAttendees - event.attendeesCount} spots available
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Description */}
                            <div className="mt-6 pt-6 border-t-2 border-gray-200">
                                <h3 className="font-heading text-sm mb-2">DESCRIPTION</h3>
                                <p className="text-gray-700 font-body whitespace-pre-wrap">{event.description}</p>
                            </div>
                        </div>
                        
                        {/* Timeline / Posts Section */}
                        <div className="border-4 border-black bg-white shadow-comic">
                            <div className="p-4 border-b-4 border-black bg-gray-50 flex items-center justify-between">
                                <h2 className="font-heading text-xl">📰 TIMELINE</h2>
                                {isHost && (
                                    <Button
                                        variant="accent"
                                        className="text-sm"
                                        onClick={() => setShowPostForm(!showPostForm)}
                                    >
                                        + NEW POST
                                    </Button>
                                )}
                            </div>
                            
                            {/* New Post Form (Host Only) */}
                            {showPostForm && isHost && (
                                <div className="p-4 border-b-4 border-black bg-accent/20">
                                    <textarea
                                        value={newPostText}
                                        onChange={(e) => setNewPostText(e.target.value)}
                                        placeholder="What's new about the event?"
                                        className="w-full p-3 border-3 border-black font-body min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="secondary"
                                            className="text-sm"
                                            onClick={() => setShowPostForm(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="accent"
                                            className="text-sm"
                                            onClick={handleCreatePost}
                                            disabled={creatingPost || !newPostText.trim()}
                                        >
                                            {creatingPost ? 'Posting...' : 'Post'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Posts List */}
                            <div className="divide-y-4 divide-black">
                                {posts.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <span className="text-4xl mb-2 block">📭</span>
                                        <p className="text-gray-500 font-body">No posts yet.</p>
                                        {isHost && (
                                            <p className="text-gray-400 font-body text-sm mt-1">
                                                Create the first post for your attendees!
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    posts.map((post) => (
                                        <div key={post.id} className="p-4">
                                            {/* Post Header */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <Link href={`/profile/${post.authorId}`}>
                                                    <div className="w-10 h-10 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                                                        {event.hostProfilePicture ? (
                                                            <img src={event.hostProfilePicture} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full">👤</span>
                                                        )}
                                                    </div>
                                                </Link>
                                                <div>
                                                    <Link href={`/profile/${post.authorId}`} className="font-bold hover:underline">
                                                        {event.hostName}
                                                    </Link>
                                                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-accent border border-black font-heading">ORGANIZER</span>
                                                    <p className="text-xs text-gray-500 font-body">{formatRelativeTime(post.createdAt)}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Post Content */}
                                            <p className="text-gray-800 font-body whitespace-pre-wrap mb-3">{post.text}</p>
                                            
                                            {/* Post Images */}
                                            {post.images && post.images.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    {post.images.map((img, idx) => (
                                                        <img key={idx} src={img} alt="" className="w-full h-32 object-cover border-2 border-black" />
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Post Actions */}
                                            <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                                                <button
                                                    onClick={() => handleLikePost(post.id)}
                                                    className="flex items-center gap-1.5 text-gray-500 hover:text-accent transition-colors font-body text-sm"
                                                >
                                                    ❤️ {post.likesCount}
                                                </button>
                                                <button
                                                    onClick={() => toggleComments(post.id)}
                                                    className="flex items-center gap-1.5 text-gray-500 hover:text-accent transition-colors font-body text-sm"
                                                >
                                                    💬 {post.commentsCount} Comments
                                                </button>
                                            </div>
                                            
                                            {/* Comments Section */}
                                            {expandedPost === post.id && (
                                                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                                                    {/* Comments List */}
                                                    <div className="space-y-3 mb-4">
                                                        {postComments[post.id]?.map((comment) => (
                                                            <div key={comment.id} className="flex gap-3">
                                                                <div className="w-8 h-8 bg-gray-100 border border-black rounded-full overflow-hidden flex-shrink-0">
                                                                    {comment.user?.profilePictureUrl ? (
                                                                        <img src={comment.user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="flex items-center justify-center h-full text-xs">👤</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 bg-gray-50 border border-gray-200 p-2 rounded">
                                                                    <p className="font-bold text-sm">{comment.user?.displayName}</p>
                                                                    <p className="text-gray-700 font-body text-sm">{comment.text}</p>
                                                                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(comment.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        {(!postComments[post.id] || postComments[post.id].length === 0) && (
                                                            <p className="text-gray-400 text-sm font-body text-center py-2">
                                                                No comments yet. Be the first!
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Add Comment */}
                                                    {isRegistered ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={newComment[post.id] || ''}
                                                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                                placeholder="Write a comment..."
                                                                className="flex-1 px-3 py-2 border-2 border-black font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleAddComment(post.id);
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                variant="accent"
                                                                className="text-sm px-4"
                                                                onClick={() => handleAddComment(post.id)}
                                                                disabled={addingComment === post.id || !newComment[post.id]?.trim()}
                                                            >
                                                                {addingComment === post.id ? '...' : '→'}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-gray-500 text-sm font-body bg-gray-100 p-3 border border-gray-200">
                                                            🔒 You must be registered for the event to comment.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        
                        {/* Attendees Card */}
                        <div className="border-4 border-black bg-white shadow-comic">
                            <div className="p-4 border-b-2 border-black bg-gray-50">
                                <h3 className="font-heading">👥 ATTENDEES ({event.attendeesCount})</h3>
                            </div>
                            <div className="p-4">
                                {attendees.length === 0 ? (
                                    <p className="text-gray-500 text-sm font-body text-center py-4">
                                        No attendees yet. Be the first!
                                    </p>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {(showAllAttendees ? attendees : attendees.slice(0, 8)).map((attendee) => (
                                                <Link 
                                                    key={attendee.uid}
                                                    href={`/profile/${attendee.uid}`}
                                                    className="flex items-center gap-3 hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                                                        {attendee.profilePictureUrl ? (
                                                            <img src={attendee.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full">👤</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{attendee.displayName}</p>
                                                        {attendee.verificationStatus === 'verified' && (
                                                            <span className="text-[10px] text-green-600">✓ Verified</span>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                        
                                        {attendees.length > 8 && (
                                            <button
                                                onClick={() => setShowAllAttendees(!showAllAttendees)}
                                                className="w-full mt-4 py-2 text-sm font-heading text-center border-2 border-black hover:bg-gray-100 transition-colors"
                                            >
                                                {showAllAttendees ? 'SHOW LESS' : `SHOW ALL ${attendees.length}`}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Share Card */}
                        <div className="border-4 border-black bg-white shadow-comic p-4">
                            <h3 className="font-heading mb-3">🔗 SHARE</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link copied!');
                                    }}
                                    className="flex-1 py-2 border-2 border-black bg-gray-100 hover:bg-gray-200 font-heading text-sm transition-colors"
                                >
                                    📋 COPY LINK
                                </button>
                            </div>
                        </div>
                        
                        {/* Host Actions (if host) */}
                        {isHost && (
                            <div className="border-4 border-black bg-accent/20 shadow-comic p-4">
                                <h3 className="font-heading mb-3">⚙️ MANAGE EVENT</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowPostForm(true)}
                                        className="w-full py-2 border-2 border-black bg-accent hover:bg-accent/80 font-heading text-sm transition-colors"
                                    >
                                        + CREATE NEW POST
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <Footer />
        </main>
    );
}

