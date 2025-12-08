"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { MobileDrawer } from "@/components/ui/MobileDrawer";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useState } from "react";

// Category icons for the horizontal scroll
const categories = [
    { id: 'malerei', icon: '🎨', label: 'Malerei', href: '/malerei' },
    { id: 'fotografie', icon: '📷', label: 'Foto', href: '/fotografie' },
    { id: 'skulptur', icon: '🗿', label: 'Skulptur', href: '/skulptur' },
    { id: 'digital', icon: '💻', label: 'Digital', href: '/digital-art' },
    { id: 'zeichnung', icon: '✏️', label: 'Zeichnung', href: '/zeichnung' },
    { id: 'mixed', icon: '🎭', label: 'Mixed', href: '/mixed-media' },
    { id: 'kunsthandwerk', icon: '🏺', label: 'Handwerk', href: '/kunsthandwerk' },
];

// Quick navigation links for mobile
const quickLinks = [
    { href: '/local', icon: '📍', label: 'LOCAL' },
    { href: '/challenges', icon: '🏆', label: 'CHALLENGES' },
    { href: '/chatrooms', icon: '💬', label: 'CHAT' },
    { href: '/jobs', icon: '💼', label: 'JOBS' },
    { href: '/blog', icon: '📰', label: 'BLOG' },
    { href: '/kuenstler', icon: '🎨', label: 'KÜNSTLER' },
];

export default function Home() {
    const t = useTranslations('home');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <main className="min-h-screen bg-transparent">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Header with Hamburger Menu */}
            <header className="md:hidden h-14 bg-white border-b-4 border-black flex items-center justify-between px-4 sticky top-0 z-sticky safe-area-top">
                {/* Hamburger Menu Button */}
                <button 
                    onClick={() => setDrawerOpen(true)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95"
                    aria-label="Menü öffnen"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <span className="font-heading text-2xl tracking-widest relative">
                        VARBE
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-accent"></span>
                    </span>
                </Link>

                {/* Notification Bell */}
                <Link 
                    href="/search"
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label="Suchen"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </Link>
            </header>

            {/* Mobile Drawer */}
            <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

            {/* =========================================
                MOBILE QUICK NAVIGATION
            ========================================= */}
            <section className="md:hidden py-3 bg-white border-b-2 border-gray-200">
                <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-2 border-black text-xs font-heading hover:bg-accent transition-colors active:scale-95"
                        >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* =========================================
                HERO SECTION - Mobile Optimized
            ========================================= */}
            <section className="relative bg-halftone bg-[length:20px_20px] py-12 md:py-24 lg:py-32 overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    {/* Main Headline - Responsive sizing */}
                    <h1 className="text-h1 mobile-m:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-heading leading-[0.9] tracking-wide mb-4 md:mb-8">
                        <span className="block" style={{ textShadow: '3px 3px 0px #CCFF00' }}>{t('hero.line1')}</span>
                        <span className="block" style={{ textShadow: '3px 3px 0px #FF10F0' }}>{t('hero.line2')}</span>
                        <span className="block" style={{ textShadow: '3px 3px 0px #CCFF00' }}>{t('hero.line3')}</span>
                    </h1>

                    {/* Subheadline - Mobile optimized */}
                    <p className="text-body md:text-lg lg:text-xl font-body text-gray-700 max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed px-2">
                        {t('hero.description')}
                    </p>

                    {/* CTA Buttons - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-16 px-4">
                        <Link href="/auth/register" className="w-full sm:w-auto">
                            <Button variant="accent" className="w-full sm:w-auto text-base md:text-xl px-6 md:px-8 py-3 md:py-4">
                                {t('hero.joinNow')}
                            </Button>
                        </Link>
                        <Link href="/artist/become" className="w-full sm:w-auto">
                            <Button variant="secondary" className="w-full sm:w-auto text-base md:text-xl px-6 md:px-8 py-3 md:py-4">
                                {t('hero.becomeArtist')}
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Badges - Horizontal scroll on mobile */}
                    <div className="flex flex-wrap gap-2 md:gap-4 justify-center px-2">
                        <div className="bg-accent px-3 py-1.5 md:px-4 md:py-2 border-2 border-black shadow-comic-sm inline-flex items-center gap-2">
                            <span className="text-base md:text-lg">🚫</span>
                            <span className="font-heading text-xs md:text-base uppercase">{t('badges.noAi')}</span>
                        </div>
                        <div className="bg-accent px-3 py-1.5 md:px-4 md:py-2 border-2 border-black shadow-comic-sm inline-flex items-center gap-2">
                            <span className="text-base md:text-lg">💰</span>
                            <span className="font-heading text-xs md:text-base uppercase">{t('badges.lowFees')}</span>
                        </div>
                        <div className="bg-accent px-3 py-1.5 md:px-4 md:py-2 border-2 border-black shadow-comic-sm inline-flex items-center gap-2">
                            <span className="text-base md:text-lg">👥</span>
                            <span className="font-heading text-xs md:text-base uppercase">{t('badges.artistOwned')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================
                CATEGORIES - Mobile Only
            ========================================= */}
            <section className="md:hidden py-6 border-y-4 border-black bg-white">
                <div className="container mx-auto">
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-4 mb-4">
                        <h2 className="font-heading text-lg uppercase">KATEGORIEN</h2>
                        <Link href="/kategorien" className="text-sm font-heading text-accent hover:underline">
                            Alle →
                        </Link>
                    </div>

                    {/* Horizontal Scroll */}
                    <div className="flex gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide snap-x snap-mandatory">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={cat.href}
                                className="flex-shrink-0 snap-center"
                            >
                                <div className="w-[68px] h-[68px] border-3 border-black bg-white shadow-comic-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center justify-center gap-1">
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="font-heading text-[10px] uppercase">{cat.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* =========================================
                PROBLEM / SOLUTION SECTION
            ========================================= */}
            <section className="py-10 md:py-24">
                <div className="container mx-auto px-4">
                    {/* Section Headline */}
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading text-center mb-8 md:mb-16 leading-tight">
                        {t('problems.title')}
                    </h2>

                    {/* Problem Cards - Stack on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16">
                        <div className="card-comic p-5 md:p-8">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">🤖</div>
                            <h3 className="font-heading text-lg md:text-2xl mb-2 md:mb-4 uppercase">{t('problems.ai.title')}</h3>
                            <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed">
                                {t('problems.ai.desc')}
                            </p>
                        </div>
                        <div className="card-comic p-5 md:p-8">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">📊</div>
                            <h3 className="font-heading text-lg md:text-2xl mb-2 md:mb-4 uppercase">{t('problems.algorithm.title')}</h3>
                            <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed">
                                {t('problems.algorithm.desc')}
                            </p>
                        </div>
                        <div className="card-comic p-5 md:p-8">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">💸</div>
                            <h3 className="font-heading text-lg md:text-2xl mb-2 md:mb-4 uppercase">{t('problems.fees.title')}</h3>
                            <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed">
                                {t('problems.fees.desc')}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Divider - Full Width */}
                <div className="bg-accent border-y-4 border-black py-6 md:py-10 text-center mb-8 md:mb-16">
                    <p className="font-heading text-xl md:text-4xl uppercase">{t('butNotHere')}</p>
                    <p className="font-heading text-2xl md:text-4xl mt-2">↓ ↓ ↓</p>
                </div>
                
                <div className="container mx-auto px-4">
                    {/* Solution Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        <div className="card-comic p-5 md:p-8">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">✅</div>
                            <h3 className="font-heading text-lg md:text-2xl mb-2 md:mb-4 uppercase">{t('solutions.aiFree.title')}</h3>
                            <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed">
                                {t('solutions.aiFree.desc')}
                            </p>
                        </div>
                        <div className="card-comic p-5 md:p-8">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">❤️</div>
                            <h3 className="font-heading text-lg md:text-2xl mb-2 md:mb-4 uppercase">{t('solutions.noAlgo.title')}</h3>
                            <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed">
                                {t('solutions.noAlgo.desc')}
                            </p>
                        </div>
                        <div className="card-comic p-5 md:p-8">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">💎</div>
                            <h3 className="font-heading text-lg md:text-2xl mb-2 md:mb-4 uppercase">{t('solutions.fairFees.title')}</h3>
                            <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed">
                                {t('solutions.fairFees.desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================
                FEATURES SHOWCASE - Horizontal scroll mobile
            ========================================= */}
            <section className="bg-accent py-10 md:py-24 border-y-4 border-black">
                <div className="container mx-auto">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading text-center mb-6 md:mb-16 uppercase px-4">
                        {t('features.title')}
                    </h2>

                    {/* Feature Cards - Horizontal Scroll on Mobile */}
                    <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory px-4 md:px-4">
                        {/* Feature 1: Swipe Discovery */}
                        <div className="flex-shrink-0 w-[260px] md:w-auto snap-center">
                            <div className="bg-white h-full p-5 md:p-8 border-4 border-black shadow-comic hover:shadow-comic-elevated hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <div className="text-4xl md:text-6xl mb-4 md:mb-6 text-center">👆📱</div>
                                <h3 className="font-heading text-lg md:text-2xl mb-3 md:mb-4 uppercase text-center">{t('features.swipe.title')}</h3>
                                <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed text-center mb-4 md:mb-6">
                                    {t('features.swipe.desc')}
                                </p>
                                <Link href="/feed" className="block text-center">
                                    <span className="font-heading text-xs md:text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.swipe.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Feature 2: Local Radar */}
                        <div className="flex-shrink-0 w-[260px] md:w-auto snap-center">
                            <div className="bg-white h-full p-5 md:p-8 border-4 border-black shadow-comic hover:shadow-comic-elevated hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <div className="text-4xl md:text-6xl mb-4 md:mb-6 text-center">📍🗺️</div>
                                <h3 className="font-heading text-lg md:text-2xl mb-3 md:mb-4 uppercase text-center">{t('features.local.title')}</h3>
                                <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed text-center mb-4 md:mb-6">
                                    {t('features.local.desc')}
                                </p>
                                <Link href="/local" className="block text-center">
                                    <span className="font-heading text-xs md:text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.local.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Feature 3: Story-Driven */}
                        <div className="flex-shrink-0 w-[260px] md:w-auto snap-center">
                            <div className="bg-white h-full p-5 md:p-8 border-4 border-black shadow-comic hover:shadow-comic-elevated hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <div className="text-4xl md:text-6xl mb-4 md:mb-6 text-center">🎙️📖</div>
                                <h3 className="font-heading text-lg md:text-2xl mb-3 md:mb-4 uppercase text-center">{t('features.story.title')}</h3>
                                <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed text-center mb-4 md:mb-6">
                                    {t('features.story.desc')}
                                </p>
                                <Link href="/feed" className="block text-center">
                                    <span className="font-heading text-xs md:text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.story.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Feature 4: Challenges */}
                        <div className="flex-shrink-0 w-[260px] md:w-auto snap-center">
                            <div className="bg-white h-full p-5 md:p-8 border-4 border-black shadow-comic hover:shadow-comic-elevated hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <div className="text-4xl md:text-6xl mb-4 md:mb-6 text-center">🏆🎨</div>
                                <h3 className="font-heading text-lg md:text-2xl mb-3 md:mb-4 uppercase text-center">{t('features.challenges.title')}</h3>
                                <p className="font-body text-sm md:text-base text-gray-700 leading-relaxed text-center mb-4 md:mb-6">
                                    {t('features.challenges.desc')}
                                </p>
                                <Link href="/challenges" className="block text-center">
                                    <span className="font-heading text-xs md:text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.challenges.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator for Mobile */}
                    <div className="flex md:hidden justify-center gap-2 mt-4">
                        {[0, 1, 2, 3].map((idx) => (
                            <div 
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    currentSlide === idx ? 'bg-black' : 'bg-black/30'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* =========================================
                COMMUNITY PROMISE
            ========================================= */}
            <section className="py-10 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading text-center mb-8 md:mb-16 uppercase">
                        {t('promise.title')}
                    </h2>

                    {/* Promise Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mb-6 md:mb-10">
                        <div className="text-center">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">🚫🤖</div>
                            <p className="font-heading text-lg md:text-2xl uppercase mb-1 md:mb-2">
                                {t('promise.noAi.title')}
                            </p>
                            <p className="font-body text-sm md:text-base text-gray-600">
                                {t('promise.noAi.desc')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">💰</div>
                            <p className="font-heading text-lg md:text-2xl uppercase mb-1 md:mb-2">
                                {t('promise.forYou.title')}
                            </p>
                            <p className="font-body text-sm md:text-base text-gray-600">
                                {t('promise.forYou.desc')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-6xl mb-3 md:mb-4">👥</div>
                            <p className="font-heading text-lg md:text-2xl uppercase mb-1 md:mb-2">
                                {t('promise.community.title')}
                            </p>
                            <p className="font-body text-sm md:text-base text-gray-600">
                                {t('promise.community.desc')}
                            </p>
                        </div>
                    </div>

                    {/* Subtext */}
                    <p className="font-body text-sm md:text-xl text-gray-600 text-center italic px-4">
                        {t('promise.subtext')}
                    </p>
                </div>
            </section>

            {/* =========================================
                FINAL CTA SECTION
            ========================================= */}
            <section className="bg-accent py-10 md:py-24 border-y-4 border-black">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-5xl lg:text-6xl font-heading mb-3 md:mb-6 uppercase">
                        {t('cta.title')}
                    </h2>
                    <p className="font-body text-sm md:text-xl text-gray-800 max-w-xl mx-auto mb-6 md:mb-10">
                        {t('cta.description')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                        <Link href="/auth/register" className="w-full sm:w-auto">
                            <Button variant="secondary" className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg">
                                {t('cta.registerButton')}
                            </Button>
                        </Link>
                        <Link href="/feed" className="w-full sm:w-auto">
                            <Button 
                                variant="secondary" 
                                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg bg-black text-white border-4 border-black"
                            >
                                {t('cta.discoverButton')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div className="pb-nav md:pb-0">
                <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </main>
    );
}
