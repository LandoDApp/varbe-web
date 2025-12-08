"use client";

import { Link } from "@/i18n/routing";
import { useState } from "react";

interface ArtworkCardProps {
    id: string;
    imageUrl: string;
    title: string;
    price?: number;
    artistName?: string;
    artistUsername?: string;
    artistId?: string;
    isAiFree?: boolean;
    isHotBid?: boolean;
    isNew?: boolean;
    auctionEndTime?: number;
    category?: string;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export function ArtworkCard({
    id,
    imageUrl,
    title,
    price,
    artistName,
    artistUsername,
    artistId,
    isAiFree,
    isHotBid,
    isNew,
    auctionEndTime,
    category,
    href,
    onClick,
    className = "",
}: ArtworkCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const linkHref = href || `/marketplace/${id}`;

    // Calculate countdown if auction
    const getCountdown = () => {
        if (!auctionEndTime) return null;
        const now = Date.now();
        const diff = auctionEndTime - now;
        
        if (diff <= 0) return "BEENDET";
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        
        return `${hours}h ${minutes}m`;
    };

    const countdown = getCountdown();
    const isUrgent = auctionEndTime && (auctionEndTime - Date.now()) < 60 * 60 * 1000; // < 1 hour

    const CardContent = (
        <div 
            className={`card-artwork aspect-square relative group overflow-hidden transition-all duration-150 ${
                isPressed ? 'translate-x-[2px] translate-y-[2px] shadow-comic-hover' : 'shadow-comic'
            } ${className}`}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
        >
            {/* Image */}
            <div className="absolute inset-0 bg-gray-100">
                {!imageLoaded && !imageFailed && (
                    <div className="absolute inset-0 skeleton" />
                )}
                {imageFailed ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <span className="text-4xl">🎨</span>
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        alt={title}
                        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageFailed(true)}
                    />
                )}
            </div>

            {/* Badges - Top Right */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                {isAiFree && (
                    <span className="bg-accent text-black px-2 py-0.5 text-[10px] font-heading uppercase border-2 border-black">
                        KI-FREI ✓
                    </span>
                )}
                {isNew && (
                    <span className="bg-info text-black px-2 py-0.5 text-[10px] font-heading uppercase border-2 border-black">
                        NEU
                    </span>
                )}
                {isHotBid && (
                    <span className="bg-error text-white px-2 py-0.5 text-[10px] font-heading uppercase border-2 border-black animate-pulse">
                        🔥 HOT BID
                    </span>
                )}
            </div>

            {/* Category Badge - Top Left */}
            {category && (
                <span className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 text-[10px] font-heading uppercase">
                    {category}
                </span>
            )}

            {/* Countdown - Auction */}
            {countdown && (
                <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-heading border-2 border-black ${
                    isUrgent ? 'bg-error text-white animate-pulse' : 'bg-warning text-black'
                }`}>
                    ⏱️ {countdown}
                </div>
            )}

            {/* Overlay - Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-3">
                <h3 className="font-heading text-white text-sm truncate mb-1">
                    {title}
                </h3>
                {price !== undefined && (
                    <p className="font-body font-semibold text-accent text-base">
                        €{price.toLocaleString('de-DE')}
                    </p>
                )}
                {artistName && (
                    <p className="text-white/80 text-xs truncate">
                        {artistUsername ? `@${artistUsername}` : artistName}
                    </p>
                )}
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="w-full text-left">
                {CardContent}
            </button>
        );
    }

    return (
        <Link href={linkHref}>
            {CardContent}
        </Link>
    );
}

// Compact version for horizontal scroll / smaller displays
export function ArtworkCardCompact({
    id,
    imageUrl,
    title,
    price,
    artistName,
    href,
    className = "",
}: Pick<ArtworkCardProps, 'id' | 'imageUrl' | 'title' | 'price' | 'artistName' | 'href' | 'className'>) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const linkHref = href || `/marketplace/${id}`;

    return (
        <Link href={linkHref} className={`block w-[160px] flex-shrink-0 ${className}`}>
            <div className="border-3 border-black shadow-comic-sm overflow-hidden bg-white">
                <div className="aspect-square relative bg-gray-100">
                    {!imageLoaded && <div className="absolute inset-0 skeleton" />}
                    <img
                        src={imageUrl}
                        alt={title}
                        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>
                <div className="p-2">
                    <h3 className="font-body font-semibold text-sm truncate">{title}</h3>
                    {price !== undefined && (
                        <p className="font-body font-bold text-sm text-accent">€{price}</p>
                    )}
                    {artistName && (
                        <p className="text-gray-500 text-xs truncate">{artistName}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

// Skeleton Card for loading states
export function ArtworkCardSkeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`border-4 border-black shadow-comic aspect-square bg-white ${className}`}>
            <div className="w-full h-full skeleton" />
        </div>
    );
}

// Grid wrapper for artwork cards
export function ArtworkGrid({ 
    children, 
    columns = 2,
    className = "" 
}: { 
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
            {children}
        </div>
    );
}

export default ArtworkCard;

