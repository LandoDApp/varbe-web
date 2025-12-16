"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { Button } from "@/components/ui/Button";
import { getAllPublicPosts } from "@/lib/feed";
import { getVerifiedArtists } from "@/lib/db";
import { FeedPost, UserProfile } from "@/types";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';

type SearchType = 'all' | 'posts' | 'users';

// Trending tags (could be dynamic later)
const trendingTags = ['abstrakt', 'portrait', 'natur', 'urban', 'digital', 'aquarell'];

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('search');
    
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [users, setUsers] = useState<(UserProfile & { artistProfile?: any })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
    const [searchType, setSearchType] = useState<SearchType>((searchParams.get('type') as SearchType) || 'all');
    const [artistProfiles, setArtistProfiles] = useState<Record<string, UserProfile>>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [allPosts, allUsers] = await Promise.all([
                    getAllPublicPosts(),
                    getVerifiedArtists()
                ]);
                setPosts(allPosts);
                setUsers(allUsers);
                
                // Build artist profiles map
                const profiles: Record<string, UserProfile> = {};
                allUsers.forEach(user => {
                    profiles[user.uid] = user;
                });
                setArtistProfiles(profiles);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // Update URL when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        const params = new URLSearchParams();
        if (value.trim()) params.set('q', value.trim());
        if (searchType !== 'all') params.set('type', searchType);
        const queryString = params.toString();
        window.history.replaceState({}, '', `/search${queryString ? `?${queryString}` : ''}`);
    };

    const handleTypeChange = (type: SearchType) => {
        setSearchType(type);
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (type !== 'all') params.set('type', type);
        const queryString = params.toString();
        window.history.replaceState({}, '', `/search${queryString ? `?${queryString}` : ''}`);
    };

    const handleTagClick = (tag: string) => {
        handleSearchChange(tag);
    };

    // Filter posts
    const filteredPosts = posts.filter(post => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const text = post.text?.toLowerCase() || "";
        const tags = post.tags?.map(t => t.toLowerCase()).join(' ') || "";
        const artist = artistProfiles[post.artistId];
        const artistName = artist?.displayName?.toLowerCase() || "";
        const username = artist?.username?.toLowerCase() || "";
        
        return text.includes(query) || tags.includes(query) || artistName.includes(query) || username.includes(query);
    });

    // Filter users
    const filteredUsers = users.filter(user => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const displayName = user.displayName?.toLowerCase() || "";
        const username = user.username?.toLowerCase() || "";
        const artistName = user.artistProfile?.artistName?.toLowerCase() || "";
        const bio = user.artistProfile?.bio?.toLowerCase() || "";
        const artStyle = user.artistProfile?.artStyle?.toLowerCase() || "";
        
        return displayName.includes(query) || 
               username.includes(query) ||
               artistName.includes(query) || 
               bio.includes(query) ||
               artStyle.includes(query);
    });

    const totalResults = 
        (searchType === 'all' || searchType === 'posts' ? filteredPosts.length : 0) +
        (searchType === 'all' || searchType === 'users' ? filteredUsers.length : 0);

    return (
        <div className="min-h-screen bg-white">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Header */}
            <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-sticky safe-area-top">
                <h1 className="font-heading text-lg uppercase">{t('discover')}</h1>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`w-10 h-10 flex items-center justify-center border-2 border-black ${showFilters ? 'bg-accent' : 'bg-white'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                </button>
            </header>

            {/* Mobile Search Bar - Sticky */}
            <div className="md:hidden sticky top-14 z-sticky bg-white border-b-2 border-gray-200 px-4 py-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full h-12 pl-10 pr-10 border-3 border-black rounded-full bg-gray-50 font-body text-sm focus:outline-none focus:bg-white focus:border-accent"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => handleSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
                
                {/* Type Filters - Mobile */}
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                    {[
                        { type: 'all' as SearchType, label: t('filterAll'), count: filteredPosts.length + filteredUsers.length },
                        { type: 'users' as SearchType, label: t('filterArtists'), count: filteredUsers.length },
                        { type: 'posts' as SearchType, label: t('filterPosts'), count: filteredPosts.length },
                    ].map(({ type, label, count }) => (
                        <button
                            key={type}
                            onClick={() => handleTypeChange(type)}
                            className={`flex-shrink-0 px-4 py-2 text-sm font-heading border-2 border-black transition-all ${
                                searchType === type 
                                    ? 'bg-accent' 
                                    : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                            {label} ({count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Trending Tags - Mobile */}
            {!searchQuery.trim() && (
                <div className="md:hidden px-4 py-3 border-b-2 border-gray-100">
                    <p className="text-xs font-heading text-gray-500 mb-2">{t('trending')}</p>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {trendingTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className="flex-shrink-0 px-3 py-1 text-sm border-2 border-black bg-white hover:bg-accent transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-4 md:py-8 pb-nav md:pb-8">
                {/* Desktop Search */}
                <div className="hidden md:block mb-8">
                    <h1 className="text-4xl md:text-6xl font-heading mb-6">🔍 {t('discover')}</h1>
                    
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder={t('filterPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="input-comic w-full pl-12 text-lg py-4"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                        {searchQuery && (
                            <button
                                onClick={() => handleSearchChange("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 px-4 py-2 border-2 border-black font-heading transition-colors"
                            >
                                ✕ {t('clear')}
                            </button>
                        )}
                    </div>

                    {/* Desktop Type Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { type: 'all' as SearchType, label: t('filterAllEmoji'), count: filteredPosts.length + filteredUsers.length },
                            { type: 'posts' as SearchType, label: t('filterPostsEmoji'), count: filteredPosts.length },
                            { type: 'users' as SearchType, label: t('filterArtistsEmoji'), count: filteredUsers.length },
                        ].map(({ type, label, count }) => (
                            <button
                                key={type}
                                onClick={() => handleTypeChange(type)}
                                className={`px-4 py-2 font-heading border-2 border-black transition-all ${
                                    searchType === type 
                                        ? 'bg-black text-white' 
                                        : 'bg-white hover:bg-gray-100'
                                }`}
                            >
                                {label} <span className="text-sm">({count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Info */}
                {searchQuery.trim() && (
                    <div className="mb-4 bg-accent/30 border-2 border-black p-3">
                        <p className="font-body text-sm md:text-base">
                            <span className="font-bold">{totalResults}</span> {t('resultsFor')} "<span className="font-bold">{searchQuery}</span>"
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12 md:py-20">
                        <div className="flex justify-center gap-1 mb-4">
                            <span className="loading-dot" />
                            <span className="loading-dot" />
                            <span className="loading-dot" />
                        </div>
                        <p className="text-lg md:text-2xl font-heading">{t('loadingShort')}</p>
                    </div>
                ) : totalResults === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12 md:py-20">
                        <span className="text-5xl md:text-6xl block mb-4">😕</span>
                        <p className="text-xl md:text-2xl font-heading mb-2">{t('noResultsTitle')}</p>
                        <p className="text-sm md:text-lg font-body text-gray-600 mb-6">
                            {t('noResultsTryOther')}
                        </p>
                        {searchQuery && (
                            <Button variant="ghost" onClick={() => handleSearchChange("")}>
                                {t('resetSearch')}
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Results */
                    <div className="space-y-8">
                        {/* Users Results */}
                        {(searchType === 'all' || searchType === 'users') && filteredUsers.length > 0 && (
                            <div>
                                <h2 className="text-lg md:text-2xl font-heading mb-3 md:mb-4 flex items-center gap-2">
                                    {t('artistsEmoji')} 
                                    <span className="text-xs md:text-sm bg-gray-100 px-2 py-1 border border-black">{filteredUsers.length}</span>
                                </h2>
                                
                                {/* Mobile: Horizontal scroll for featured */}
                                <div className="md:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                                    {filteredUsers.slice(0, 8).map((user) => (
                                        <Link key={user.uid} href={`/profile/${user.uid}`} className="flex-shrink-0 w-[140px]">
                                            <div className="border-3 border-black bg-white p-3 shadow-comic-sm">
                                                <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 border-3 border-black overflow-hidden mb-2">
                                                    {user.profilePictureUrl ? (
                                                        <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-2xl">🎨</span>
                                                    )}
                                                </div>
                                                <p className="font-heading text-sm text-center truncate">
                                                    {user.artistProfile?.artistName || user.displayName}
                                                </p>
                                                {user.username && (
                                                    <p className="text-xs text-gray-500 text-center truncate">
                                                        @{user.username}
                                                    </p>
                                                )}
                                                {user.verificationStatus === 'verified' && (
                                                    <p className="text-xs text-center text-green-600 font-bold mt-1">✓</p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Desktop: Grid */}
                                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredUsers.slice(0, searchType === 'all' ? 6 : undefined).map((user) => (
                                        <Link key={user.uid} href={`/profile/${user.uid}`}>
                                            <div className="border-4 border-black p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4 shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]">
                                                <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-black overflow-hidden flex-shrink-0">
                                                    {user.profilePictureUrl ? (
                                                        <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-2xl">🎨</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-heading text-lg truncate">
                                                        {user.artistProfile?.artistName || user.displayName}
                                                    </h3>
                                                    {user.username && (
                                                        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                                                    )}
                                                    {user.verificationStatus === 'verified' && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-bold mt-1">
                                                            ✓ {t('verified')}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xl">→</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                
                                {searchType === 'all' && filteredUsers.length > 6 && (
                                    <button 
                                        onClick={() => handleTypeChange('users')}
                                        className="mt-4 text-accent-blue font-bold hover:underline text-sm"
                                    >
                                        {t('showAllArtists', { count: filteredUsers.length })}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Posts Results */}
                        {(searchType === 'all' || searchType === 'posts') && filteredPosts.length > 0 && (
                            <div>
                                <h2 className="text-lg md:text-2xl font-heading mb-3 md:mb-4 flex items-center gap-2">
                                    {t('postsEmoji')} 
                                    <span className="text-xs md:text-sm bg-gray-100 px-2 py-1 border border-black">{filteredPosts.length}</span>
                                </h2>
                                
                                {/* Mobile: 2-column grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                                    {filteredPosts.slice(0, searchType === 'all' ? 9 : undefined).map((post) => {
                                        const artist = artistProfiles[post.artistId];
                                        const hasImage = post.images && post.images.length > 0 && post.images[0];
                                        
                                        return (
                                            <Link key={post.id} href={`/feed/${post.id}`}>
                                                <div className="border-3 md:border-4 border-black bg-white overflow-hidden shadow-comic-sm md:shadow-comic hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                                    {hasImage ? (
                                                        <div className="aspect-square overflow-hidden">
                                                            <img 
                                                                src={post.images![0]} 
                                                                alt="" 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-square bg-gray-100 p-3 flex items-center justify-center">
                                                            <p className="text-xs text-center line-clamp-6">{post.text}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Mobile: Minimal info */}
                                                    <div className="p-2 md:p-4 md:hidden">
                                                        <div className="flex gap-3 text-xs text-gray-500">
                                                            <span>❤️ {post.likesCount}</span>
                                                            <span>💬 {post.commentsCount}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Desktop: Full info */}
                                                    <div className="hidden md:block p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 border border-black overflow-hidden">
                                                                {artist?.profilePictureUrl ? (
                                                                    <img src={artist.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="flex items-center justify-center h-full text-xs">🎨</span>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-xs truncate">{artist?.displayName || t('artist')}</span>
                                                        </div>
                                                        <p className="text-sm line-clamp-2 mb-2">{post.text}</p>
                                                        <div className="flex gap-4 text-sm text-gray-500">
                                                            <span>❤️ {post.likesCount}</span>
                                                            <span>💬 {post.commentsCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                
                                {searchType === 'all' && filteredPosts.length > 9 && (
                                    <button 
                                        onClick={() => handleTypeChange('posts')}
                                        className="mt-4 text-accent-blue font-bold hover:underline text-sm"
                                    >
                                        {t('showAllPosts', { count: filteredPosts.length })}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Desktop Footer */}
            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
