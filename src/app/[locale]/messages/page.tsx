"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { ConversationCard } from "@/components/ui/ChatBubble";
import { Button } from "@/components/ui/Button";
import { getUserConversations } from "@/lib/messages";
import { Conversation } from "@/types";
import { Link } from "@/i18n/routing";
import { getUserProfile } from "@/lib/db";
import { UserProfile } from "@/types";
import { useTranslations } from 'next-intl';

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('messages');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [participantProfiles, setParticipantProfiles] = useState<{ [userId: string]: UserProfile }>({});
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push("/auth/login");
            return;
        }

        fetchConversations();
    }, [user, authLoading, router]);

    const fetchConversations = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const convs = await getUserConversations(user.uid);
            setConversations(convs);

            // Fetch participant profiles
            const profiles: { [userId: string]: UserProfile } = {};
            for (const conv of convs) {
                for (const participantId of conv.participants) {
                    if (participantId !== user.uid && !profiles[participantId]) {
                        try {
                            const profile = await getUserProfile(participantId);
                            if (profile) {
                                profiles[participantId] = profile;
                            }
                        } catch (error) {
                            console.error("Error fetching profile:", error);
                        }
                    }
                }
            }
            setParticipantProfiles(profiles);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter conversations based on search
    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery.trim()) return true;
        const otherParticipantId = conv.participants.find(id => id !== user?.uid);
        const otherParticipant = otherParticipantId ? participantProfiles[otherParticipantId] : null;
        const name = otherParticipant?.displayName?.toLowerCase() || '';
        const username = otherParticipant?.username?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || username.includes(query);
    });

    // Loading State
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white">
                {/* Desktop Nav */}
                <div className="hidden md:block">
                    <Navbar />
                </div>

                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center justify-center sticky top-0 z-sticky safe-area-top">
                    <h1 className="font-heading text-lg uppercase">{t('title')}</h1>
                </header>

                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border-4 border-black bg-white">
                                <div className="w-14 h-14 rounded-full skeleton" />
                                <div className="flex-1">
                                    <div className="h-5 w-32 skeleton mb-2" />
                                    <div className="h-4 w-48 skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <MobileBottomNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Header */}
            <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-sticky safe-area-top">
                <div className="w-10" /> {/* Spacer */}
                <h1 className="font-heading text-lg uppercase">{t('title')}</h1>
                <Link 
                    href="/messages/new"
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label={t('newMessage')}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </Link>
            </header>

            {/* Search Bar - Mobile */}
            <div className="md:hidden sticky top-14 z-sticky bg-white border-b-2 border-gray-200 px-4 py-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('searchConversations')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 border-2 border-black rounded-full bg-gray-50 font-body text-sm focus:outline-none focus:bg-white focus:border-accent"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </span>
                </div>
            </div>
            
            <div className="container mx-auto px-4 py-4 md:py-12 max-w-2xl pb-nav md:pb-0">
                {/* Desktop Title */}
                <h1 className="hidden md:block text-5xl font-heading mb-8">{t('title')}</h1>

                {filteredConversations.length === 0 ? (
                    <div className="card-comic bg-white p-8 md:p-12 text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <h2 className="font-heading text-xl md:text-2xl mb-2">
                            {searchQuery ? t('noResults') : t('noConversations')}
                        </h2>
                        <p className="font-body text-gray-600 mb-6">
                            {searchQuery 
                                ? t('tryOtherSearch')
                                : t('startConversation')
                            }
                        </p>
                        {!searchQuery && (
                            <Link href="/kuenstler">
                                <Button variant="accent">
                                    {t('discoverArtists')}
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-4">
                        {filteredConversations.map((conv) => {
                            const otherParticipantId = conv.participants.find(id => id !== user?.uid);
                            const otherParticipant = otherParticipantId ? participantProfiles[otherParticipantId] : null;
                            const unreadCount = conv.unreadCount[user?.uid || ''] || 0;

                            return (
                                <ConversationCard
                                    key={conv.id}
                                    id={conv.id}
                                    participantName={otherParticipant?.displayName || t('unknownUser')}
                                    participantAvatar={otherParticipant?.profilePictureUrl}
                                    participantId={otherParticipantId || ''}
                                    lastMessage={conv.lastMessage}
                                    timestamp={conv.lastMessageAt}
                                    unreadCount={unreadCount}
                                    onClick={() => router.push(`/messages/${conv.id}`)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer - Desktop only */}
            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
