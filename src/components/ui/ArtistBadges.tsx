"use client";

import { ArtistBadge } from "@/types";

interface BadgeConfig {
    icon: string;
    label: string;
    labelDe: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
}

const BADGE_CONFIGS: Record<ArtistBadge, BadgeConfig> = {
    verified: {
        icon: "✅",
        label: "Verified Artist",
        labelDe: "Verifizierter Künstler",
        color: "text-green-800",
        bgColor: "bg-green-100",
        borderColor: "border-green-600",
        description: "Identität und Authentizität bestätigt",
    },
    founding: {
        icon: "🌟",
        label: "Founding Artist",
        labelDe: "Gründungs-Künstler",
        color: "text-yellow-800",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-500",
        description: "Von Anfang an dabei",
    },
    top_seller: {
        icon: "🔥",
        label: "Top Seller",
        labelDe: "Top Verkäufer",
        color: "text-orange-800",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-500",
        description: "Überdurchschnittliche Verkaufszahlen",
    },
    ki_free: {
        icon: "🎨",
        label: "100% AI-Free",
        labelDe: "100% KI-frei",
        color: "text-purple-800",
        bgColor: "bg-purple-100",
        borderColor: "border-purple-500",
        description: "Alle Werke manuell auf KI-Freiheit geprüft",
    },
    community_choice: {
        icon: "💚",
        label: "Community Choice",
        labelDe: "Community Favorit",
        color: "text-lime-800",
        bgColor: "bg-lime-100",
        borderColor: "border-lime-500",
        description: "Von der Community gewählt",
    },
    premium: {
        icon: "💎",
        label: "Premium Artist",
        labelDe: "Premium Künstler",
        color: "text-blue-800",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-500",
        description: "Premium-Status freigeschaltet",
    },
    local_hero: {
        icon: "📍",
        label: "Local Hero",
        labelDe: "Lokaler Held",
        color: "text-red-800",
        bgColor: "bg-red-100",
        borderColor: "border-red-500",
        description: "Aktiv in der lokalen Kunstszene",
    },
};

interface ArtistBadgeProps {
    badge: ArtistBadge;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    showTooltip?: boolean;
    locale?: "de" | "en";
}

export function ArtistBadgeComponent({
    badge,
    size = "md",
    showLabel = true,
    showTooltip = true,
    locale = "de",
}: ArtistBadgeProps) {
    const config = BADGE_CONFIGS[badge];
    if (!config) return null;
    
    const sizeClasses = {
        sm: "text-xs px-1.5 py-0.5",
        md: "text-sm px-2 py-1",
        lg: "text-base px-3 py-1.5",
    };
    
    const iconSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
    };
    
    return (
        <span
            className={`
                inline-flex items-center gap-1 
                ${config.bgColor} ${config.color} 
                border-2 ${config.borderColor}
                font-bold rounded
                ${sizeClasses[size]}
                ${showTooltip ? "cursor-help" : ""}
            `}
            title={showTooltip ? config.description : undefined}
        >
            <span className={iconSizes[size]}>{config.icon}</span>
            {showLabel && (
                <span>{locale === "de" ? config.labelDe : config.label}</span>
            )}
        </span>
    );
}

interface ArtistBadgesListProps {
    badges: ArtistBadge[];
    size?: "sm" | "md" | "lg";
    showLabels?: boolean;
    maxDisplay?: number;
    locale?: "de" | "en";
}

export function ArtistBadgesList({
    badges,
    size = "md",
    showLabels = true,
    maxDisplay = 5,
    locale = "de",
}: ArtistBadgesListProps) {
    if (!badges || badges.length === 0) return null;
    
    const displayBadges = badges.slice(0, maxDisplay);
    const remaining = badges.length - maxDisplay;
    
    return (
        <div className="flex flex-wrap gap-2">
            {displayBadges.map((badge) => (
                <ArtistBadgeComponent
                    key={badge}
                    badge={badge}
                    size={size}
                    showLabel={showLabels}
                    locale={locale}
                />
            ))}
            {remaining > 0 && (
                <span className="text-sm text-gray-500 self-center">
                    +{remaining} mehr
                </span>
            )}
        </div>
    );
}

// Mini badge row for compact display (e.g., in listing cards)
interface MiniBadgesProps {
    badges: ArtistBadge[];
    maxDisplay?: number;
}

export function MiniBadges({ badges, maxDisplay = 3 }: MiniBadgesProps) {
    if (!badges || badges.length === 0) return null;
    
    const displayBadges = badges.slice(0, maxDisplay);
    
    return (
        <div className="flex gap-1">
            {displayBadges.map((badge) => (
                <span
                    key={badge}
                    className={`
                        ${BADGE_CONFIGS[badge]?.bgColor || "bg-gray-100"} 
                        ${BADGE_CONFIGS[badge]?.borderColor || "border-gray-300"}
                        border px-1 py-0.5 text-xs rounded
                    `}
                    title={BADGE_CONFIGS[badge]?.description}
                >
                    {BADGE_CONFIGS[badge]?.icon}
                </span>
            ))}
            {badges.length > maxDisplay && (
                <span className="text-xs text-gray-400">+{badges.length - maxDisplay}</span>
            )}
        </div>
    );
}

// Verification badge specifically (most common)
interface VerificationBadgeProps {
    status: "none" | "pending" | "verified" | "rejected";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function VerificationBadge({
    status,
    size = "md",
    showLabel = true,
}: VerificationBadgeProps) {
    const configs: Record<string, { icon: string; label: string; className: string }> = {
        verified: {
            icon: "✅",
            label: "Verifiziert",
            className: "bg-green-100 text-green-800 border-green-600",
        },
        pending: {
            icon: "⏳",
            label: "Wird geprüft",
            className: "bg-yellow-100 text-yellow-800 border-yellow-500",
        },
        rejected: {
            icon: "❌",
            label: "Abgelehnt",
            className: "bg-red-100 text-red-800 border-red-500",
        },
        none: {
            icon: "○",
            label: "Nicht verifiziert",
            className: "bg-gray-100 text-gray-600 border-gray-400",
        },
    };
    
    const config = configs[status] || configs.none;
    
    const sizeClasses = {
        sm: "text-xs px-1.5 py-0.5",
        md: "text-sm px-2 py-1",
        lg: "text-base px-3 py-1.5",
    };
    
    return (
        <span
            className={`
                inline-flex items-center gap-1 
                ${config.className}
                border-2 font-bold rounded
                ${sizeClasses[size]}
            `}
        >
            <span>{config.icon}</span>
            {showLabel && <span>{config.label}</span>}
        </span>
    );
}

// Export badge configuration for use elsewhere
export { BADGE_CONFIGS };





