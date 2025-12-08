"use client";

import { ReactNode } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Notifications } from "./Notifications";

interface MobileLayoutProps {
    children: ReactNode;
    title?: string;
    showBackButton?: boolean;
    showSearch?: boolean;
    showBottomNav?: boolean;
    rightActions?: ReactNode;
    className?: string;
}

export function MobileLayout({
    children,
    title,
    showBackButton = false,
    showSearch = false,
    showBottomNav = true,
    rightActions,
    className = "",
}: MobileLayoutProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    const handleBack = () => {
        router.back();
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                {/* Skeleton Header */}
                <header className="h-14 bg-white border-b-4 border-black flex items-center px-4 sticky top-0 z-sticky safe-area-top">
                    <div className="w-8 h-8 skeleton rounded" />
                    <div className="flex-1 mx-4">
                        <div className="h-6 w-24 skeleton rounded mx-auto" />
                    </div>
                    <div className="w-8 h-8 skeleton rounded" />
                </header>
                <main className="pb-nav">{children}</main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center px-4 sticky top-0 z-sticky safe-area-top">
                {/* Left Section */}
                <div className="flex items-center gap-2 min-w-[60px]">
                    {showBackButton ? (
                        <button 
                            onClick={handleBack}
                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
                            aria-label="Zurück"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    ) : (
                        <button 
                            onClick={() => setDrawerOpen(true)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
                            aria-label="Menü öffnen"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Center - Title or Logo */}
                <div className="flex-1 flex justify-center">
                    {title ? (
                        <h1 className="font-heading text-lg uppercase tracking-wide truncate max-w-[200px]">
                            {title}
                        </h1>
                    ) : (
                        <Link href="/" className="flex items-center">
                            <span className="font-heading text-2xl tracking-widest relative">
                                VARBE
                                <span className="absolute bottom-0 left-0 w-full h-1 bg-accent"></span>
                            </span>
                        </Link>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 min-w-[60px] justify-end">
                    {rightActions ? (
                        rightActions
                    ) : (
                        <>
                            {user && <Notifications />}
                        </>
                    )}
                </div>
            </header>

            {/* Mobile Search Bar (optional) */}
            {showSearch && (
                <div className="md:hidden sticky top-14 z-sticky bg-white border-b-2 border-gray-200 px-4 py-3">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Suche Kunst, Künstler..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-bar w-full"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </span>
                    </form>
                </div>
            )}

            {/* Main Content */}
            <main className={`${showBottomNav ? 'pb-nav' : ''} ${className}`}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            {showBottomNav && <MobileBottomNav />}

            {/* Mobile Drawer */}
            <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </div>
    );
}

export default MobileLayout;

