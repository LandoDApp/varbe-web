"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

interface NavItem {
    href: string;
    icon: React.ReactNode;
    iconActive: React.ReactNode;
    label: string;
    requiresAuth?: boolean;
}

const HomeIcon = ({ active }: { active?: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SearchIcon = ({ active }: { active?: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const CreateIcon = ({ active }: { active?: boolean }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const MessagesIcon = ({ active }: { active?: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const navItems: NavItem[] = [
    {
        href: "/",
        icon: <HomeIcon />,
        iconActive: <HomeIcon active />,
        label: "Home",
    },
    {
        href: "/search",
        icon: <SearchIcon />,
        iconActive: <SearchIcon active />,
        label: "Suchen",
    },
    {
        href: "/feed/create",
        icon: <CreateIcon />,
        iconActive: <CreateIcon active />,
        label: "Erstellen",
        requiresAuth: true,
    },
    {
        href: "/messages",
        icon: <MessagesIcon />,
        iconActive: <MessagesIcon active />,
        label: "Chat",
        requiresAuth: true,
    },
    {
        href: "/profile",
        icon: <ProfileIcon />,
        iconActive: <ProfileIcon active />,
        label: "Profil",
        requiresAuth: true,
    },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/" || pathname === "/de" || pathname === "/en";
        }
        return pathname?.startsWith(href);
    };

    const handleCreateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowCreateMenu(!showCreateMenu);
    };

    return (
        <>
            {/* Create Menu Modal */}
            {showCreateMenu && (
                <div 
                    className="fixed inset-0 z-drawer bg-black/50 md:hidden"
                    onClick={() => setShowCreateMenu(false)}
                >
                    <div 
                        className="absolute bottom-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] left-1/2 -translate-x-1/2 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-white border-4 border-black shadow-comic-elevated p-4 min-w-[200px]">
                            <h3 className="font-heading text-lg mb-4 text-center">ERSTELLEN</h3>
                            <div className="space-y-2">
                                <Link 
                                    href="/feed/create" 
                                    className="flex items-center gap-3 p-3 border-2 border-black hover:bg-accent transition-colors"
                                    onClick={() => setShowCreateMenu(false)}
                                >
                                    <span className="text-xl">📝</span>
                                    <span className="font-body font-semibold">Neuer Post</span>
                                </Link>
                                <Link 
                                    href="/artist/blog/new" 
                                    className="flex items-center gap-3 p-3 border-2 border-black hover:bg-accent transition-colors"
                                    onClick={() => setShowCreateMenu(false)}
                                >
                                    <span className="text-xl">📰</span>
                                    <span className="font-body font-semibold">Blog Artikel</span>
                                </Link>
                                <Link 
                                    href="/local/event/create" 
                                    className="flex items-center gap-3 p-3 border-2 border-black hover:bg-accent transition-colors"
                                    onClick={() => setShowCreateMenu(false)}
                                >
                                    <span className="text-xl">📅</span>
                                    <span className="font-body font-semibold">Event</span>
                                </Link>
                            </div>
                        </div>
                        {/* Triangle pointer */}
                        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-black mx-auto -mt-[4px]"></div>
                    </div>
                </div>
            )}
            
            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 md:hidden z-sticky">
                <div className="h-16 bg-white border-t-4 border-black flex items-center justify-around safe-area-bottom shadow-tab-bar">
                    {navItems.map((item, index) => {
                        const active = isActive(item.href);
                        const isCreateButton = item.href === "/feed/create";
                        
                        // Handle auth requirement
                        if (item.requiresAuth && !user) {
                            return (
                                <Link
                                    key={item.href}
                                    href="/auth/login"
                                    className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all ${
                                        isCreateButton ? 'relative -mt-4' : ''
                                    }`}
                                >
                                    {isCreateButton ? (
                                        <div className="w-14 h-14 bg-accent border-4 border-black shadow-comic flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-gray-400">
                                                {item.icon}
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {item.label}
                                            </span>
                                        </>
                                    )}
                                </Link>
                            );
                        }
                        
                        // Create button special handling
                        if (isCreateButton) {
                            return (
                                <button
                                    key={item.href}
                                    onClick={handleCreateClick}
                                    className="flex flex-col items-center justify-center gap-1 relative -mt-4 transition-all active:scale-95"
                                >
                                    <div className={`w-14 h-14 border-4 border-black shadow-comic flex items-center justify-center transition-all ${
                                        showCreateMenu ? 'bg-black text-white rotate-45' : 'bg-accent text-black'
                                    }`}>
                                        {item.icon}
                                    </div>
                                </button>
                            );
                        }
                        
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all active:scale-95`}
                            >
                                <div className={`transition-all ${
                                    active 
                                        ? 'bg-accent rounded-full px-4 py-1 shadow-glow-green' 
                                        : ''
                                }`}>
                                    {active ? item.iconActive : item.icon}
                                </div>
                                <span className={`text-[10px] font-medium transition-colors ${
                                    active ? 'text-black' : 'text-gray-600'
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

export default MobileBottomNav;

