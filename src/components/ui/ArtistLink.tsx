"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { getUserProfile } from "@/lib/db";
import { UserProfile } from "@/types";

interface ArtistLinkProps {
    artistId: string;
    className?: string;
    showAnonymous?: boolean;
    asSpan?: boolean; // Wenn true, rendert einen span statt Link (für verschachtelte Links)
}

export function ArtistLink({ artistId, className = "", showAnonymous = true, asSpan = false }: ArtistLinkProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userProfile = await getUserProfile(artistId);
                setProfile(userProfile);
            } catch (error) {
                console.error("Error fetching artist profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (artistId) {
            fetchProfile();
        }
    }, [artistId]);

    if (loading) {
        return <span className={className}>...</span>;
    }

    const displayName = profile?.displayName || (showAnonymous ? "Anonymous Artist" : "");

    if (!displayName) {
        return null;
    }

    // Wenn asSpan true ist, rendere einen span statt Link (für verschachtelte Links)
    if (asSpan) {
        return (
            <span className={`text-gray-500 ${className}`}>
                {displayName}
            </span>
        );
    }

    return (
        <Link 
            href={`/profile/${artistId}`}
            className={`text-blue-600 hover:underline ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            {displayName}
        </Link>
    );
}

