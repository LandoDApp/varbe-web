"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect to the localized admin dashboard
 * This page exists for backwards compatibility
 */
export default function AdminDashboardRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to the German admin dashboard
        router.replace("/de/admin/dashboard");
    }, [router]);
    
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
                <p className="font-heading text-xl">Weiterleitung zum Admin Dashboard...</p>
            </div>
        </div>
    );
}
