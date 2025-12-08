"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { getConversationMessages, sendMessage } from "@/lib/messages";
import { Message, Conversation } from "@/types";
import { Button } from "@/components/ui/Button";
import { getUserProfile } from "@/lib/db";
import { UserProfile } from "@/types";
import { useTranslations } from 'next-intl';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ConversationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const t = useTranslations('messages');
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [otherParticipant, setOtherParticipant] = useState<UserProfile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const hasScrolledToBottomRef = useRef(false);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push("/auth/login");
            return;
        }

        if (typeof id === "string") {
            // Reset scroll state when conversation changes
            hasScrolledToBottomRef.current = false;
            fetchConversation();
            subscribeToMessages();
        }
    }, [id, user, authLoading, router]);

    // Scroll to bottom when messages are loaded initially
    useEffect(() => {
        if (!loading && messages.length > 0 && !hasScrolledToBottomRef.current) {
            // Use setTimeout to ensure DOM is rendered
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                hasScrolledToBottomRef.current = true;
            }, 100);
        }
    }, [loading, messages.length]);

    // Scroll to bottom when new messages arrive (smooth scroll)
    useEffect(() => {
        if (hasScrolledToBottomRef.current && messages.length > 0) {
            // Only scroll if user is near the bottom (within 100px)
            const container = messagesContainerRef.current;
            if (container) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (isNearBottom) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                }
            }
        }
    }, [messages]);

    const fetchConversation = async () => {
        if (typeof id !== "string" || !user) return;
        
        setLoading(true);
        try {
            const msgs = await getConversationMessages(id, user.uid);
            setMessages(msgs);

            // Get conversation data
            const convRef = doc(db, "conversations", id);
            const convSnap = await getDoc(convRef);
            if (convSnap.exists()) {
                const convData = { id: convSnap.id, ...convSnap.data() } as Conversation;
                setConversation(convData);

                // Get other participant profile
                const otherId = convData.participants.find(p => p !== user.uid);
                if (otherId) {
                    const profile = await getUserProfile(otherId);
                    setOtherParticipant(profile);
                }
            }
        } catch (error) {
            console.error("Error fetching conversation:", error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        if (typeof id !== "string") return;

        const messagesRef = collection(db, "messages");
        const q = query(
            messagesRef,
            where("conversationId", "==", id),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(newMessages);
        });

        return unsubscribe;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageContent.trim() || !user || typeof id !== "string") return;

        setSending(true);
        try {
            const result = await sendMessage(id, user.uid, messageContent.trim());
            
            if (!result.success) {
                alert(result.error || "Fehler beim Senden der Nachricht");
                return;
            }
            
            setMessageContent("");
            // Scroll to bottom after sending message
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error: any) {
            alert(error.message || "Fehler beim Senden der Nachricht");
        } finally {
            setSending(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">Lädt...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            
            <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex flex-col">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/messages')}
                        className="text-black underline decoration-accent decoration-2 underline-offset-2 font-heading mb-4"
                    >
                        ← Zurück zu Nachrichten
                    </button>
                    <div className="flex items-center gap-4">
                        {otherParticipant && conversation ? (
                            <>
                                <Link 
                                    href={`/profile/${conversation.participants.find(p => p !== user?.uid)}`}
                                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden bg-gray-200 flex-shrink-0 hover:border-accent transition-colors">
                                        {otherParticipant.profilePictureUrl ? (
                                            <img 
                                                src={otherParticipant.profilePictureUrl} 
                                                alt={otherParticipant.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                {otherParticipant.displayName?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <h1 className="text-4xl font-heading hover:text-accent transition-colors">
                                        {otherParticipant.displayName || 'Unbekannter Benutzer'}
                                    </h1>
                                </Link>
                            </>
                        ) : (
                            <h1 className="text-4xl font-heading">
                                Unbekannter Benutzer
                            </h1>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto space-y-4 mb-6 border-4 border-black p-4 bg-gray-50"
                >
                    {messages.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="font-body text-gray-600">Noch keine Nachrichten</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isOwn = message.senderId === user?.uid;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] card-comic border-4 border-black p-4 ${
                                        isOwn ? 'bg-accent' : 'bg-white'
                                    }`}>
                                        <p className="font-body whitespace-pre-wrap">{message.content}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(message.createdAt).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Nachricht schreiben..."
                        className="flex-1 px-4 py-3 border-4 border-black font-body"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        disabled={sending || !messageContent.trim()}
                        variant="accent"
                    >
                        {sending ? "..." : "Senden"}
                    </Button>
                </form>
            </div>

            <Footer />
        </div>
    );
}

