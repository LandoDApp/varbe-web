"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { Button } from "@/components/ui/Button";
import { BadgeShowcase, BadgeItem } from "@/components/ui/BadgeDisplay";
import { getBadgeById, BADGES } from "@/lib/badges";
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
    const tBadges = useTranslations('badgeNames');
    
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
                        <h1 className="text-4xl font-heading mt-4 mb-2">{t('notFound')}</h1>
                        <p className="text-gray-600">{t('notFoundDesc')}</p>
                        <Link href="/feed">
                            <Button variant="accent" className="mt-6">{t('toFeed')}</Button>
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
            {/* Desktop Navigation */}
            <div className="hidden md:block">
                <Navbar />
            </div>
            
            {/* Mobile Header */}
            <header className="md:hidden h-14 bg-white/90 backdrop-blur-md border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-sticky safe-area-top">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <h1 className="font-heading text-lg uppercase">{profile.username ? `@${profile.username}` : 'PROFIL'}</h1>
                <div className="w-10 h-10" /> {/* Spacer */}
            </header>
            
            {/* Banner / Cover Image */}
            {customization?.showCoverImage && customization?.coverImageUrl ? (
                <div className="h-32 md:h-56 lg:h-72 bg-gray-900 relative overflow-hidden">
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
                    className="h-32 md:h-56 lg:h-64"
                    style={{ 
                        background: customization?.background?.gradient 
                            ? `linear-gradient(${customization.background.gradient.direction}, ${customization.background.gradient.colors.join(', ')})`
                            : `linear-gradient(to right, #000, ${accentColor}, #000)`
                    }}
                />
            )}
            
            {/* ========== MOBILE Profile Header ========== */}
            <div className="md:hidden relative z-10">
                {/* Dark overlay card for profile info */}
                <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-4 -mt-8">
                    <div className="flex items-start gap-4">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0 -mt-12">
                            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-lg">
                                {profile.profilePictureUrl ? (
                                    <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div 
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${linkColor})` }}
                                    >
                                        <span className="text-2xl">
                                            {profile.displayName?.charAt(0).toUpperCase() || "🎨"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-heading truncate text-white">{profile.displayName || t('anonymousArtist')}</h1>
                                {profile.verificationStatus === 'verified' && (
                                    <span className="px-1.5 py-0.5 text-xs border border-white/50" style={{ backgroundColor: accentColor, color: '#000' }}>✓</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 text-sm flex-wrap">
                                {profile.username && <span>@{profile.username}</span>}
                                {profile.pronouns && <span className="text-gray-400">• {profile.pronouns}</span>}
                            </div>
                            {profile.location && (
                                <p className="text-gray-400 text-sm mt-1">📍 {profile.location}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex gap-6 mt-4 mb-4">
                        <div className="text-center">
                            <p className="font-heading text-lg text-white">{posts.length}</p>
                            <p className="text-xs text-gray-400">{t('posts')}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-heading text-lg text-white">{followerCount}</p>
                            <p className="text-xs text-gray-400">{t('followers')}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-heading text-lg text-white">{followingCount}</p>
                            <p className="text-xs text-gray-400">{t('followingCount')}</p>
                        </div>
                    </div>
                    
                    {/* Bio */}
                    {profile.bio && (
                        <p className="text-sm mb-3 line-clamp-3 text-gray-300">{profile.bio}</p>
                    )}
                    
                    {/* Website */}
                    {profile.website && (
                        <div className="mb-4">
                            <a href={profile.website} target="_blank" rel="noopener" className="text-sm flex items-center gap-1" style={{ color: accentColor }}>
                                🔗 {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                        </div>
                    )}
                
                    {/* Action Buttons - Mobile */}
                    <div className="flex gap-2 mb-4">
                        {isOwnProfile ? (
                            <Link href="/profile/settings" className="flex-1">
                                <Button variant="secondary" className="w-full text-sm py-2">
                                    {t('editProfile')}
                                </Button>
                            </Link>
                        ) : currentUser ? (
                            <>
                                <Button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                    variant={isFollowing ? "secondary" : "accent"}
                                    className="flex-1 text-sm py-2"
                                >
                                    {followLoading ? '...' : isFollowing ? `✓ ${t('following')}` : `+ ${t('follow')}`}
                                </Button>
                                <Button 
                                    onClick={handleSendDM}
                                    disabled={dmLoading}
                                    variant="secondary" 
                                    className="text-sm py-2 px-4"
                                >
                                    {dmLoading ? '...' : '✉️'}
                                </Button>
                            </>
                        ) : (
                            <Link href="/auth/login" className="flex-1">
                                <Button variant="accent" className="w-full text-sm py-2">
                                    {t('loginToFollow')}
                                </Button>
                            </Link>
                        )}
                    </div>
                    
                    {/* Showcased Badges - Mobile */}
                    {profile.achievementData?.achievements && profile.achievementData.achievements.length > 0 && (
                        <div className="pt-3 border-t border-white/20">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {profile.achievementData.achievements.slice(0, 6).map(achievement => {
                                    const badge = getBadgeById(achievement.badgeId);
                                    if (!badge) return null;
                                    // Get translated badge name
                                    let badgeName = badge.name;
                                    try {
                                        const translatedName = tBadges(`${badge.id}.name`);
                                        if (translatedName && !translatedName.includes(badge.id)) badgeName = translatedName;
                                    } catch { /* Keep original */ }
                                    return (
                                        <div 
                                            key={achievement.badgeId}
                                            className="flex-shrink-0 flex flex-col items-center gap-1"
                                        >
                                            <div 
                                                className="w-10 h-10 border-2 border-white/50 flex items-center justify-center text-lg bg-white/10"
                                                title={badgeName}
                                            >
                                                {badge.icon}
                                            </div>
                                        </div>
                                    );
                                })}
                                {profile.achievementData.achievements.length > 6 && (
                                    <div className="flex-shrink-0 w-10 h-10 border-2 border-white/30 flex items-center justify-center text-xs text-white/70 bg-white/5">
                                        +{profile.achievementData.achievements.length - 6}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* ========== DESKTOP Profile Header - Schwarzes Band ========== */}
            <div className="hidden md:block bg-black/70 backdrop-blur-md text-white -mt-6 relative z-10">
                <div className="container mx-auto max-w-6xl px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* Profile Picture */}
                        <div className="relative flex-shrink-0">
                            <div 
                                className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-3 border-white/30 overflow-hidden bg-gray-800 shadow-lg"
                            >
                                {profile.profilePictureUrl ? (
                                    <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div 
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${linkColor})` }}
                                    >
                                        <span className="text-2xl lg:text-3xl">
                                            {profile.displayName?.charAt(0).toUpperCase() || "🎨"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg lg:text-xl font-heading truncate">{profile.displayName || t('anonymousArtist')}</h1>
                                {profile.verificationStatus === 'verified' && (
                                    <span className="px-1.5 py-0.5 text-xs border border-white/50" style={{ backgroundColor: accentColor, color: '#000' }}>
                                        ✓
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 text-sm flex-wrap">
                                {profile.username && <span>@{profile.username}</span>}
                                {profile.pronouns && <span className="text-gray-400">• {profile.pronouns}</span>}
                                {profile.location && <span className="text-gray-400">• 📍 {profile.location}</span>}
                            </div>
                            {/* Stats inline */}
                            <div className="flex gap-3 mt-1 text-sm">
                                <span><strong>{posts.length}</strong> <span className="text-gray-400">{t('posts')}</span></span>
                                <span><strong>{followerCount}</strong> <span className="text-gray-400">{t('followers')}</span></span>
                                <span><strong>{followingCount}</strong> <span className="text-gray-400">{t('followingCount')}</span></span>
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                            {isOwnProfile ? (
                                <Link href="/profile/settings">
                                    <Button variant="secondary" className="text-xs px-3 py-1.5">
                                        ⚙️ {t('settings')}
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
                                        {followLoading ? '...' : isFollowing ? `✓ ${t('following')}` : `+ ${t('follow')}`}
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
                                        {t('login')}
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
            
            {/* ========== MOBILE CONTENT - Tab-based layout ========== */}
            <div className="md:hidden pb-nav">
                {/* Mobile Tab Navigation */}
                <div className="sticky top-0 z-40 bg-white border-b-2 border-black">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'posts' as ProfileTab, label: t('posts'), icon: '📝', count: posts.length },
                            { id: 'boards' as ProfileTab, label: 'Boards', icon: '📌', count: boards.length },
                            { id: 'reposts' as ProfileTab, label: 'Reposts', icon: '🔄', count: reposts.length },
                            { id: 'likes' as ProfileTab, label: 'Likes', icon: '❤️', count: likedPosts.length },
                            { id: 'comments' as ProfileTab, label: t('guestbook'), icon: '💬', count: profileComments.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-4 py-3 text-sm font-heading transition-colors relative ${
                                    activeTab === tab.id 
                                        ? 'text-black' 
                                        : 'text-gray-400'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {tab.icon} {tab.label}
                                    {tab.count > 0 && (
                                        <span className="text-xs bg-gray-100 px-1.5 rounded-full">{tab.count}</span>
                                    )}
                                </span>
                                {activeTab === tab.id && (
                                    <div 
                                        className="absolute bottom-0 left-2 right-2 h-1" 
                                        style={{ backgroundColor: accentColor }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Mobile Tab Content */}
                <div className="px-4 py-4 space-y-4">
                    {/* Posts Tab */}
                    {activeTab === 'posts' && (
                        <>
                            {posts.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-4xl">📝</span>
                                    <p className="text-sm text-gray-500 mt-2">{t('noPosts')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1">
                                    {posts.map((post) => (
                                        <Link 
                                            key={post.id}
                                            href={`/feed/${post.id}`}
                                            className="aspect-square overflow-hidden bg-gray-100 relative"
                                        >
                                            {post.images && post.images[0] ? (
                                                <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50">
                                                    <p className="text-[10px] text-center line-clamp-3">{post.text}</p>
                                                </div>
                                            )}
                                            {post.images && post.images.length > 1 && (
                                                <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1">
                                                    +{post.images.length - 1}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Boards Tab */}
                    {activeTab === 'boards' && (
                        <>
                            {boards.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-4xl">📌</span>
                                    <p className="text-sm text-gray-500 mt-2">{t('noBoards')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {boards.map(board => (
                                        <Link 
                                            key={board.id}
                                            href={`/boards/${board.id}`}
                                            className="aspect-square bg-gray-100 border-2 border-black relative overflow-hidden"
                                        >
                                            {board.coverImageUrl ? (
                                                <img src={board.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">📌</div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                                <p className="text-white text-xs font-bold truncate">{board.title}</p>
                                                <p className="text-white/70 text-[10px]">{board.postIds?.length || 0} posts</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Reposts Tab */}
                    {activeTab === 'reposts' && (
                        <>
                            {reposts.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-4xl">🔄</span>
                                    <p className="text-sm text-gray-500 mt-2">{t('noReposts')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1">
                                    {reposts.map((repost) => (
                                        <Link 
                                            key={repost.id}
                                            href={`/feed/${repost.originalPostId}`}
                                            className="aspect-square overflow-hidden bg-gray-100 relative"
                                        >
                                            {repost.originalPost?.images && repost.originalPost.images[0] ? (
                                                <img src={repost.originalPost.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50">
                                                    <span className="text-2xl">🔄</span>
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Likes Tab */}
                    {activeTab === 'likes' && (
                        <>
                            {likedPosts.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-4xl">❤️</span>
                                    <p className="text-sm text-gray-500 mt-2">{t('noLikes')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1">
                                    {likedPosts.map((post) => (
                                        <Link 
                                            key={post.id}
                                            href={`/feed/${post.id}`}
                                            className="aspect-square overflow-hidden bg-gray-100 relative"
                                        >
                                            {post.images && post.images[0] ? (
                                                <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50">
                                                    <p className="text-[10px] text-center line-clamp-3">{post.text}</p>
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Guestbook/Comments Tab */}
                    {activeTab === 'comments' && (
                        <div className="card-comic p-4">
                            {/* Comment Input */}
                            {currentUser ? (
                                <div className="mb-4">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t('writeComment')}
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
                                            {submittingComment ? '...' : t('post')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-gray-50 border text-center text-sm">
                                    <Link href="/auth/login" className="hover:underline" style={{ color: accentColor }}>
                                        {t('loginToComment')}
                                    </Link>
                                </div>
                            )}
                            
                            {profileComments.length === 0 ? (
                                <p className="text-sm text-center py-4 text-gray-500">
                                    {t('noComments')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {profileComments.map(comment => {
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
                    )}
                </div>
            </div>
            
            {/* ========== DESKTOP CONTENT - Two Column Layout ========== */}
            <div className="hidden md:block">
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
                                            {t('allLink')}
                                        </Link>
                                    </div>
                                    
                                    {createdEvents.length === 0 && attendingEvents.length === 0 ? (
                                        <p className="text-sm text-center py-4 text-gray-500">
                                            {t('noEvents')}
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Deduplicate events - prioritize created over attending */}
                                            {(() => {
                                                const seenIds = new Set<string>();
                                                const uniqueEvents = [...createdEvents, ...attendingEvents].filter(event => {
                                                    if (seenIds.has(event.id)) return false;
                                                    seenIds.add(event.id);
                                                    return true;
                                                });
                                                return uniqueEvents.slice(0, 3).map(event => (
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
                                                                {createdEvents.find(e => e.id === event.id) ? t('host') : t('going')}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ));
                                            })()}
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
                                        {t('allLink')}
                                    </Link>
                                </div>
                                
                                {!challengeStats || challengeStats.totalParticipations === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500">{t('noChallengeParticipations')}</p>
                                        <Link href="/challenges" className="text-xs mt-2 inline-block underline" style={{ color: accentColor }}>
                                            {t('joinNow')}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{challengeStats.totalParticipations}</p>
                                                <p className="text-xs text-gray-500">{t('participations')}</p>
                                            </div>
                                            <div className="p-2 border bg-accent">
                                                <p className="font-heading text-lg">{challengeStats.totalWins}</p>
                                                <p className="text-xs">{t('wins')}</p>
                                            </div>
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{challengeStats.totalLikesReceived || 0}</p>
                                                <p className="text-xs text-gray-500">{t('likes')}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Badges */}
                                        {challengeStats.badges && challengeStats.badges.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">{t('challengeBadges')}</p>
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
                                                <p className="text-xs text-gray-500 mb-2">{t('recentSubmissions')}</p>
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
                                    <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: accentColor }}>
                                        {profile.achievementData?.achievements?.length || 0}
                                    </span>
                                </div>
                                
                                {!profile.achievementData?.achievements || profile.achievementData.achievements.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500">{t('noBadges')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Display all unlocked badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {profile.achievementData.achievements.slice(0, 8).map(achievement => {
                                                const badge = getBadgeById(achievement.badgeId);
                                                if (!badge) return null;
                                                return (
                                                    <BadgeItem
                                                        key={achievement.badgeId}
                                                        badge={badge}
                                                        unlocked={true}
                                                        size="sm"
                                                    />
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Show more link if there are more badges */}
                                        {profile.achievementData.achievements.length > 8 && (
                                            <p className="text-xs text-center text-gray-500">
                                                +{profile.achievementData.achievements.length - 8} {t('moreBadges')}
                                            </p>
                                        )}
                                        
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-gray-200">
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{profile.achievementData.achievements.length}</p>
                                                <p className="text-xs text-gray-500">{t('collected')}</p>
                                            </div>
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{profile.achievementData?.stats?.totalPoints || 0}</p>
                                                <p className="text-xs text-gray-500">{t('points')}</p>
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
                                        {t('noBoards')}
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
                            <h3 className="font-heading mb-4">📝 {t('guestbook')}</h3>
                            
                            {/* Comment Input */}
                            {currentUser ? (
                                <div className="mb-4">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t('writeComment')}
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
                                            {submittingComment ? '...' : t('post')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-gray-50 border text-center text-sm">
                                    <Link href="/auth/login" className="hover:underline" style={{ color: accentColor }}>
                                        {t('loginToComment')}
                                    </Link>
                                </div>
                            )}
                            
                            {profileComments.length === 0 ? (
                                <p className="text-sm text-center py-2 text-gray-500">
                                    {t('noComments')}
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
                                <h2 className="font-heading text-xl">{t('timeline')}</h2>
                            </div>
                        
                        {/* Content */}
                            {posts.length === 0 ? (
                                <div className="border-4 border-black shadow-comic p-12 text-center bg-white">
                                    <span className="text-6xl">📝</span>
                                    <p className="mt-4 font-heading text-xl">{t('noPosts')}</p>
                                    <p className="mt-2 text-gray-500">
                                        {t('artistNoPostsYet')}
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
            </div>
            
            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </main>
    );
}
