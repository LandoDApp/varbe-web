"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect to the admin dashboard moderation tab
 * The moderation functionality is now integrated into the main dashboard
 */
export default function ModerationRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to the admin dashboard (moderation is now a tab there)
        router.replace("/de/admin/dashboard");
    }, [router]);
    
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
                <p className="font-heading text-xl">Weiterleitung zur Moderation...</p>
            </div>
        </div>
    );
}
