"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { MobileDrawer } from "@/components/ui/MobileDrawer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from 'next-intl';
import { getPublicFeed, likePost, unlikePost, getLike } from "@/lib/feed";
import { getUserProfile } from "@/lib/db";
import { FeedPost, UserProfile } from "@/types";
import { DocumentSnapshot } from "firebase/firestore";

interface PostWithAuthor extends FeedPost {
    author?: UserProfile;
    isLiked?: boolean;
}

export default function FeedPage() {
    const { user, profile } = useAuth();
    const t = useTranslations('feed');
    const [posts, setPosts] = useState<PostWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const loadPosts = useCallback(async (isLoadMore = false) => {
        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const result = await getPublicFeed(20, isLoadMore ? lastDoc || undefined : undefined, user?.uid);
            
            // Load author profiles for each post
            const postsWithAuthors = await Promise.all(
                result.posts.map(async (post) => {
                    try {
                        const author = await getUserProfile(post.artistId);
                        let isLiked = false;
                        if (user) {
                            const like = await getLike(post.id, user.uid);
                            isLiked = !!like;
                        }
                        return { ...post, author: author || undefined, isLiked };
                    } catch {
                        return { ...post, isLiked: false };
                    }
                })
            );

            if (isLoadMore) {
                setPosts(prev => [...prev, ...postsWithAuthors]);
            } else {
                setPosts(postsWithAuthors);
            }
            
            setLastDoc(result.lastDoc);
            setHasMore(result.posts.length === 20);
        } catch (error) {
            console.error("Error loading feed:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [lastDoc, user]);

    useEffect(() => {
        loadPosts();
    }, []);

    const handleLike = async (postId: string, isCurrentlyLiked: boolean) => {
        if (!user) return;
        
        // Optimistic update
        setPosts(prev => prev.map(p => 
            p.id === postId 
                ? { ...p, isLiked: !isCurrentlyLiked, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) }
                : p
        ));

        try {
            if (isCurrentlyLiked) {
                await unlikePost(postId, user.uid);
            } else {
                await likePost(postId, user.uid);
            }
        } catch (error) {
            // Revert on error
            setPosts(prev => prev.map(p => 
                p.id === postId 
                    ? { ...p, isLiked: isCurrentlyLiked, likesCount: p.likesCount + (isCurrentlyLiked ? 1 : -1) }
                    : p
            ));
        }
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return t('justNow');
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return new Date(timestamp).toLocaleDateString();
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <div className="hidden md:block">
                    <Navbar />
                </div>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">{t('loading')}</p>
                    </div>
                </div>
                <MobileBottomNav />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Drawer */}
            <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

            {/* Mobile Header */}
            <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-40 safe-area-top">
                {/* Hamburger Menu Button */}
                <button 
                    onClick={() => setDrawerOpen(true)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
                    aria-label="Menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                        <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
                        <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
                    </svg>
                </button>

                {/* Logo */}
                <Link href="/feed" className="flex items-center">
                    <span className="font-heading text-2xl tracking-widest relative">
                        VARBE
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-accent"></span>
                    </span>
                </Link>
                
                {/* Right side - Search or Create button */}
                {profile?.verificationStatus === 'verified' ? (
                    <Link href="/feed/create" className="w-10 h-10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
                            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
                        </svg>
                    </Link>
                ) : (
                    <Link href="/search" className="w-10 h-10 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </Link>
                )}
            </header>

            <div className="max-w-2xl mx-auto px-0 md:px-4 py-0 md:py-6 pb-20 md:pb-6">
                {/* Create Post CTA (Desktop) */}
                {profile?.verificationStatus === 'verified' && (
                    <div className="hidden md:block mb-6">
                        <Link href="/feed/create">
                            <div className="bg-white border-4 border-black p-4 shadow-comic hover:shadow-comic-hover transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-3 border-black overflow-hidden bg-gray-200 flex-shrink-0">
                                        {profile?.profilePictureUrl ? (
                                            <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">
                                                {profile?.displayName?.charAt(0) || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-gray-500 flex-1">{t('whatAreYouWorkingOn')}</span>
                                    <Button variant="accent">{t('post')}</Button>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Posts Feed */}
                {posts.length === 0 ? (
                    <div className="bg-white border-4 border-black p-8 md:p-12 text-center mx-4 md:mx-0">
                        <span className="text-6xl block mb-4">📭</span>
                        <h2 className="font-heading text-2xl mb-2">{t('noPostsYet')}</h2>
                        <p className="text-gray-600 mb-6">{t('beTheFirst')}</p>
                        {profile?.verificationStatus === 'verified' ? (
                            <Link href="/feed/create">
                                <Button variant="accent">{t('createFirstPost')}</Button>
                            </Link>
                        ) : (
                            <Link href="/artist/verify">
                                <Button variant="accent">{t('becomeArtist')}</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0 md:space-y-4">
                        {posts.map((post) => (
                            <article 
                                key={post.id} 
                                className="bg-white border-b-2 md:border-4 border-black md:shadow-comic"
                            >
                                {/* Post Header */}
                                <div className="flex items-center gap-3 p-4">
                                    <Link href={`/profile/${post.artistId}`}>
                                        <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-gray-200">
                                            {post.author?.profilePictureUrl ? (
                                                <img src={post.author.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {post.author?.displayName?.charAt(0) || "?"}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${post.artistId}`} className="font-heading text-sm hover:underline truncate block">
                                            {post.author?.displayName || "Künstler"}
                                        </Link>
                                        <span className="text-xs text-gray-500">
                                            {post.author?.username && `@${post.author.username} · `}
                                            {formatTime(post.createdAt)}
                                        </span>
                                    </div>
                                    {post.moderationStatus === 'pending_review' && post.artistId === user?.uid && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-300">
                                            ⏳ {t('pendingReview')}
                                        </span>
                                    )}
                                </div>

                                {/* Post Content */}
                                <Link href={`/feed/${post.id}`}>
                                    {post.text && (
                                        <p className="px-4 pb-3 text-sm md:text-base whitespace-pre-wrap">
                                            {post.text}
                                        </p>
                                    )}

                                    {/* Images */}
                                    {post.images && post.images.length > 0 && (
                                        <div className={`grid gap-0.5 ${
                                            post.images.length === 1 ? 'grid-cols-1' : 
                                            post.images.length === 2 ? 'grid-cols-2' :
                                            post.images.length === 3 ? 'grid-cols-2' :
                                            'grid-cols-2'
                                        }`}>
                                            {post.images.slice(0, 4).map((img, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`relative ${
                                                        post.images!.length === 3 && idx === 0 ? 'row-span-2' : ''
                                                    } ${post.images!.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectedImage(img);
                                                    }}
                                                >
                                                    <img 
                                                        src={img} 
                                                        alt="" 
                                                        className="w-full h-full object-cover cursor-pointer"
                                                    />
                                                    {idx === 3 && post.images!.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <span className="text-white font-heading text-2xl">+{post.images!.length - 4}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Link>

                                {/* Post Actions */}
                                <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-100">
                                    <button 
                                        onClick={() => handleLike(post.id, post.isLiked || false)}
                                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                                            post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                                        }`}
                                    >
                                        <span className="text-lg">{post.isLiked ? '❤️' : '🤍'}</span>
                                        <span>{post.likesCount}</span>
                                    </button>
                                    <Link 
                                        href={`/feed/${post.id}`}
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                                    >
                                        <span className="text-lg">💬</span>
                                        <span>{post.commentsCount}</span>
                                    </Link>
                                    <button 
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-500 transition-colors"
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: post.author?.displayName || 'Varbe Post',
                                                    url: `${window.location.origin}/feed/${post.id}`
                                                });
                                            }
                                        }}
                                    >
                                        <span className="text-lg">↗️</span>
                                        <span>{post.sharesCount || 0}</span>
                                    </button>
                                </div>
                            </article>
                        ))}

                        {/* Load More */}
                        {hasMore && (
                            <div className="p-4 text-center">
                                <Button 
                                    variant="secondary" 
                                    onClick={() => loadPosts(true)}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? t('loading') : t('loadMore')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white text-3xl"
                        onClick={() => setSelectedImage(null)}
                    >
                        ✕
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="" 
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Footer (Desktop only) */}
            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </main>
    );
}
