"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { BadgeShowcase } from "@/components/ui/BadgeDisplay";
import { DEFAULT_PROFILE_CUSTOMIZATION } from "@/components/ui/ProfileEditor";
import { 
    getFollowerCount, 
    getFollowingCount,
    getFollow, 
    followArtist, 
    unfollowArtist, 
    getArtistPosts,
    getUserRepostsWithPosts,
    getUserLikedPosts,
    Repost
} from "@/lib/feed";
import { getPublicUserBoards, createBoard, addPostToBoard } from "@/lib/boards";
import { getUserProfile } from "@/lib/db";
import { getUserConversations, createConversation } from "@/lib/messages";
import { 
    getProfileComments, 
    addProfileComment, 
    deleteProfileComment 
} from "@/lib/profile-comments";
import { UserProfile, FeedPost, ProfileCustomization, Board, ProfileComment, Conversation, LocalEvent } from "@/types";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { getUserCreatedEvents, getUserAttendingEvents } from "@/lib/local";
import { getUserChallengeStats } from "@/lib/challenges";
import { UserChallengeStats, CHALLENGE_BADGES } from "@/types";

type ProfileTab = 'posts' | 'reposts' | 'likes' | 'media' | 'boards' | 'comments' | 'events';

export default function TumblrStyleProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const { user: currentUser, profile: currentProfile } = useAuth();
    const router = useRouter();
    const t = useTranslations('profile');
    
    // Profile data
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [customization, setCustomization] = useState<ProfileCustomization>(DEFAULT_PROFILE_CUSTOMIZATION);
    
    // Stats
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [dmLoading, setDmLoading] = useState(false);
    
    // Content tabs
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [reposts, setReposts] = useState<(Repost & { originalPost?: FeedPost })[]>([]);
    const [likedPosts, setLikedPosts] = useState<FeedPost[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [contentLoading, setContentLoading] = useState(false);
    
    // Layout
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Board creation
    const [showCreateBoard, setShowCreateBoard] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    
    // Profile comments (guestbook)
    const [profileComments, setProfileComments] = useState<ProfileComment[]>([]);
    const [commentAuthors, setCommentAuthors] = useState<Record<string, UserProfile>>({});
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
    
    // User's conversations (chats they're member of)
    const [userChats, setUserChats] = useState<Conversation[]>([]);
    const [chatPartners, setChatPartners] = useState<Record<string, UserProfile>>({});
    
    // Events (created and attending)
    const [createdEvents, setCreatedEvents] = useState<LocalEvent[]>([]);
    const [attendingEvents, setAttendingEvents] = useState<LocalEvent[]>([]);
    
    // Challenge Stats
    const [challengeStats, setChallengeStats] = useState<UserChallengeStats | null>(null);

    // Fetch profile data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/users/${userId}`);
                if (response.ok) {
                    const profileData = await response.json();
                    setProfile({ id: profileData.uid || userId, ...profileData } as UserProfile);
                    if (profileData.profileCustomization) {
                        setCustomization(profileData.profileCustomization);
                    }
                } else if (response.status === 404) {
                    setLoading(false);
                    return;
                }
                
                // Fetch counts, boards, comments, chats, events, and challenge stats
                const [followers, following, userBoards, comments, chats, created, attending, challengeStatsData] = await Promise.all([
                    getFollowerCount(userId),
                    getFollowingCount(userId),
                    getPublicUserBoards(userId),
                    getProfileComments(userId, 50),
                    getUserConversations(userId).catch(() => []), // May fail if not own profile
                    getUserCreatedEvents(userId).catch(() => []),
                    getUserAttendingEvents(userId).catch(() => []),
                    getUserChallengeStats(userId).catch(() => null)
                ]);
                setFollowerCount(followers);
                setFollowingCount(following);
                setBoards(userBoards);
                setProfileComments(comments);
                setUserChats(chats);
                setCreatedEvents(created);
                setAttendingEvents(attending);
                setChallengeStats(challengeStatsData);
                
                // Fetch comment authors
                const authorIds = [...new Set(comments.map(c => c.authorId))];
                const authors: Record<string, UserProfile> = {};
                for (const authorId of authorIds) {
                    const authorProfile = await getUserProfile(authorId);
                    if (authorProfile) authors[authorId] = authorProfile;
                }
                setCommentAuthors(authors);
                
                // Fetch chat partner profiles
                const partnerIds = new Set<string>();
                chats.forEach(chat => {
                    chat.participants.forEach(p => {
                        if (p !== userId) partnerIds.add(p);
                    });
                });
                const partners: Record<string, UserProfile> = {};
                for (const partnerId of partnerIds) {
                    const partnerProfile = await getUserProfile(partnerId);
                    if (partnerProfile) partners[partnerId] = partnerProfile;
                }
                setChatPartners(partners);
                
                // Fetch initial posts
                const userPosts = await getArtistPosts(userId, 30);
                setPosts(userPosts);
                
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (userId) fetchData();
    }, [userId]);

    // Check follow status
    useEffect(() => {
        const checkFollow = async () => {
            if (currentUser && userId && currentUser.uid !== userId) {
                const follow = await getFollow(currentUser.uid, userId);
                setIsFollowing(!!follow);
            }
        };
        checkFollow();
    }, [currentUser, userId]);

    // Load tab content
    const loadTabContent = useCallback(async (tab: ProfileTab) => {
        if (tab === 'posts' && posts.length > 0) return;
        if (tab === 'boards' && boards.length > 0) return;
        
        setContentLoading(true);
        try {
            switch (tab) {
                case 'posts':
                    const userPosts = await getArtistPosts(userId, 50);
                    setPosts(userPosts);
                    break;
                case 'reposts':
                    const userReposts = await getUserRepostsWithPosts(userId, 50);
                    setReposts(userReposts);
                    break;
                case 'likes':
                    const liked = await getUserLikedPosts(userId, 50);
                    setLikedPosts(liked);
                    break;
                case 'boards':
                    const userBoards = await getPublicUserBoards(userId);
                    setBoards(userBoards);
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tab}:`, error);
        } finally {
            setContentLoading(false);
        }
    }, [userId, posts.length, boards.length]);

    useEffect(() => {
        loadTabContent(activeTab);
    }, [activeTab, loadTabContent]);

    // Follow/Unfollow
    const handleFollowToggle = async () => {
        if (!currentUser) return;
        
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowArtist(currentUser.uid, userId);
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
            } else {
                await followArtist(currentUser.uid, userId);
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleSendDM = async () => {
        if (!currentUser) return;
        
        setDmLoading(true);
        try {
            // Create or get existing conversation
            const conversationId = await createConversation(currentUser.uid, userId);
            // Navigate directly to the conversation
            router.push(`/messages/${conversationId}`);
        } catch (error) {
            console.error("Error creating conversation:", error);
        } finally {
            setDmLoading(false);
        }
    };
    
    // Submit profile comment
    const handleSubmitComment = async () => {
        if (!currentUser || !newComment.trim()) return;
        
        setSubmittingComment(true);
        try {
            const commentId = await addProfileComment(userId, currentUser.uid, newComment.trim());
            
            // Add to local state
            const newCommentObj: ProfileComment = {
                id: commentId,
                profileUserId: userId,
                authorId: currentUser.uid,
                text: newComment.trim(),
                likesCount: 0,
                createdAt: Date.now(),
            };
            setProfileComments(prev => [newCommentObj, ...prev]);
            
            // Add author profile if not already known
            if (!commentAuthors[currentUser.uid] && currentProfile) {
                setCommentAuthors(prev => ({
                    ...prev,
                    [currentUser.uid]: currentProfile
                }));
            }
            
            setNewComment('');
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("Fehler beim Senden des Kommentars.");
        } finally {
            setSubmittingComment(false);
        }
    };
    
    // Delete profile comment
    const handleDeleteComment = async (commentId: string) => {
        if (!currentUser) return;
        
        setDeletingCommentId(commentId);
        try {
            await deleteProfileComment(commentId, currentUser.uid);
            setProfileComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Fehler beim Löschen des Kommentars.");
        } finally {
            setDeletingCommentId(null);
        }
    };

    // Time ago helper
    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'gerade eben';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return new Date(timestamp).toLocaleDateString('de-DE');
    };

    // Get header/banner background style with blur support
    const getHeaderStyle = (): React.CSSProperties => {
        const bg = customization.background;
        const blur = bg.blur || 0;
        const opacity = (bg.opacity ?? 100) / 100;
        
        // First check for cover image (banner)
        if (customization.coverImageUrl) {
            return {
                backgroundImage: `url(${customization.coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: customization.coverImagePosition || 'center',
            };
        }
        
        // Then check background settings
        switch (bg.type) {
            case 'color':
                return { backgroundColor: bg.color || '#1a1a1a' };
            case 'gradient':
                const direction = {
                    'to-right': '90deg',
                    'to-left': '270deg',
                    'to-bottom': '180deg',
                    'to-top': '0deg',
                    'to-br': '135deg',
                    'to-bl': '225deg',
                }[bg.gradient?.direction || 'to-br'];
                return { background: `linear-gradient(${direction}, ${bg.gradient?.colors[0]}, ${bg.gradient?.colors[1]})` };
            case 'image':
                return {
                    backgroundImage: `url(${bg.imageUrl})`,
                    backgroundSize: bg.imageSize || 'cover',
                    backgroundPosition: bg.imagePosition || 'center',
                    backgroundRepeat: 'no-repeat',
                };
            default:
                return { backgroundColor: '#1a1a1a' };
        }
    };

    // Get page background style  
    const getPageStyle = (): React.CSSProperties => {
        const bg = customization.background;
        
        if (bg.type === 'color' && bg.color) {
            return { backgroundColor: bg.color };
        }
        if (bg.type === 'gradient' && bg.gradient) {
            const direction = {
                'to-right': '90deg',
                'to-left': '270deg',
                'to-bottom': '180deg',
                'to-top': '0deg',
                'to-br': '135deg',
                'to-bl': '225deg',
            }[bg.gradient.direction || 'to-br'];
            return { background: `linear-gradient(${direction}, ${bg.gradient.colors[0]}, ${bg.gradient.colors[1]})` };
        }
        return { backgroundColor: '#f5f5f5' };
    };

    const isOwnProfile = currentUser?.uid === userId;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">Lade Profil...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="bg-white border-4 border-black p-8 text-center shadow-comic">
                        <span className="text-6xl">👻</span>
                        <h1 className="text-4xl font-heading mt-4 mb-2">Profil nicht gefunden</h1>
                        <p className="text-gray-600">Dieses Profil existiert nicht.</p>
                        <Link href="/feed">
                            <Button variant="accent" className="mt-6">Zum Feed →</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Content for each tab
    const getContentItems = () => {
        switch (activeTab) {
            case 'posts':
                return posts;
            case 'reposts':
                return reposts.map(r => r.originalPost).filter(Boolean) as FeedPost[];
            case 'likes':
                return likedPosts;
            case 'media':
                return posts.filter(p => p.images && p.images.length > 0);
            default:
                return posts;
        }
    };

    const contentItems = getContentItems();

    // Text color based on customization
    const textColor = customization.textColor || '#000000';
    const linkColor = customization.linkColor || '#FF10F0';
    const accentColor = customization.primaryColor || '#CCFF00';

    return (
        <main className="min-h-screen" style={{ backgroundColor: customization.background.color || '#f3f4f6' }}>
            <Navbar />
            
            {/* Banner / Cover Image */}
            {customization?.showCoverImage && customization?.coverImageUrl ? (
                <div className="h-56 md:h-72 lg:h-80 bg-gray-900 relative overflow-hidden">
                    <img 
                        src={customization.coverImageUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                        style={{ objectPosition: customization.coverImagePosition || 'center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
            ) : (
                <div 
                    className="h-40 md:h-56 lg:h-64"
                    style={{ 
                        background: customization?.background?.gradient 
                            ? `linear-gradient(${customization.background.gradient.direction}, ${customization.background.gradient.colors.join(', ')})`
                            : `linear-gradient(to right, #000, ${accentColor}, #000)`
                    }}
                />
            )}
            
            {/* Profile Header - Schwarzes Band */}
            <div className="bg-black/70 backdrop-blur-md text-white -mt-6 relative z-10">
                <div className="container mx-auto max-w-6xl px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div 
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-white/30 overflow-hidden bg-gray-800 shadow-lg"
                            >
                                {profile.profilePictureUrl ? (
                                    <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div 
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${linkColor})` }}
                                    >
                                        <span className="text-2xl md:text-3xl">
                                            {profile.displayName?.charAt(0).toUpperCase() || "🎨"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg md:text-xl font-heading truncate">{profile.displayName || "Anonymer Künstler"}</h1>
                                {profile.verificationStatus === 'verified' && (
                                    <span className="px-1.5 py-0.5 text-xs border border-white/50" style={{ backgroundColor: accentColor, color: '#000' }}>
                                        ✓
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 text-sm flex-wrap">
                                {profile.username && <span>@{profile.username}</span>}
                                {profile.pronouns && <span className="text-gray-400">• {profile.pronouns}</span>}
                                {profile.location && <span className="text-gray-400 hidden sm:inline">• 📍 {profile.location}</span>}
                            </div>
                            {/* Stats inline */}
                            <div className="flex gap-3 mt-1 text-sm">
                                <span><strong>{posts.length}</strong> <span className="text-gray-400 hidden sm:inline">Posts</span></span>
                                <span><strong>{followerCount}</strong> <span className="text-gray-400 hidden sm:inline">Followers</span></span>
                                <span><strong>{followingCount}</strong> <span className="text-gray-400 hidden sm:inline">Following</span></span>
                            </div>
                        </div>
                        
                        {/* Actions - rechts */}
                        <div className="flex gap-2 flex-shrink-0">
                            {isOwnProfile ? (
                                <Link href="/profile/settings">
                                    <Button variant="secondary" className="text-xs px-3 py-1.5">
                                        ⚙️ Einstellungen
                                    </Button>
                                </Link>
                            ) : currentUser ? (
                                <>
                                    <Button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        variant={isFollowing ? "secondary" : "accent"}
                                        className="text-xs px-3 py-1.5"
                                    >
                                        {followLoading ? '...' : isFollowing ? '✓ Folge ich' : '+ Folgen'}
                                    </Button>
                                    <Button 
                                        onClick={handleSendDM}
                                        disabled={dmLoading}
                                        variant="secondary" 
                                        className="text-xs px-3 py-1.5"
                                    >
                                        {dmLoading ? '...' : '✉️ DM'}
                                    </Button>
                                </>
                            ) : (
                                <Link href="/auth/login">
                                    <Button variant="accent" className="text-xs px-3 py-1.5">
                                        Anmelden
                                    </Button>
                                </Link>
                            )}
                        </div>
                        
                        {/* Badges - Desktop only */}
                        {profile.achievementData?.showcasedBadges && profile.achievementData.showcasedBadges.length > 0 && (
                            <div className="hidden xl:block flex-shrink-0">
                                <BadgeShowcase 
                                    showcasedBadgeIds={profile.achievementData.showcasedBadges}
                                    displayStyle={customization.badgeDisplayStyle === 'hidden' ? 'grid' : (customization.badgeDisplayStyle || 'grid')}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Main Content - Two Column Layout (wie eigenes Profil) */}
            <div className="container mx-auto max-w-6xl px-4 py-6">
                <div className="grid lg:grid-cols-[320px_1fr] gap-6">
                    
                    {/* LEFT SIDEBAR */}
                    <div className="space-y-6">
                        
                        {/* Events Card */}
                        {customization?.sectionVisibility?.events !== false && (
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-heading">📅 EVENTS</h3>
                                    <Link href="/local" className="text-xs hover:underline" style={{ color: accentColor }}>
                                        Alle →
                                    </Link>
                                </div>
                                
                                {createdEvents.length === 0 && attendingEvents.length === 0 ? (
                                    <p className="text-sm text-center py-4 text-gray-500">
                                        Keine Events
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {[...createdEvents, ...attendingEvents].slice(0, 3).map(event => (
                                            <Link 
                                                key={event.id}
                                                href={`/local/event/${event.id}`}
                                                className="block p-3 border-2 border-gray-200 hover:border-black transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{event.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(event.date).toLocaleDateString('de-DE', { 
                                                                day: 'numeric', 
                                                                month: 'short' 
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 ${
                                                        createdEvents.find(e => e.id === event.id) 
                                                            ? 'bg-accent' 
                                                            : 'bg-green-200'
                                                    } border border-black`}>
                                                        {createdEvents.find(e => e.id === event.id) ? 'HOST' : 'GOING'}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Challenge Stats Card */}
                        {customization?.sectionVisibility?.challenges !== false && (
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-heading">🎨 CHALLENGES</h3>
                                    <Link href="/challenges" className="text-xs hover:underline" style={{ color: accentColor }}>
                                        Alle →
                                    </Link>
                                </div>
                                
                                {!challengeStats || challengeStats.totalParticipations === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500">Noch keine Challenge-Teilnahmen</p>
                                        <Link href="/challenges" className="text-xs mt-2 inline-block underline" style={{ color: accentColor }}>
                                            Jetzt mitmachen →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{challengeStats.totalParticipations}</p>
                                                <p className="text-xs text-gray-500">Teilnahmen</p>
                                            </div>
                                            <div className="p-2 border bg-accent">
                                                <p className="font-heading text-lg">{challengeStats.totalWins}</p>
                                                <p className="text-xs">Siege</p>
                                            </div>
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{challengeStats.totalLikesReceived || 0}</p>
                                                <p className="text-xs text-gray-500">Likes</p>
                                            </div>
                                        </div>
                                        
                                        {/* Badges */}
                                        {challengeStats.badges && challengeStats.badges.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">Challenge-Badges</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {challengeStats.badges.map(badgeId => {
                                                        const badge = CHALLENGE_BADGES.find(b => b.id === badgeId);
                                                        if (!badge) return null;
                                                        return (
                                                            <span 
                                                                key={badgeId}
                                                                className="text-lg"
                                                                title={badge.description}
                                                            >
                                                                {badge.emoji}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Recent Challenges */}
                                        {challengeStats.recentChallenges && challengeStats.recentChallenges.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">Letzte Einreichungen</p>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {challengeStats.recentChallenges.slice(0, 6).map((entry, i) => (
                                                        <div 
                                                            key={i}
                                                            className="aspect-square bg-gray-100 border border-black overflow-hidden relative"
                                                        >
                                                            <img 
                                                                src={entry.imageUrl} 
                                                                alt={entry.challengeTitle}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {entry.isWinner && (
                                                                <div className="absolute top-0 right-0 bg-accent text-xs px-1">
                                                                    🏆
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Badges Card */}
                        {customization?.sectionVisibility?.badges !== false && (
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-heading">🏆 BADGES</h3>
                                </div>
                                
                                {!profile.achievementData?.achievements || profile.achievementData.achievements.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500">Noch keine Badges</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {profile.achievementData.showcasedBadges && profile.achievementData.showcasedBadges.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
                                                <BadgeShowcase 
                                                    showcasedBadgeIds={profile.achievementData.showcasedBadges}
                                                    displayStyle="row"
                                                />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{profile.achievementData.achievements.length}</p>
                                                <p className="text-xs text-gray-500">Gesammelt</p>
                                            </div>
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{profile.achievementData?.stats?.totalPoints || 0}</p>
                                                <p className="text-xs text-gray-500">Punkte</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Boards Card */}
                        {customization?.sectionVisibility?.boards !== false && (
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-heading">📌 BOARDS</h3>
                                    <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: accentColor }}>{boards.length}</span>
                                </div>
                                
                                {boards.length === 0 ? (
                                    <p className="text-sm text-center py-4 text-gray-500">
                                        Keine Boards
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {boards.slice(0, 4).map(board => (
                                            <Link 
                                                key={board.id}
                                                href={`/boards/${board.id}`}
                                                className="aspect-square bg-gray-100 border-2 border-black relative overflow-hidden group"
                                            >
                                                {board.coverImageUrl ? (
                                                    <img src={board.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">📌</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <p className="text-white text-xs font-bold text-center px-2">{board.title}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Guestbook Card */}
                        <div 
                            className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                            style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                        >
                            <h3 className="font-heading mb-4">📝 GÄSTEBUCH</h3>
                            
                            {/* Comment Input */}
                            {currentUser ? (
                                <div className="mb-4">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Schreibe einen Kommentar..."
                                        className="w-full p-2 border-2 border-black text-sm resize-none"
                                        rows={2}
                                        maxLength={200}
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-400">{newComment.length}/200</span>
                                        <Button 
                                            variant="accent" 
                                            className="text-xs py-1"
                                            onClick={handleSubmitComment}
                                            disabled={!newComment.trim() || submittingComment}
                                        >
                                            {submittingComment ? '...' : 'Posten'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-gray-50 border text-center text-sm">
                                    <Link href="/auth/login" className="hover:underline" style={{ color: accentColor }}>
                                        Anmelden um zu kommentieren
                                    </Link>
                                </div>
                            )}
                            
                            {profileComments.length === 0 ? (
                                <p className="text-sm text-center py-2 text-gray-500">
                                    Noch keine Kommentare
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {profileComments.slice(0, 5).map(comment => {
                                        const author = commentAuthors[comment.authorId];
                                        return (
                                            <div key={comment.id} className="flex gap-2">
                                                <Link href={`/profile/${comment.authorId}`}>
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 border border-black overflow-hidden flex-shrink-0">
                                                        {author?.profilePictureUrl ? (
                                                            <img src={author.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full text-xs">👤</span>
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/profile/${comment.authorId}`} className="font-bold text-xs hover:underline">
                                                            {author?.displayName || 'Anon'}
                                                        </Link>
                                                        <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm">{comment.text}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* RIGHT - MAIN TIMELINE */}
                    <div className="space-y-4">
                        <div 
                            className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                            style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                        >
                            <h2 className="font-heading text-xl">TIMELINE</h2>
                        </div>
                    
                    {/* Content */}
                        {posts.length === 0 ? (
                            <div className="border-4 border-black shadow-comic p-12 text-center bg-white">
                                <span className="text-6xl">📝</span>
                                <p className="mt-4 font-heading text-xl">Noch keine Posts</p>
                                <p className="mt-2 text-gray-500">
                                    Dieser Künstler hat noch keine Posts geteilt.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post, index) => (
                                    <Link 
                                        key={post.id}
                                        href={`/feed/${post.id}`}
                                        className={`block border-4 border-black shadow-comic overflow-hidden hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white ${
                                            index % 2 === 0 ? 'lg:mr-12' : 'lg:ml-12'
                                        }`}
                                    >
                                        {/* Post Image */}
                                        {post.images && post.images[0] && (
                                            <div className="relative aspect-[4/3] bg-gray-100">
                                                <img 
                                                    src={post.images[0]} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                />
                                                {post.images.length > 1 && (
                                                    <span className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-xs">
                                                        +{post.images.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Post Content */}
                                        <div className="p-4">
                                            <p className="line-clamp-3">{post.text}</p>
                                            
                                            {/* Post Stats */}
                                            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200">
                                                <span className="text-sm text-gray-500">❤️ {post.likesCount}</span>
                                                <span className="text-sm text-gray-500">💬 {post.commentsCount}</span>
                                                <span className="text-sm ml-auto text-gray-500">
                                                    {timeAgo(post.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="h-20" />
            <Footer />
        </main>
    );
}
