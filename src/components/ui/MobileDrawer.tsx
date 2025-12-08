"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavSection {
    title?: string;
    items: {
        href: string;
        icon: string;
        label: string;
        requiresAuth?: boolean;
        requiresArtist?: boolean;
        requiresAdmin?: boolean;
    }[];
}

const navSections: NavSection[] = [
    {
        items: [
            { href: "/", icon: "🏠", label: "Homepage" },
            { href: "/search", icon: "🔍", label: "Suchen & Entdecken" },
            { href: "/kuenstler", icon: "🎨", label: "Künstler" },
        ],
    },
    {
        title: "Community",
        items: [
            { href: "/local", icon: "📍", label: "Local Radar" },
            { href: "/challenges", icon: "🏆", label: "Challenges" },
            { href: "/commissions", icon: "💼", label: "Kommissionen" },
            { href: "/jobs", icon: "💼", label: "Jobs" },
            { href: "/chatrooms", icon: "💬", label: "Chatrooms" },
        ],
    },
    {
        title: "Mehr",
        items: [
            { href: "/blog", icon: "📰", label: "Blog" },
            { href: "/badges", icon: "🏅", label: "Badges" },
            { href: "/faq", icon: "❓", label: "FAQ" },
            { href: "/kontakt", icon: "📧", label: "Kontakt" },
        ],
    },
];

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const { user, profile, loading } = useAuth();
    const locale = useLocale();
    const router = useRouter();
    const [isChangingLocale, setIsChangingLocale] = useState(false);

    // Close drawer on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    // Handle swipe to close
    useEffect(() => {
        let startX = 0;
        
        const handleTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
        };
        
        const handleTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener("touchstart", handleTouchStart);
            document.addEventListener("touchend", handleTouchEnd);
        }
        
        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isOpen, onClose]);

    const switchLanguage = () => {
        const newLocale = locale === "de" ? "en" : "de";
        setIsChangingLocale(true);
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/(de|en)/, "") || "/";
        window.location.href = `/${newLocale}${pathWithoutLocale}${window.location.search}`;
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
            onClose();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 z-drawer md:hidden animate-fade-in"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white z-drawer md:hidden overflow-y-auto animate-slide-in-left">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label="Schließen"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                {/* User Section */}
                <div className="p-6 border-b-4 border-black bg-gray-50">
                    {loading ? (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full skeleton" />
                            <div className="flex-1">
                                <div className="h-5 w-32 skeleton mb-2" />
                                <div className="h-4 w-24 skeleton" />
                            </div>
                        </div>
                    ) : user && profile ? (
                        <Link href="/profile" onClick={onClose} className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full border-3 border-black overflow-hidden bg-gray-200">
                                {profile.profilePictureUrl ? (
                                    <img 
                                        src={profile.profilePictureUrl} 
                                        alt={profile.displayName} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                        {profile.displayName?.charAt(0).toUpperCase() || "👤"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-heading text-lg truncate">{profile.displayName}</p>
                                {profile.username && (
                                    <p className="text-gray-600 text-sm">@{profile.username}</p>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <div className="space-y-3">
                            <Link 
                                href="/auth/login" 
                                onClick={onClose}
                                className="block w-full py-3 px-4 bg-accent border-4 border-black font-heading text-center uppercase shadow-comic-sm hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                ANMELDEN
                            </Link>
                            <Link 
                                href="/auth/register" 
                                onClick={onClose}
                                className="block w-full py-3 px-4 bg-white border-4 border-black font-heading text-center uppercase shadow-comic-sm hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                REGISTRIEREN
                            </Link>
                        </div>
                    )}
                </div>

                {/* Navigation Sections */}
                <div className="py-4">
                    {navSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-4">
                            {section.title && (
                                <div className="px-6 py-2">
                                    <span className="font-heading text-sm text-gray-500 uppercase tracking-wider">
                                        {section.title}
                                    </span>
                                </div>
                            )}
                            {section.items.map((item) => {
                                // Check auth requirements
                                if (item.requiresAuth && !user) return null;
                                if (item.requiresArtist && profile?.verificationStatus !== "verified") return null;
                                if (item.requiresAdmin && profile?.role !== "admin") return null;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className="flex items-center gap-4 px-6 py-3 hover:bg-gray-100 transition-colors active:bg-gray-200"
                                    >
                                        <span className="text-xl w-8 text-center">{item.icon}</span>
                                        <span className="font-body text-base">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}

                    {/* Admin Link */}
                    {profile?.role === "admin" && (
                        <Link
                            href="/admin/dashboard"
                            onClick={onClose}
                            className="flex items-center gap-4 px-6 py-3 hover:bg-red-50 transition-colors text-red-600"
                        >
                            <span className="text-xl w-8 text-center">⚙️</span>
                            <span className="font-heading text-base uppercase">Admin Dashboard</span>
                        </Link>
                    )}
                </div>

                {/* Footer Section */}
                <div className="border-t-4 border-black p-4 space-y-3">
                    {/* Language Switch */}
                    <button
                        onClick={switchLanguage}
                        disabled={isChangingLocale}
                        className="w-full flex items-center gap-4 px-4 py-3 border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <span className="text-xl">{locale === "de" ? "🇩🇪" : "🇬🇧"}</span>
                        <span className="font-body">
                            {isChangingLocale 
                                ? "Loading..." 
                                : locale === "de" 
                                    ? "Switch to English" 
                                    : "Zu Deutsch wechseln"
                            }
                        </span>
                    </button>

                    {/* Settings */}
                    {user && (
                        <Link
                            href="/profile/settings"
                            onClick={onClose}
                            className="flex items-center gap-4 px-4 py-3 border-2 border-black hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-xl">⚙️</span>
                            <span className="font-body">Einstellungen</span>
                        </Link>
                    )}

                    {/* Logout */}
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-3 border-2 border-black hover:bg-red-50 transition-colors text-red-600"
                        >
                            <span className="text-xl">👋</span>
                            <span className="font-body">Logout</span>
                        </button>
                    )}

                    {/* Legal Links */}
                    <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2 text-xs text-gray-500">
                        <Link href="/legal/impressum" onClick={onClose} className="hover:text-black">
                            Impressum
                        </Link>
                        <span>•</span>
                        <Link href="/legal/datenschutz" onClick={onClose} className="hover:text-black">
                            Datenschutz
                        </Link>
                        <span>•</span>
                        <Link href="/legal/agb" onClick={onClose} className="hover:text-black">
                            AGB
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

// Animation keyframes need to be added to globals.css
// @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slide-in-left { from { transform: translateX(-100%); } to { transform: translateX(0); } }

export default MobileDrawer;

