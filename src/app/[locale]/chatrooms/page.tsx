"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { 
    getChatrooms, 
    getUniqueMemberCount,
    CHATROOM_CATEGORIES, 
    CHATROOM_REGIONS,
    seedDefaultChatrooms 
} from "@/lib/chatrooms";
import { Chatroom, ChatroomCategory, ChatroomRegion } from "@/types";

export default function ChatroomsPage() {
    const { user, profile } = useAuth();
    const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
    const [uniqueMembers, setUniqueMembers] = useState(0);
    const [totalOnline, setTotalOnline] = useState(0);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<ChatroomRegion | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<ChatroomCategory | 'all'>('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const rooms = await getChatrooms(
                selectedRegion === 'all' ? undefined : selectedRegion,
                selectedCategory === 'all' ? undefined : selectedCategory
            );
            setChatrooms(rooms);
            
            // Get unique member count (a user in multiple rooms counts as 1)
            const { uniqueUsers, totalOnline: online } = await getUniqueMemberCount();
            setUniqueMembers(uniqueUsers);
            setTotalOnline(online);
        } catch (error) {
            console.error("Error fetching chatrooms:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [selectedRegion, selectedCategory]);

    // Sync stats (Admin only)
    const handleSyncStats = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/chatrooms/sync-stats', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message}`);
                fetchRooms(); // Refresh data
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            console.error("Error syncing stats:", error);
            alert("Error synchronizing");
        } finally {
            setSyncing(false);
        }
    };

    // Group rooms by region for display
    const groupedRooms = chatrooms.reduce((acc, room) => {
        if (!acc[room.region]) acc[room.region] = [];
        acc[room.region].push(room);
        return acc;
    }, {} as Record<ChatroomRegion, Chatroom[]>);

    const pinnedRooms = chatrooms.filter(r => r.isPinned);
    const regularRooms = chatrooms.filter(r => !r.isPinned);

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
            <Navbar />
            
            {/* Hero Header */}
            <section className="relative py-12 md:py-16 border-b-4 border-[#FF10F0] overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #FF10F0 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                        animation: 'pulse 4s ease-in-out infinite'
                    }}></div>
                </div>
                
                <div className="container mx-auto px-4 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-[#FF10F0] text-white px-4 py-2 mb-6 border-4 border-white/30 shadow-[0_0_20px_rgba(255,16,240,0.5)]">
                            <span className="text-2xl animate-bounce">💬</span>
                            <span className="font-heading text-lg uppercase">LIVE CHAT</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-heading text-white mb-4 leading-tight">
                            CHATROOMS
                        </h1>
                        <p className="text-lg text-gray-300 mb-8">
                            Join a room and chat with artists from around the world. 
                            Real-time. No Bullshit. Just Art-Talk.
                        </p>
                        
                        {/* Quick Stats */}
                        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 px-6 py-3">
                                <span className="text-3xl font-heading text-[#CCFF00]">{chatrooms.length}</span>
                                <span className="block text-sm text-gray-400 uppercase">Rooms</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 px-6 py-3">
                                <span className="text-3xl font-heading text-[#FF10F0]">
                                    {totalOnline}
                                </span>
                                <span className="block text-sm text-gray-400 uppercase">Online</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 px-6 py-3">
                                <span className="text-3xl font-heading text-white">
                                    {uniqueMembers}
                                </span>
                                <span className="block text-sm text-gray-400 uppercase">Members</span>
                            </div>
                        </div>
                        
                        {/* Admin: Sync Stats Button */}
                        {profile?.role === 'admin' && (
                            <div className="mt-6">
                                <button
                                    onClick={handleSyncStats}
                                    disabled={syncing}
                                    className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white px-4 py-2 text-sm font-heading transition-all disabled:opacity-50"
                                >
                                    {syncing ? '🔄 Syncing...' : '🔄 Sync Statistics'}
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                    Cleans up stale online statuses and recalculates numbers
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            
            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Sidebar Filters */}
                    <aside className="lg:w-72 flex-shrink-0">
                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="lg:hidden w-full mb-4 py-3 bg-white/10 border-2 border-white/20 text-white font-heading flex items-center justify-center gap-2"
                        >
                            🎛️ Filter {showMobileFilters ? 'hide' : 'show'}
                        </button>
                        
                        <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
                            {/* Region Filter */}
                            <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 p-4">
                                <h3 className="font-heading text-lg text-white mb-4 flex items-center gap-2">
                                    🌍 REGION
                                </h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedRegion('all')}
                                        className={`w-full text-left px-3 py-2 transition-all flex items-center gap-2 ${
                                            selectedRegion === 'all' 
                                                ? 'bg-[#FF10F0] text-white' 
                                                : 'text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <span>🌐</span>
                                        <span>All Regions</span>
                                    </button>
                                    {Object.entries(CHATROOM_REGIONS).map(([key, { label, flag }]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedRegion(key as ChatroomRegion)}
                                            className={`w-full text-left px-3 py-2 transition-all flex items-center gap-2 ${
                                                selectedRegion === key 
                                                    ? 'bg-[#FF10F0] text-white' 
                                                    : 'text-gray-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{flag}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Category Filter */}
                            <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 p-4">
                                <h3 className="font-heading text-lg text-white mb-4 flex items-center gap-2">
                                    🏷️ KATEGORIE
                                </h3>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`w-full text-left px-3 py-2 transition-all flex items-center gap-2 ${
                                            selectedCategory === 'all' 
                                                ? 'bg-[#CCFF00] text-black' 
                                                : 'text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <span>✨</span>
                                        <span>All Categories</span>
                                    </button>
                                    {Object.entries(CHATROOM_CATEGORIES).map(([key, { label, emoji }]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key as ChatroomCategory)}
                                            className={`w-full text-left px-3 py-2 transition-all flex items-center gap-2 ${
                                                selectedCategory === key 
                                                    ? 'bg-[#CCFF00] text-black' 
                                                    : 'text-gray-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{emoji}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Not Logged In Notice */}
                            {!user && (
                                <div className="bg-[#FF10F0]/20 border-2 border-[#FF10F0] p-4 text-center">
                                    <span className="text-3xl">🔐</span>
                                    <p className="text-white font-heading mt-2 mb-3">LOGIN REQUIRED</p>
                                    <p className="text-sm text-gray-300 mb-4">
                                        You need an account to chat.
                                    </p>
                                    <Link href="/auth/login">
                                        <Button variant="accent" className="w-full">
                                            LOGIN
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </aside>
                    
                    {/* Rooms Grid */}
                    <main className="flex-1">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#FF10F0] mx-auto mb-4"></div>
                                <p className="font-heading text-white text-xl">Loading Chatrooms...</p>
                            </div>
                        ) : chatrooms.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 border-2 border-white/10">
                                <span className="text-6xl">🔍</span>
                                <h3 className="text-2xl font-heading text-white mt-4">No rooms found</h3>
                                <p className="text-gray-400 mt-2 mb-6">
                                    Try different filters or come back later.
                                </p>
                                <button
                                    onClick={() => { setSelectedRegion('all'); setSelectedCategory('all'); }}
                                    className="text-[#FF10F0] font-heading hover:underline"
                                >
                                    Reset filters →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Pinned/Featured Rooms */}
                                {pinnedRooms.length > 0 && (
                                    <div>
                                        <h2 className="font-heading text-xl text-white mb-4 flex items-center gap-2">
                                            ⭐ FEATURED ROOMS
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pinnedRooms.map(room => (
                                                <RoomCard key={room.id} room={room} featured />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Regular Rooms */}
                                <div>
                                    <h2 className="font-heading text-xl text-white mb-4 flex items-center gap-2">
                                        💬 ALL ROOMS
                                        <span className="text-sm text-gray-400 font-body">
                                            ({regularRooms.length})
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {regularRooms.map(room => (
                                            <RoomCard key={room.id} room={room} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            
            {/* Info Section */}
            <section className="border-t-4 border-white/10 py-16 mt-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-heading text-white mb-6">
                            COMMUNITY CHAT FOR ARTISTS
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                            Connect with other artists, get feedback, 
                            find collaborations or just chill in your favorite community.
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 border-2 border-white/10 p-4">
                                <span className="text-3xl">🎨</span>
                                <p className="font-heading text-white mt-2">Art-Focused</p>
                                <p className="text-xs text-gray-400">Art topics only</p>
                            </div>
                            <div className="bg-white/5 border-2 border-white/10 p-4">
                                <span className="text-3xl">🌍</span>
                                <p className="font-heading text-white mt-2">International</p>
                                <p className="text-xs text-gray-400">Global Community</p>
                            </div>
                            <div className="bg-white/5 border-2 border-white/10 p-4">
                                <span className="text-3xl">⚡</span>
                                <p className="font-heading text-white mt-2">Real-Time</p>
                                <p className="text-xs text-gray-400">Live Chat</p>
                            </div>
                            <div className="bg-white/5 border-2 border-white/10 p-4">
                                <span className="text-3xl">🚫</span>
                                <p className="font-heading text-white mt-2">No AI</p>
                                <p className="text-xs text-gray-400">Real People</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <Footer />
        </main>
    );
}

// Room Card Component
function RoomCard({ room, featured = false }: { room: Chatroom; featured?: boolean }) {
    const regionInfo = CHATROOM_REGIONS[room.region];
    const categoryInfo = CHATROOM_CATEGORIES[room.category];
    
    return (
        <Link href={`/chatrooms/${room.id}`}>
            <div 
                className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,16,240,0.3)] ${
                    featured 
                        ? 'bg-gradient-to-br from-[#FF10F0]/20 to-purple-900/40 border-2 border-[#FF10F0]' 
                        : 'bg-white/5 border-2 border-white/10 hover:border-white/30'
                }`}
            >
                {/* Room Header with Color Accent */}
                <div 
                    className="h-2"
                    style={{ backgroundColor: room.color }}
                />
                
                <div className="p-4">
                    {/* Title Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{room.emoji}</span>
                            <h3 className="font-heading text-lg text-white group-hover:text-[#CCFF00] transition-colors">
                                {room.name}
                            </h3>
                        </div>
                        {featured && (
                            <span className="bg-[#FF10F0] text-white text-xs px-2 py-0.5 font-heading">
                                HOT
                            </span>
                        )}
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {room.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-gray-300 px-2 py-1">
                            {regionInfo.flag} {regionInfo.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-gray-300 px-2 py-1">
                            {categoryInfo.emoji} {categoryInfo.label}
                        </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            {(room.onlineCount || 0) > 0 ? (
                                <span className="flex items-center gap-1 text-green-400">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    {room.onlineCount} online
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-gray-500">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                    0 online
                                </span>
                            )}
                            <span className="text-gray-500">
                                {room.membersCount || 0} {(room.membersCount || 0) === 1 ? 'member' : 'members'}
                            </span>
                        </div>
                        <span className="text-[#CCFF00] font-heading text-sm group-hover:translate-x-1 transition-transform">
                            JOIN →
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

