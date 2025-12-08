"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";

interface ChatBubbleProps {
    message: string;
    timestamp: number;
    isOwn: boolean;
    senderName?: string;
    senderAvatar?: string;
    senderId?: string;
    imageUrl?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    onImageClick?: () => void;
}

export function ChatBubble({
    message,
    timestamp,
    isOwn,
    senderName,
    senderAvatar,
    senderId,
    imageUrl,
    status,
    onImageClick,
}: ChatBubbleProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const StatusIcon = () => {
        switch (status) {
            case 'sending':
                return <span className="text-gray-400">○</span>;
            case 'sent':
                return <span className="text-gray-600">✓</span>;
            case 'delivered':
                return <span className="text-gray-600">✓✓</span>;
            case 'read':
                return <span className="text-accent-blue">✓✓</span>;
            default:
                return null;
        }
    };

    return (
        <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar - only for other's messages */}
            {!isOwn && senderId && (
                <Link 
                    href={`/profile/${senderId}`}
                    className="flex-shrink-0 self-end"
                >
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-gray-200">
                        {senderAvatar ? (
                            <img 
                                src={senderAvatar} 
                                alt={senderName || ''} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                {senderName?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </Link>
            )}

            <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Sender name - only for group chats / other's messages */}
                {!isOwn && senderName && (
                    <p className="text-xs font-medium text-gray-600 mb-1 px-2">
                        {senderName}
                    </p>
                )}

                {/* Message Bubble */}
                <div 
                    className={`
                        px-4 py-3 border-3 border-black relative
                        ${isOwn 
                            ? 'bg-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }
                    `}
                >
                    {/* Image message */}
                    {imageUrl && (
                        <div 
                            className="mb-2 -mx-2 -mt-1 cursor-pointer"
                            onClick={onImageClick}
                        >
                            {!imageLoaded && (
                                <div className="aspect-video skeleton rounded" />
                            )}
                            <img
                                src={imageUrl}
                                alt="Shared image"
                                className={`w-full rounded border-2 border-black ${
                                    imageLoaded ? 'block' : 'hidden'
                                }`}
                                loading="lazy"
                                onLoad={() => setImageLoaded(true)}
                            />
                        </div>
                    )}

                    {/* Text message */}
                    {message && (
                        <p className="font-body text-sm whitespace-pre-wrap break-words">
                            {message}
                        </p>
                    )}
                </div>

                {/* Timestamp & Status */}
                <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-500">
                        {formatTime(timestamp)}
                    </span>
                    {isOwn && status && (
                        <span className="text-[10px]">
                            <StatusIcon />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// Typing Indicator
export function TypingIndicator({ userName }: { userName?: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                <span className="text-xs">👤</span>
            </div>
            <div className="bg-gray-100 border-3 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex gap-1">
                    <span className="loading-dot" style={{ animationDelay: '0s' }} />
                    <span className="loading-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="loading-dot" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
            {userName && (
                <span className="text-xs text-gray-500">{userName} schreibt...</span>
            )}
        </div>
    );
}

// Date Separator
export function DateSeparator({ date }: { date: string }) {
    return (
        <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-0.5 bg-gray-200" />
            <span className="text-xs font-medium text-gray-500 uppercase">
                {date}
            </span>
            <div className="flex-1 h-0.5 bg-gray-200" />
        </div>
    );
}

// Chat Input Bar
export function ChatInputBar({
    value,
    onChange,
    onSend,
    onAttach,
    onEmoji,
    placeholder = "Nachricht...",
    disabled = false,
    sending = false,
}: {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onAttach?: () => void;
    onEmoji?: () => void;
    placeholder?: string;
    disabled?: boolean;
    sending?: boolean;
}) {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="flex items-end gap-2 p-3 bg-white border-t-4 border-black safe-area-bottom">
            {/* Attach Button */}
            {onAttach && (
                <button 
                    onClick={onAttach}
                    disabled={disabled}
                    className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label="Anhang"
                >
                    <span className="text-lg">📎</span>
                </button>
            )}

            {/* Input */}
            <div className="flex-1 relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="w-full px-4 py-2 border-3 border-black font-body text-sm resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:border-accent"
                    style={{ 
                        height: 'auto',
                        minHeight: '44px',
                    }}
                />
            </div>

            {/* Emoji Button */}
            {onEmoji && (
                <button 
                    onClick={onEmoji}
                    disabled={disabled}
                    className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label="Emoji"
                >
                    <span className="text-lg">😊</span>
                </button>
            )}

            {/* Send Button */}
            <button 
                onClick={onSend}
                disabled={disabled || !value.trim() || sending}
                className="w-12 h-10 flex items-center justify-center bg-accent border-3 border-black shadow-comic-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:hover:shadow-comic-sm disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                aria-label="Senden"
            >
                {sending ? (
                    <span className="animate-spin">⏳</span>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                )}
            </button>
        </div>
    );
}

// Conversation Card for Messages List
export function ConversationCard({
    id,
    participantName,
    participantAvatar,
    participantId,
    lastMessage,
    timestamp,
    unreadCount,
    isOnline,
    onClick,
}: {
    id: string;
    participantName: string;
    participantAvatar?: string;
    participantId: string;
    lastMessage?: string;
    timestamp: number;
    unreadCount: number;
    isOnline?: boolean;
    onClick: () => void;
}) {
    const formatTime = (ts: number) => {
        const now = Date.now();
        const diff = now - ts;
        
        // Within 24 hours - show time
        if (diff < 24 * 60 * 60 * 1000) {
            return new Date(ts).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        
        // Within 7 days - show day name
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return new Date(ts).toLocaleDateString('de-DE', { weekday: 'short' });
        }
        
        // Older - show date
        return new Date(ts).toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 border-4 border-black bg-white shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${
                unreadCount > 0 ? 'bg-accent/10' : ''
            }`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-3 border-black overflow-hidden bg-gray-200">
                    {participantAvatar ? (
                        <img 
                            src={participantAvatar} 
                            alt={participantName} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                            {participantName?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                </div>
                {/* Online indicator */}
                {isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-success border-2 border-black rounded-full" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                    <h3 className={`font-heading text-base truncate ${unreadCount > 0 ? 'text-black' : 'text-gray-800'}`}>
                        {participantName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(timestamp)}
                    </span>
                </div>
                {lastMessage && (
                    <p className={`text-sm truncate mt-1 ${unreadCount > 0 ? 'font-semibold text-black' : 'text-gray-600'}`}>
                        {lastMessage}
                    </p>
                )}
            </div>

            {/* Unread Badge */}
            {unreadCount > 0 && (
                <div className="flex-shrink-0 w-6 h-6 bg-error text-white rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                </div>
            )}
        </button>
    );
}

export default ChatBubble;

