"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook that redirects users without a username to the setup page.
 * Use this hook on protected pages where username is required.
 * 
 * @returns Object with loading state and whether user needs username setup
 */
export const useRequireUsername = () => {
    const { user, profile, loading, needsUsernameSetup } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait until auth is loaded
        if (loading) return;
        
        // If not logged in, don't redirect (let the page handle this)
        if (!user) return;
        
        // If user needs username setup, redirect
        if (needsUsernameSetup) {
            router.push("/auth/setup-username");
        }
    }, [user, loading, needsUsernameSetup, router]);

    return {
        loading,
        needsUsernameSetup,
        user,
        profile
    };
};

export default useRequireUsername;


