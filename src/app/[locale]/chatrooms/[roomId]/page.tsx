"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { 
    getChatroom, 
    subscribeToMessages,
    sendMessage,
    joinChatroom,
    leaveChatroom,
    subscribeToOnlineMembers,
    becomeMember,
    getMembership,
    leaveMembership,
    CHATROOM_CATEGORIES, 
    CHATROOM_REGIONS 
} from "@/lib/chatrooms";
import { getUserProfile } from "@/lib/db";
import { Chatroom, ChatMessage, ChatroomMember, UserProfile } from "@/types";

export default function ChatroomPage() {
    const params = useParams();
    const roomId = params?.roomId as string;
    const router = useRouter();
    const { user, profile } = useAuth();
    
    // State
    const [room, setRoom] = useState<Chatroom | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<ChatroomMember[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMember, setIsMember] = useState(false);
    const [joiningMember, setJoiningMember] = useState(false);
    const [leavingMember, setLeavingMember] = useState(false);
    const [showMemberMenu, setShowMemberMenu] = useState(false);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Load room data
    useEffect(() => {
        const loadRoom = async () => {
            if (!roomId) return;
            
            try {
                const roomData = await getChatroom(roomId);
                if (!roomData) {
                    router.push('/chatrooms');
                    return;
                }
                setRoom(roomData);
            } catch (error) {
                console.error("Error loading room:", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadRoom();
    }, [roomId, router]);
    
    // Check membership status
    useEffect(() => {
        const checkMembership = async () => {
            if (!user || !roomId) return;
            
            try {
                const membership = await getMembership(roomId, user.uid);
                setIsMember(!!membership);
            } catch (error) {
                console.error("Error checking membership:", error);
            }
        };
        
        checkMembership();
    }, [user, roomId]);
    
    // Subscribe to messages
    useEffect(() => {
        if (!roomId) return;
        
        const unsubscribe = subscribeToMessages(roomId, async (newMessages) => {
            setMessages(newMessages);
            
            // Load user profiles for new messages
            const userIds = [...new Set(newMessages.map(m => m.userId))];
            const newProfiles: Record<string, UserProfile> = {};
            
            for (const userId of userIds) {
                if (!userProfiles[userId]) {
                    const userProfile = await getUserProfile(userId);
                    if (userProfile) newProfiles[userId] = userProfile;
                }
            }
            
            if (Object.keys(newProfiles).length > 0) {
                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            }
        });
        
        return () => unsubscribe();
    }, [roomId]);
    
    // Subscribe to online members
    useEffect(() => {
        if (!roomId) return;
        
        const unsubscribe = subscribeToOnlineMembers(roomId, async (members) => {
            setOnlineMembers(members);
            
            // Load profiles for online members
            const userIds = members.map(m => m.userId);
            const newProfiles: Record<string, UserProfile> = {};
            
            for (const oduserId of userIds) {
                if (!userProfiles[oduserId]) {
                    const userProfile = await getUserProfile(oduserId);
                    if (userProfile) newProfiles[oduserId] = userProfile;
                }
            }
            
            if (Object.keys(newProfiles).length > 0) {
                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            }
        });
        
        return () => unsubscribe();
    }, [roomId]);
    
    // Join room when user enters (set online status)
    useEffect(() => {
        if (!user || !roomId) return;
        
        joinChatroom(roomId, user.uid);
        
        // Leave room on unmount
        return () => {
            leaveChatroom(roomId, user.uid);
        };
    }, [user, roomId]);
    
    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);
    
    // Close member menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowMemberMenu(false);
        if (showMemberMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showMemberMenu]);
    
    // Become permanent member
    const handleBecomeMember = async () => {
        if (!user || !roomId) return;
        
        setJoiningMember(true);
        try {
            await becomeMember(roomId, user.uid);
            setIsMember(true);
        } catch (error) {
            console.error("Error becoming member:", error);
            setError("Konnte nicht Mitglied werden. Bitte versuche es erneut.");
        } finally {
            setJoiningMember(false);
        }
    };
    
    // Leave membership
    const handleLeaveMembership = async () => {
        if (!user || !roomId) return;
        
        setLeavingMember(true);
        setShowMemberMenu(false);
        try {
            await leaveMembership(roomId, user.uid);
            setIsMember(false);
        } catch (error) {
            console.error("Error leaving membership:", error);
            setError("Konnte Membership nicht verlassen. Bitte versuche es erneut.");
        } finally {
            setLeavingMember(false);
        }
    };
    
    // Send message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !roomId || !messageInput.trim() || sending) return;
        
        setSending(true);
        setError(null);
        
        try {
            // Include sender's display name for notifications
            const result = await sendMessage(
                roomId, 
                user.uid, 
                messageInput.trim(),
                'text',
                undefined,
                undefined,
                profile?.displayName || user.displayName || 'Anonym'
            );
            
            if (result.success) {
                setMessageInput('');
                inputRef.current?.focus();
            } else {
                setError(result.error || 'Nachricht konnte nicht gesendet werden.');
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setError('Nachricht konnte nicht gesendet werden.');
        } finally {
            setSending(false);
        }
    };
    
    // Format timestamp
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#FF10F0] mx-auto mb-4"></div>
                    <p className="font-heading text-white text-xl">Lade Chatroom...</p>
                </div>
            </div>
        );
    }
    
    if (!room) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <span className="text-6xl">❌</span>
                    <h2 className="text-2xl font-heading text-white mt-4">Raum nicht gefunden</h2>
                    <Link href="/chatrooms">
                        <Button variant="accent" className="mt-4">
                            Zurück zu Chatrooms
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }
    
    const regionInfo = CHATROOM_REGIONS[room.region];
    const categoryInfo = CHATROOM_CATEGORIES[room.category];

    return (
        <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex flex-col">
            {/* Header */}
            <header className="flex-shrink-0 border-b-4 border-[#FF10F0] bg-black/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/chatrooms" className="text-white hover:text-[#CCFF00] transition-colors">
                                <span className="text-2xl">←</span>
                            </Link>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{room.emoji}</span>
                                <div>
                                    <h1 className="font-heading text-xl text-white">{room.name}</h1>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>{regionInfo.flag} {regionInfo.label}</span>
                                        <span>•</span>
                                        <span>{categoryInfo.emoji} {categoryInfo.label}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Membership Button - Not a member yet */}
                            {user && !isMember && (
                                <button
                                    onClick={handleBecomeMember}
                                    disabled={joiningMember}
                                    className="px-4 py-2 bg-[#CCFF00] text-black font-heading text-sm border-2 border-black hover:bg-[#b8e600] transition-all hover:scale-105 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    {joiningMember ? '⏳' : '⭐ MEMBER WERDEN'}
                                </button>
                            )}
                            
                            {/* Member Badge with Dropdown */}
                            {user && isMember && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMemberMenu(!showMemberMenu);
                                        }}
                                        disabled={leavingMember}
                                        className="px-4 py-2 bg-[#CCFF00] text-black font-heading text-sm border-2 border-black transition-all hover:bg-[#b8e600] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
                                    >
                                        {leavingMember ? '⏳' : '⭐ MEMBER'}
                                        <span className="text-xs">▼</span>
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    {showMemberMenu && (
                                        <div className="absolute top-full right-0 mt-2 bg-gray-900 border-2 border-white/20 shadow-xl z-50 min-w-[180px]">
                                            <div className="p-3 border-b border-white/10">
                                                <p className="text-xs text-gray-400">Du bist Member!</p>
                                                <p className="text-xs text-[#CCFF00]">🔔 Notifications aktiv</p>
                                            </div>
                                            <button
                                                onClick={handleLeaveMembership}
                                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                            >
                                                ❌ Membership verlassen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Online Count */}
                            <div className="hidden md:flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-green-400">{onlineMembers.length} online</span>
                            </div>
                            
                            {/* Members Toggle */}
                            <button
                                onClick={() => setShowMembers(!showMembers)}
                                className={`px-3 py-2 border-2 transition-colors ${
                                    showMembers 
                                        ? 'bg-[#FF10F0] border-[#FF10F0] text-white' 
                                        : 'border-white/30 text-white hover:border-white'
                                }`}
                            >
                                👥 {onlineMembers.length}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/20 border-b-2 border-red-500 px-4 py-2 text-center">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}
            
            {/* Main Chat Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center h-full">
                                <div className="text-center">
                                    <span className="text-6xl">💬</span>
                                    <p className="text-gray-400 mt-4">
                                        Noch keine Nachrichten. Sei der Erste!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                const author = userProfiles[message.userId];
                                const isOwn = message.userId === user?.uid;
                                const showAvatar = index === 0 || 
                                    messages[index - 1].userId !== message.userId ||
                                    message.createdAt - messages[index - 1].createdAt > 300000; // 5 min gap
                                
                                return (
                                    <div 
                                        key={message.id}
                                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar - Clickable Profile Link */}
                                        <div className={`w-10 h-10 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                                            <Link 
                                                href={`/profile/${message.userId}`}
                                                className="block w-full h-full hover:opacity-80 transition-opacity cursor-pointer"
                                            >
                                                {author?.profilePictureUrl ? (
                                                    <img 
                                                        src={author.profilePictureUrl} 
                                                        alt="" 
                                                        className="w-full h-full rounded-full object-cover border-2 border-white/20 hover:border-[#FF10F0] transition-colors"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF10F0] to-purple-600 flex items-center justify-center text-white text-sm border-2 border-white/20 hover:border-[#FF10F0] transition-colors">
                                                        {author?.displayName?.[0] || '?'}
                                                    </div>
                                                )}
                                            </Link>
                                        </div>
                                        
                                        {/* Message Content */}
                                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                            {/* Author Name - Clickable Profile Link */}
                                            {showAvatar && (
                                                <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                    <Link 
                                                        href={`/profile/${message.userId}`}
                                                        className="font-bold text-sm text-white hover:text-[#FF10F0] transition-colors cursor-pointer"
                                                    >
                                                        {author?.displayName || 'Anonym'}
                                                    </Link>
                                                    {author?.username && (
                                                        <Link 
                                                            href={`/profile/${message.userId}`}
                                                            className="text-xs text-gray-400 hover:text-[#FF10F0] transition-colors cursor-pointer"
                                                        >
                                                            @{author.username}
                                                        </Link>
                                                    )}
                                                    {author?.verificationStatus === 'verified' && (
                                                        <span className="text-[#CCFF00] text-xs">✓</span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(message.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Message Bubble */}
                                            <div 
                                                className={`px-4 py-2 rounded-2xl ${
                                                    isOwn 
                                                        ? 'bg-[#FF10F0] text-white rounded-br-sm' 
                                                        : 'bg-white/10 text-white rounded-bl-sm'
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.text}
                                                </p>
                                                {message.isEdited && (
                                                    <span className="text-xs opacity-60">(bearbeitet)</span>
                                                )}
                                            </div>
                                            
                                            {/* Reactions */}
                                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                                                <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                                    {Object.entries(message.reactions).map(([emoji, users]) => (
                                                        <span 
                                                            key={emoji}
                                                            className="bg-white/10 px-2 py-0.5 rounded-full text-xs"
                                                        >
                                                            {emoji} {users.length}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Message Input */}
                    {user ? (
                        <div className="flex-shrink-0 border-t-2 border-white/10 p-4 bg-black/30">
                            <form onSubmit={handleSendMessage} className="flex gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Nachricht schreiben..."
                                    className="flex-1 bg-white/10 border-2 border-white/20 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0]"
                                    disabled={sending}
                                />
                                <Button 
                                    type="submit" 
                                    variant="accent"
                                    disabled={!messageInput.trim() || sending}
                                    className="px-6"
                                >
                                    {sending ? '...' : '→'}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex-shrink-0 border-t-2 border-white/10 p-4 bg-black/30 text-center">
                            <p className="text-gray-400 mb-2">Du musst angemeldet sein um zu chatten.</p>
                            <Link href="/auth/login">
                                <Button variant="accent">
                                    ANMELDEN
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
                
                {/* Members Sidebar */}
                {showMembers && (
                    <aside className="w-64 border-l-2 border-white/10 bg-black/30 overflow-y-auto hidden md:block">
                        <div className="p-4">
                            <h3 className="font-heading text-white mb-4 flex items-center gap-2">
                                👥 ONLINE ({onlineMembers.length})
                            </h3>
                            
                            {onlineMembers.length === 0 ? (
                                <p className="text-gray-500 text-sm">Niemand online</p>
                            ) : (
                                <div className="space-y-3">
                                    {onlineMembers.map(member => {
                                        const memberProfile = userProfiles[member.userId];
                                        return (
                                            <Link 
                                                key={member.id}
                                                href={`/profile/${member.userId}`}
                                                className="flex items-center gap-3 hover:bg-white/5 p-2 -mx-2 transition-colors"
                                            >
                                                <div className="relative">
                                                    {memberProfile?.profilePictureUrl ? (
                                                        <img 
                                                            src={memberProfile.profilePictureUrl} 
                                                            alt="" 
                                                            className="w-8 h-8 rounded-full object-cover border border-white/20"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF10F0] to-purple-600 flex items-center justify-center text-white text-xs border border-white/20">
                                                            {memberProfile?.displayName?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">
                                                        {memberProfile?.displayName || 'Anonym'}
                                                        {memberProfile?.verificationStatus === 'verified' && (
                                                            <span className="text-[#CCFF00] text-xs ml-1">✓</span>
                                                        )}
                                                    </p>
                                                    {memberProfile?.username && (
                                                        <p className="text-xs text-gray-400 truncate">
                                                            @{memberProfile.username}
                                                        </p>
                                                    )}
                                                    {member.role === 'member' && (
                                                        <span className="text-[#CCFF00] text-xs">⭐ Member</span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
