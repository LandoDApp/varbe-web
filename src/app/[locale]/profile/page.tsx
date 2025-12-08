"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { BadgeShowcase } from "@/components/ui/BadgeDisplay";
import { DEFAULT_PROFILE_CUSTOMIZATION } from "@/components/ui/ProfileEditor";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, Link } from "@/i18n/routing";
import { useEffect, useState, useRef } from "react";
import { 
    getArtistPosts, 
    getFollowerCount,
    getFollowingCount,
} from "@/lib/feed";
import { getUserBoards } from "@/lib/boards";
import { uploadProfilePicture, updateProfilePicture, getUserProfile } from "@/lib/db";
import { getProfileComments, addProfileComment, deleteProfileComment } from "@/lib/profile-comments";
import { FeedPost, ProfileCustomization, Board, ProfileComment, UserProfile, LocalEvent, Chatroom, Challenge } from "@/types";
import { useTranslations } from 'next-intl';
import { getUserCreatedEvents, getUserAttendingEvents } from "@/lib/local";
import { getUserChatrooms, getChatroom, CHATROOM_CATEGORIES } from "@/lib/chatrooms";
// Note: Challenge fetching removed - API needs extension
// import { getUserChallengeStats, getChallenge } from "@/lib/challenges";
import { BADGES, getBadgeById } from "@/lib/badges";

type ProfileTab = 'posts' | 'boards' | 'badges' | 'events' | 'about';

export default function MyProfilePage() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const router = useRouter();
    const t = useTranslations('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Profile customization
    const [customization, setCustomization] = useState<ProfileCustomization>(DEFAULT_PROFILE_CUSTOMIZATION);
    
    // Content
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    
    // Events, Chatrooms, Challenges
    const [createdEvents, setCreatedEvents] = useState<LocalEvent[]>([]);
    const [attendingEvents, setAttendingEvents] = useState<LocalEvent[]>([]);
    const [userChatrooms, setUserChatrooms] = useState<Chatroom[]>([]);
    const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
    
    // Profile comments
    const [profileComments, setProfileComments] = useState<ProfileComment[]>([]);
    const [commentAuthors, setCommentAuthors] = useState<Record<string, UserProfile>>({});
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    
    // UI State
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!loading && user && profile && !profile.username) {
            router.push("/auth/setup-username");
        }
    }, [user, profile, loading, router]);

    useEffect(() => {
        if (profile?.profileCustomization) {
            setCustomization(profile.profileCustomization);
        }
    }, [profile]);

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                const [
                    userPosts, 
                    followers, 
                    following, 
                    userBoards, 
                    comments,
                    created,
                    attending,
                    chatroomIds
                ] = await Promise.all([
                    getArtistPosts(user.uid, 30),
                    getFollowerCount(user.uid),
                    getFollowingCount(user.uid),
                    getUserBoards(user.uid),
                    getProfileComments(user.uid, 20),
                    getUserCreatedEvents(user.uid).catch(() => []),
                    getUserAttendingEvents(user.uid).catch(() => []),
                    getUserChatrooms(user.uid).catch(() => [])
                ]);
                
                setPosts(userPosts);
                setFollowerCount(followers);
                setFollowingCount(following);
                setBoards(userBoards);
                setProfileComments(comments);
                setCreatedEvents(created);
                setAttendingEvents(attending);
                
                // Fetch chatroom details
                const chatrooms: Chatroom[] = [];
                for (const roomId of chatroomIds) {
                    const room = await getChatroom(roomId);
                    if (room) chatrooms.push(room);
                }
                setUserChatrooms(chatrooms);
                
                // Fetch challenge stats (challenges list not available yet)
                // Note: getUserChallengeStats returns stats, not challenge IDs
                // For now, userChallenges will remain empty until API is extended
                
                // Fetch comment authors
                const authorIds = [...new Set(comments.map(c => c.authorId))];
                const authors: Record<string, UserProfile> = {};
                for (const authorId of authorIds) {
                    const authorProfile = await getUserProfile(authorId);
                    if (authorProfile) authors[authorId] = authorProfile;
                }
                setCommentAuthors(authors);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };
        
        fetchData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        
        setUploadingPicture(true);
        try {
            const url = await uploadProfilePicture(file, user.uid);
            await updateProfilePicture(user.uid, url);
            await refreshProfile();
        } catch (error) {
            console.error("Error uploading picture:", error);
        } finally {
            setUploadingPicture(false);
        }
    };

    const handleAddComment = async () => {
        if (!user || !newComment.trim()) return;
        
        setSubmittingComment(true);
        try {
            await addProfileComment(user.uid, user.uid, newComment.trim());
            const comments = await getProfileComments(user.uid, 20);
            setProfileComments(comments);
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

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

    // Loading State
    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <div className="hidden md:block"><Navbar /></div>
                
                {/* Mobile Header Skeleton */}
                <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-sticky">
                    <div className="w-10 h-10 skeleton rounded" />
                    <div className="h-6 w-24 skeleton" />
                    <div className="w-10 h-10 skeleton rounded" />
                </header>
                
                {/* Cover Skeleton */}
                <div className="h-32 md:h-56 skeleton" />
                
                {/* Profile Header Skeleton */}
                <div className="px-4 -mt-12 md:-mt-16">
                    <div className="flex items-end gap-4">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full skeleton border-4 border-white" />
                        <div className="flex-1 pb-2">
                            <div className="h-6 w-32 skeleton mb-2" />
                            <div className="h-4 w-24 skeleton" />
                        </div>
                    </div>
                </div>
                
                <MobileBottomNav />
            </main>
        );
    }

    if (!user || !profile) return null;

    const accentColor = customization?.primaryColor || '#CCFF00';
    const bgColor = customization?.background?.color || '#fafafa';
    // Determine if background is dark to set text color accordingly
    const isDarkBg = bgColor && (bgColor.toLowerCase() === '#000000' || bgColor.toLowerCase() === '#000' || bgColor === '#1a1a1a' || bgColor === '#111111');
    const textColor = isDarkBg ? '#ffffff' : '#000000';
    const mutedTextColor = isDarkBg ? '#a0a0a0' : '#666666';
    const allEvents = [...createdEvents, ...attendingEvents];
    const userBadges = profile.achievementData?.achievements || [];
    const showcasedBadgeIds = profile.achievementData?.showcasedBadges || [];

    // Profile Tabs
    const tabs: { id: ProfileTab; icon: string; label: string }[] = [
        { id: 'posts', icon: '📝', label: 'Posts' },
        { id: 'boards', icon: '📌', label: 'Boards' },
        { id: 'badges', icon: '🏆', label: 'Badges' },
        { id: 'events', icon: '📅', label: 'Events' },
        { id: 'about', icon: '👤', label: 'Info' },
    ];

    return (
        <main className="min-h-screen" style={{ backgroundColor: bgColor }}>
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
                <Link 
                    href="/profile/settings"
                    className="w-10 h-10 flex items-center justify-center"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                </Link>
            </header>
            
            {/* Cover Image - Mobile Optimized */}
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
            
            {/* Profile Header - Mobile First */}
            <div className="px-4 -mt-12 md:-mt-16 relative z-10" style={{ color: textColor }}>
                <div className="flex items-end gap-4">
                    {/* Profile Picture */}
                    <div className="relative group flex-shrink-0">
                        <div 
                            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200 cursor-pointer shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {profile.profilePictureUrl ? (
                                <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center h-full text-4xl md:text-5xl">👤</span>
                            )}
                            {uploadingPicture && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                             onClick={() => fileInputRef.current?.click()}>
                            <span className="text-white text-lg">📷</span>
                        </div>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handlePictureUpload}
                            className="hidden"
                        />
                    </div>
                    
                    {/* Profile Info - Mobile */}
                    <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl md:text-2xl font-heading truncate" style={{ color: textColor }}>{profile.displayName}</h1>
                            {profile.verificationStatus === 'verified' && (
                                <span className="px-1.5 py-0.5 text-xs border-2 border-black bg-accent text-black">✓</span>
                            )}
                        </div>
                        {profile.username && (
                            <p className="text-sm" style={{ color: mutedTextColor }}>@{profile.username}</p>
                        )}
                    </div>
                </div>
                
                {/* Stats Row - Mobile */}
                <div className="flex gap-6 mt-4 mb-4">
                    <div className="text-center">
                        <p className="font-heading text-lg md:text-xl" style={{ color: textColor }}>{posts.length}</p>
                        <p className="text-xs" style={{ color: mutedTextColor }}>Posts</p>
                    </div>
                    <div className="text-center">
                        <p className="font-heading text-lg md:text-xl" style={{ color: textColor }}>{followerCount}</p>
                        <p className="text-xs" style={{ color: mutedTextColor }}>Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="font-heading text-lg md:text-xl" style={{ color: textColor }}>{followingCount}</p>
                        <p className="text-xs" style={{ color: mutedTextColor }}>Following</p>
                    </div>
                </div>
                
                {/* Bio & Location */}
                {profile.bio && (
                    <p className="text-sm mb-2 line-clamp-3" style={{ color: mutedTextColor }}>{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm mb-4" style={{ color: mutedTextColor }}>
                    {profile.location && (
                        <span className="flex items-center gap-1">📍 {profile.location}</span>
                    )}
                    {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener" className="flex items-center gap-1" style={{ color: accentColor }}>
                            🔗 {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                </div>
                
                {/* Action Buttons - Mobile */}
                <div className="flex gap-2 mb-4 md:hidden">
                    <Link href="/profile/settings" className="flex-1">
                        <Button variant="secondary" className="w-full text-sm py-2">
                            Profil bearbeiten
                        </Button>
                    </Link>
                    <Button variant="ghost" className="text-sm py-2 px-4" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
                
                {/* Showcased Badges */}
                {showcasedBadgeIds.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                        {showcasedBadgeIds.slice(0, 5).map(badgeId => {
                            const badge = getBadgeById(badgeId);
                            if (!badge) return null;
                            return (
                                <div 
                                    key={badgeId}
                                    className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-lg bg-white flex-shrink-0"
                                    title={badge.name}
                                >
                                    {badge.icon}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* ========== MOBILE LAYOUT - Tabs ========== */}
            <div className="md:hidden">
                {/* Tabs - Mobile Horizontal Scroll */}
                <div className="border-y-4 border-black bg-white sticky top-14 z-sticky">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[80px] py-3 flex flex-col items-center gap-1 transition-colors ${
                                    activeTab === tab.id 
                                        ? 'border-b-4 border-accent bg-accent/10' 
                                        : 'border-b-4 border-transparent hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                <span className="text-xs font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Tab Content - Mobile */}
                <div className="px-4 py-4 pb-nav">
                    {/* Posts Tab */}
                    {activeTab === 'posts' && (
                        <div>
                            {profile.verificationStatus === 'verified' && (
                                <Link href="/feed/create" className="block mb-4">
                                    <div className="card-comic p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-xl">✏️</div>
                                        <span className="font-heading text-sm">NEUEN POST ERSTELLEN</span>
                                    </div>
                                </Link>
                            )}
                            
                            {posts.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-5xl mb-4 block">📝</span>
                                    <p className="font-heading text-lg mb-2">Noch keine Posts</p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {profile.verificationStatus === 'verified' 
                                            ? 'Teile deinen ersten Post mit der Community!'
                                            : 'Verifiziere dich als Künstler um Posts zu erstellen.'}
                                    </p>
                                    {profile.verificationStatus !== 'verified' && (
                                        <Link href="/artist/verify">
                                            <Button variant="accent" size="sm">Künstler werden →</Button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {posts.map((post) => (
                                        <Link 
                                            key={post.id}
                                            href={`/feed/${post.id}`}
                                            className="aspect-square border-3 border-black overflow-hidden bg-gray-100 relative group"
                                        >
                                            {post.images && post.images[0] ? (
                                                <img src={post.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-2">
                                                    <p className="text-xs text-center line-clamp-4">{post.text}</p>
                                                </div>
                                            )}
                                            {post.images && post.images.length > 1 && (
                                                <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5">
                                                    +{post.images.length - 1}
                                                </span>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                <div className="flex gap-2 text-white text-xs">
                                                    <span>❤️ {post.likesCount}</span>
                                                    <span>💬 {post.commentsCount}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Boards Tab */}
                    {activeTab === 'boards' && (
                        <div>
                            {boards.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-5xl mb-4 block">📌</span>
                                    <p className="font-heading text-lg mb-2">Keine Boards</p>
                                    <p className="text-sm text-gray-600">Speichere Inspiration in Boards!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {boards.map((board) => (
                                        <Link 
                                            key={board.id}
                                            href={`/boards/${board.id}`}
                                            className="aspect-square border-3 border-black overflow-hidden bg-gray-100 relative group"
                                        >
                                            {board.coverImageUrl ? (
                                                <img src={board.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">📌</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p className="text-white text-sm font-bold text-center px-2">{board.title}</p>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                                <p className="text-white text-xs font-bold truncate">{board.title}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Badges Tab */}
                    {activeTab === 'badges' && (
                        <div>
                            <div className="card-comic p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-heading text-2xl">{userBadges.length}</p>
                                        <p className="text-xs text-gray-600">Badges gesammelt</p>
                                    </div>
                                    <div>
                                        <p className="font-heading text-2xl">{profile.achievementData?.stats?.totalPoints || 0}</p>
                                        <p className="text-xs text-gray-600">Punkte</p>
                                    </div>
                                </div>
                            </div>
                            
                            {userBadges.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-5xl mb-4 block">🏆</span>
                                    <p className="font-heading text-lg mb-2">Noch keine Badges</p>
                                    <p className="text-sm text-gray-600 mb-4">Sammle Badges durch Aktivität!</p>
                                    <Link href="/badges">
                                        <Button variant="accent" size="sm">Alle Badges ansehen</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {userBadges.map((achievement) => {
                                        const badge = getBadgeById(achievement.badgeId);
                                        if (!badge) return null;
                                        return (
                                            <div 
                                                key={achievement.badgeId}
                                                className="card-comic p-3 text-center"
                                            >
                                                <span className="text-3xl block mb-2">{badge.icon}</span>
                                                <p className="font-heading text-xs truncate">{badge.name}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div>
                            {allEvents.length === 0 ? (
                                <div className="card-comic p-8 text-center">
                                    <span className="text-5xl mb-4 block">📅</span>
                                    <p className="font-heading text-lg mb-2">Keine Events</p>
                                    <p className="text-sm text-gray-600 mb-4">Entdecke lokale Kunst-Events!</p>
                                    <Link href="/local">
                                        <Button variant="accent" size="sm">Events entdecken</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {allEvents.map((event) => (
                                        <Link 
                                            key={event.id}
                                            href={`/local/event/${event.id}`}
                                            className="card-comic p-4 flex items-center gap-4"
                                        >
                                            <div className="w-14 h-14 border-2 border-black bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-2xl">📅</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{event.title}</p>
                                                <p className="text-xs text-gray-600">
                                                    {new Date(event.date).toLocaleDateString('de-DE', { 
                                                        day: 'numeric', 
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 border-2 border-black ${
                                                createdEvents.find(e => e.id === event.id) 
                                                    ? 'bg-accent' 
                                                    : 'bg-green-200'
                                            }`}>
                                                {createdEvents.find(e => e.id === event.id) ? 'HOST' : 'GOING'}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <div className="space-y-4">
                            {/* Bio */}
                            <div className="card-comic p-4">
                                <h3 className="font-heading text-sm mb-2">BIO</h3>
                                <p className="text-sm text-gray-700">
                                    {profile.bio || 'Noch keine Bio hinzugefügt.'}
                                </p>
                            </div>
                            
                            {/* Details */}
                            <div className="card-comic p-4">
                                <h3 className="font-heading text-sm mb-3">DETAILS</h3>
                                <div className="space-y-2 text-sm">
                                    {profile.location && (
                                        <div className="flex items-center gap-2">
                                            <span>📍</span>
                                            <span>{profile.location}</span>
                                        </div>
                                    )}
                                    {profile.pronouns && (
                                        <div className="flex items-center gap-2">
                                            <span>👤</span>
                                            <span>{profile.pronouns}</span>
                                        </div>
                                    )}
                                    {profile.website && (
                                        <div className="flex items-center gap-2">
                                            <span>🔗</span>
                                            <a href={profile.website} target="_blank" rel="noopener" className="text-accent">
                                                {profile.website}
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span>📧</span>
                                        <span>{user.email}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Chatrooms */}
                            {userChatrooms.length > 0 && (
                                <div className="card-comic p-4">
                                    <h3 className="font-heading text-sm mb-3">CHATROOMS</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {userChatrooms.slice(0, 5).map((room) => (
                                            <Link 
                                                key={room.id}
                                                href={`/chatrooms/${room.id}`}
                                                className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-medium hover:bg-accent transition-colors"
                                            >
                                                {CHATROOM_CATEGORIES[room.category]?.emoji} {room.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Guestbook */}
                            <div className="card-comic p-4">
                                <h3 className="font-heading text-sm mb-3">📝 GÄSTEBUCH</h3>
                                
                                {/* Comment Input */}
                                <div className="mb-4">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Schreibe einen Kommentar..."
                                        className="w-full p-3 border-3 border-black text-sm resize-none"
                                        rows={2}
                                        maxLength={200}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">{newComment.length}/200</span>
                                        <Button 
                                            variant="accent" 
                                            size="sm"
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || submittingComment}
                                            loading={submittingComment}
                                        >
                                            Posten
                                        </Button>
                                    </div>
                                </div>
                                
                                {profileComments.length === 0 ? (
                                    <p className="text-sm text-center text-gray-500 py-4">
                                        Noch keine Kommentare
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {profileComments.slice(0, 5).map(comment => {
                                            const author = commentAuthors[comment.authorId];
                                            return (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-black overflow-hidden flex-shrink-0">
                                                        {author?.profilePictureUrl ? (
                                                            <img src={author.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full text-xs">👤</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-xs">{author?.displayName || 'Anon'}</span>
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
                    )}
                </div>
            </div>
            
            {/* ========== DESKTOP LAYOUT - Two Columns ========== */}
            <div className="hidden md:block">
                <div className="container mx-auto max-w-6xl px-4 py-6">
                    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
                        
                        {/* LEFT SIDEBAR */}
                        <div className="space-y-6">
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Link href="/profile/settings" className="flex-1">
                                    <Button variant="secondary" className="w-full text-sm py-2">
                                        ⚙️ Profil bearbeiten
                                    </Button>
                                </Link>
                                <Button variant="ghost" className="text-sm py-2 px-4" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                            
                            {/* Bio Card */}
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <h3 className="font-heading mb-3">👤 ÜBER MICH</h3>
                                <p className="text-sm text-gray-700 mb-4">
                                    {profile.bio || 'Noch keine Bio hinzugefügt.'}
                                </p>
                                <div className="space-y-2 text-sm">
                                    {profile.location && (
                                        <div className="flex items-center gap-2">
                                            <span>📍</span>
                                            <span>{profile.location}</span>
                                        </div>
                                    )}
                                    {profile.pronouns && (
                                        <div className="flex items-center gap-2">
                                            <span>👤</span>
                                            <span>{profile.pronouns}</span>
                                        </div>
                                    )}
                                    {profile.website && (
                                        <div className="flex items-center gap-2">
                                            <span>🔗</span>
                                            <a href={profile.website} target="_blank" rel="noopener" style={{ color: accentColor }}>
                                                {profile.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Badges Card */}
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-heading">🏆 BADGES</h3>
                                    <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: accentColor }}>{userBadges.length}</span>
                                </div>
                                
                                {userBadges.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 mb-2">Noch keine Badges</p>
                                        <Link href="/badges" className="text-xs underline" style={{ color: accentColor }}>
                                            Alle Badges ansehen →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {showcasedBadgeIds.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
                                                {showcasedBadgeIds.slice(0, 5).map(badgeId => {
                                                    const badge = getBadgeById(badgeId);
                                                    if (!badge) return null;
                                                    return (
                                                        <div 
                                                            key={badgeId}
                                                            className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-lg bg-white"
                                                            title={badge.name}
                                                        >
                                                            {badge.icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="p-2 border bg-gray-50">
                                                <p className="font-heading text-lg">{userBadges.length}</p>
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
                            
                            {/* Events Card */}
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
                                
                                {allEvents.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 mb-2">Keine Events</p>
                                        <Link href="/local" className="text-xs underline" style={{ color: accentColor }}>
                                            Events entdecken →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {allEvents.slice(0, 3).map(event => (
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
                            
                            {/* Boards Card */}
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
                            
                            {/* Chatrooms Card */}
                            {userChatrooms.length > 0 && (
                                <div 
                                    className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                    style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                >
                                    <h3 className="font-heading mb-3">💬 CHATROOMS</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {userChatrooms.slice(0, 5).map((room) => (
                                            <Link 
                                                key={room.id}
                                                href={`/chatrooms/${room.id}`}
                                                className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-medium hover:bg-accent transition-colors"
                                            >
                                                {CHATROOM_CATEGORIES[room.category]?.emoji} {room.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Guestbook Card */}
                            <div 
                                className="border-4 border-black shadow-comic p-4 relative overflow-hidden bg-white"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <h3 className="font-heading mb-4">📝 GÄSTEBUCH</h3>
                                
                                {/* Comment Input */}
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
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || submittingComment}
                                        >
                                            {submittingComment ? '...' : 'Posten'}
                                        </Button>
                                    </div>
                                </div>
                                
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
                                <div className="flex items-center justify-between">
                                    <h2 className="font-heading text-xl">TIMELINE</h2>
                                    {profile.verificationStatus === 'verified' && (
                                        <Link href="/feed/create">
                                            <Button variant="accent" size="sm">
                                                ✏️ Neuer Post
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        
                            {/* Content */}
                            {posts.length === 0 ? (
                                <div className="border-4 border-black shadow-comic p-12 text-center bg-white">
                                    <span className="text-6xl">📝</span>
                                    <p className="mt-4 font-heading text-xl">Noch keine Posts</p>
                                    <p className="mt-2 text-gray-500">
                                        {profile.verificationStatus === 'verified' 
                                            ? 'Teile deinen ersten Post mit der Community!'
                                            : 'Verifiziere dich als Künstler um Posts zu erstellen.'}
                                    </p>
                                    {profile.verificationStatus !== 'verified' && (
                                        <Link href="/artist/verify">
                                            <Button variant="accent" className="mt-4">Künstler werden →</Button>
                                        </Link>
                                    )}
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
            </div>
            
            {/* Desktop Footer */}
            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </main>
    );
}
