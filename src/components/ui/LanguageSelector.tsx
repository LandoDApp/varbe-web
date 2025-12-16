"use client";

import { useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";

const LANGUAGE_SELECTED_KEY = "varbe_language_selected";

interface LanguageSelectorProps {
    children: React.ReactNode;
}

export function LanguageSelector({ children }: LanguageSelectorProps) {
    const router = useRouter();
    const [showSelector, setShowSelector] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Check if user has already selected a language
        const hasSelectedLanguage = localStorage.getItem(LANGUAGE_SELECTED_KEY);
        
        if (!hasSelectedLanguage) {
            setShowSelector(true);
        }
    }, []);

    const handleLanguageSelect = (locale: 'de' | 'en') => {
        // Save selection to localStorage
        localStorage.setItem(LANGUAGE_SELECTED_KEY, locale);
        setShowSelector(false);
        
        // Redirect to the selected locale
        if (locale === 'en') {
            router.replace('/feed');
        } else {
            // For German, go to feed (default locale)
            router.replace('/feed');
        }
        
        // Force reload to apply locale
        window.location.href = `/${locale}/feed`;
    };

    // Don't render anything until mounted (to avoid hydration mismatch)
    if (!mounted) {
        return null;
    }

    // Show language selector if needed
    if (showSelector) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                <div className="w-full max-w-md mx-4 text-center">
                    {/* Logo */}
                    <div className="mb-12">
                        <h1 className="font-heading text-6xl md:text-7xl tracking-widest text-white mb-2">
                            VARBE
                        </h1>
                        <div className="h-2 w-32 bg-accent mx-auto"></div>
                    </div>

                    {/* Question */}
                    <p className="text-white text-xl md:text-2xl font-body mb-10">
                        Choose your language
                    </p>

                    {/* Language Buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={() => handleLanguageSelect('en')}
                            className="w-full py-5 px-8 bg-white border-4 border-black font-heading text-xl uppercase shadow-[6px_6px_0px_0px_rgba(204,255,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(204,255,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(204,255,0,1)]"
                        >
                            <span className="mr-3">🇺🇸</span>
                            English
                        </button>

                        <button
                            onClick={() => handleLanguageSelect('de')}
                            className="w-full py-5 px-8 bg-white border-4 border-black font-heading text-xl uppercase shadow-[6px_6px_0px_0px_rgba(204,255,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(204,255,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(204,255,0,1)]"
                        >
                            <span className="mr-3">🇩🇪</span>
                            Deutsch
                        </button>
                    </div>

                    {/* Tagline */}
                    <p className="text-gray-500 text-sm mt-12 font-body">
                        The artist community for real art. No AI.
                    </p>
                </div>
            </div>
        );
    }

    // Render children if language is already selected
    return <>{children}</>;
}

export default LanguageSelector;

