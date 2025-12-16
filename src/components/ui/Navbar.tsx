"use client";

import { Link, useRouter, usePathname } from "@/i18n/routing";
import { Button } from "./Button";
import { useAuth } from "@/context/AuthContext";
import { Notifications } from "./Notifications";
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Navbar skeleton for SSR/initial render
function NavbarSkeleton() {
    return (
        <nav className="border-b-4 border-black bg-[#fafafa]/90 backdrop-blur-md p-4 sticky top-0 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <span className="text-2xl md:text-3xl font-heading uppercase tracking-widest">VARBE</span>
                <div className="hidden md:flex items-center gap-4">
                    <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
                    <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
                </div>
            </div>
        </nav>
    );
}

export function Navbar() {
    const [mounted, setMounted] = useState(false);
    
    // Ensure this only runs on client
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Show skeleton during SSR and initial hydration
    if (!mounted) {
        return <NavbarSkeleton />;
    }
    
    return <NavbarClient />;
}

function NavbarClient() {
    const { user, profile, loading } = useAuth();
    const t = useTranslations('nav');
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const currentLocale = useLocale();
    const locale = (params?.locale as string) || currentLocale;
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isChangingLocale, setIsChangingLocale] = useState(false);

    const switchLanguage = () => {
        const newLocale = locale === 'de' ? 'en' : 'de';
        setIsChangingLocale(true);
        
        // Get the current path without the locale prefix
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/(de|en)/, '') || '/';
        
        // Navigate to the new locale
        window.location.href = `/${newLocale}${pathWithoutLocale}${window.location.search}`;
    };

    return (
        <nav className="border-b-4 border-black bg-[#fafafa]/90 backdrop-blur-md p-4 sticky top-0 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0 group">
                    <span className="text-2xl md:text-3xl font-heading uppercase tracking-widest relative">
                        VARBE
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-accent animate-pulse"></span>
                    </span>
                </Link>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 border-2 border-black bg-white hover:bg-accent transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                {/* Desktop Search Bar */}
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (searchQuery.trim()) {
                            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                            setSearchQuery("");
                        }
                    }}
                    className="hidden md:flex relative flex-1 max-w-md mx-4"
                >
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-black bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                    <button
                        type="submit"
                        className="absolute right-0 top-0 bottom-0 px-3 bg-accent border-l-2 border-black font-heading text-sm hover:bg-yellow-400 transition-colors"
                    >
                        {t('search')}
                    </button>
                </form>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4 font-heading text-base flex-shrink-0">
                    <Link 
                        href="/feed" 
                        className="relative group"
                    >
                        <span className="uppercase">FEED</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    <Link 
                        href="/local" 
                        className="relative group"
                    >
                        <span className="uppercase">LOCAL</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    <Link 
                        href="/challenges" 
                        className="relative group"
                    >
                        <span className="uppercase">CHALLENGES</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    <Link 
                        href="/chatrooms" 
                        className="relative group"
                    >
                        <span className="uppercase">CHAT</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    <Link 
                        href="/jobs" 
                        className="relative group"
                    >
                        <span className="uppercase">JOBS</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    <Link 
                        href="/blog" 
                        className="relative group"
                    >
                        <span className="uppercase">BLOG</span>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                    </Link>
                    
                    {profile?.role === 'admin' && (
                        <Link href="/admin/dashboard" className="text-red-600 uppercase">
                            ADMIN
                        </Link>
                    )}
                    {/* Artist Dashboard temporarily disabled
                    {(profile?.verificationStatus === 'verified' || profile?.role === 'seller') && (
                        <Link 
                            href="/artist/dashboard" 
                            className="relative group"
                        >
                            <span className="uppercase">DASHBOARD</span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
                        </Link>
                    )}
                    */}
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    {user && (
                        <>
                            <Link href="/messages" className="relative p-2 hover:bg-gray-100 transition-colors" title={t('messages')}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </Link>
                            <Notifications />
                        </>
                    )}
                    
                    <button
                        onClick={switchLanguage}
                        disabled={isChangingLocale}
                        className={`px-2 py-1 border-2 border-black bg-white hover:bg-accent transition-colors font-heading text-sm uppercase ${isChangingLocale ? 'opacity-50 cursor-wait' : ''}`}
                        title={locale === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
                    >
                        {isChangingLocale ? '...' : (locale === 'de' ? '🇩🇪 DE' : '🇬🇧 EN')}
                    </button>
                    
                    {loading && !user ? (
                        <div className="w-24 h-10 bg-gray-200 animate-pulse" />
                    ) : user ? (
                        <Link href="/profile">
                            <Button variant="primary" className="text-sm px-4 py-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full border border-black" />
                                {user.email?.split('@')[0] || t('profile')}
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login">
                                <Button variant="primary" className="text-sm px-4 py-2 bg-white border-2 border-black text-black">
                                    {t('login')}
                                </Button>
                            </Link>
                            <Link href="/app-coming-soon">
                                <Button variant="accent" className="text-sm px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    APP ↓
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b-4 border-black shadow-lg z-40">
                    <div className="container mx-auto px-4 py-6 space-y-4">
                        {/* Mobile Search Bar */}
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (searchQuery.trim()) {
                                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                    setMobileMenuOpen(false);
                                }
                            }}
                            className="relative mb-4"
                        >
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-comic w-full pl-10 pr-4 py-2 text-sm"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
                        </form>
                        
                        <Link 
                            href="/local" 
                            className="block font-heading text-xl py-2 border-b-2 border-gray-200 uppercase"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            LOCAL
                        </Link>
                        <Link 
                            href="/challenges" 
                            className="block font-heading text-xl py-2 border-b-2 border-gray-200 uppercase"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            CHALLENGES
                        </Link>
                        <Link 
                            href="/chatrooms" 
                            className="block font-heading text-xl py-2 border-b-2 border-gray-200 uppercase"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            CHAT
                        </Link>
                        <Link 
                            href="/jobs" 
                            className="block font-heading text-xl py-2 border-b-2 border-gray-200 uppercase"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            JOBS
                        </Link>
                        <Link 
                            href="/blog" 
                            className="block font-heading text-xl py-2 border-b-2 border-gray-200 uppercase"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            BLOG
                        </Link>
                        
                        {profile?.role === 'admin' && (
                            <Link 
                                href="/admin/dashboard" 
                                className="block font-heading text-xl py-2 border-b-2 border-gray-200 text-red-600 uppercase"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                ADMIN
                            </Link>
                        )}
                        {/* Artist Dashboard temporarily disabled
                        {(profile?.verificationStatus === 'verified' || profile?.role === 'seller') && (
                            <Link 
                                href="/artist/dashboard" 
                                className="block font-heading text-xl py-2 border-b-2 border-gray-200 uppercase"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                DASHBOARD
                            </Link>
                        )}
                        */}
                        
                        <div className="pt-4 space-y-3 border-t-4 border-black">
                            {user && (
                                <>
                                    <Link 
                                        href="/messages" 
                                        className="flex items-center gap-2 font-heading text-lg py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {t('messages')}
                                    </Link>
                                    <div className="flex items-center justify-center">
                                        <Notifications />
                                    </div>
                                </>
                            )}
                            {loading && !user ? (
                                <div className="w-full h-10 bg-gray-200 animate-pulse" />
                            ) : user ? (
                                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="primary" className="w-full text-lg px-4 py-3 flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full border border-black" />
                                        {user.email?.split('@')[0] || t('profile')}
                                    </Button>
                                </Link>
                            ) : (
                                <div className="space-y-3">
                                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="primary" className="w-full text-lg px-4 py-3">
                                            ANMELDEN
                                        </Button>
                                    </Link>
                                    <Link href="/app-coming-soon" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="accent" className="w-full text-lg px-4 py-3">
                                            APP DOWNLOADEN ↓
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t-2 border-gray-200">
                            <button
                                onClick={() => {
                                    switchLanguage();
                                    setMobileMenuOpen(false);
                                }}
                                disabled={isChangingLocale}
                                className={`w-full px-4 py-2 border-2 border-black bg-white hover:bg-accent transition-colors font-heading text-sm uppercase text-center ${isChangingLocale ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {isChangingLocale ? 'Loading...' : (locale === 'de' ? '🇬🇧 Switch to English' : '🇩🇪 Zu Deutsch wechseln')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

