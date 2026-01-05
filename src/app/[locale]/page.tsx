"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function Home() {
    const t = useTranslations('home');

    return (
        <main className="min-h-screen bg-transparent">
            {/* Navigation */}
            <Navbar />

            {/* =========================================
                HERO SECTION
            ========================================= */}
            <section className="relative bg-halftone bg-[length:20px_20px] py-16 md:py-24 lg:py-32 overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-heading leading-[0.9] tracking-wide mb-6 md:mb-8">
                        <span className="block" style={{ textShadow: '3px 3px 0px #CCFF00' }}>{t('hero.line1')}</span>
                        <span className="block" style={{ textShadow: '3px 3px 0px #FF10F0' }}>{t('hero.line2')}</span>
                        <span className="block" style={{ textShadow: '3px 3px 0px #CCFF00' }}>{t('hero.line3')}</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-base md:text-lg lg:text-xl font-body text-gray-700 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
                        {t('hero.description')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 md:mb-16">
                        <Link href="/auth/register">
                            <Button variant="accent" className="w-full sm:w-auto text-lg md:text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                {t('hero.joinNow')}
                            </Button>
                        </Link>
                        <Link href="/feed">
                            <Button variant="primary" className="w-full sm:w-auto text-lg md:text-xl px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                {t('hero.discoverFeed')}
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
                        <div className="bg-accent px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-2">
                            <span className="text-lg">🚫</span>
                            <span className="font-heading text-sm md:text-base uppercase">{t('badges.noAi')}</span>
                        </div>
                        <div className="bg-accent px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <span className="font-heading text-sm md:text-base uppercase">{t('badges.lowFees')}</span>
                        </div>
                        <div className="bg-accent px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            <span className="font-heading text-sm md:text-base uppercase">{t('badges.artistOwned')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================
                PROBLEM / SOLUTION SECTION
            ========================================= */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    {/* Section Headline */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-center mb-12 md:mb-16 leading-tight">
                        {t('problems.title')}
                    </h2>

                    {/* Problem Cards */}
                    <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                        <div className="card-comic p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <div className="text-5xl md:text-6xl mb-4">🤖</div>
                            <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase">{t('problems.ai.title')}</h3>
                            <p className="font-body text-gray-700 leading-relaxed">
                                {t('problems.ai.desc')}
                            </p>
                        </div>
                        <div className="card-comic p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <div className="text-5xl md:text-6xl mb-4">📊</div>
                            <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase">{t('problems.algorithm.title')}</h3>
                            <p className="font-body text-gray-700 leading-relaxed">
                                {t('problems.algorithm.desc')}
                            </p>
                        </div>
                        <div className="card-comic p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <div className="text-5xl md:text-6xl mb-4">💸</div>
                            <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase">{t('problems.fees.title')}</h3>
                            <p className="font-body text-gray-700 leading-relaxed">
                                {t('problems.fees.desc')}
                            </p>
                        </div>
                    </div>

                </div>
                
                {/* Divider - Full Width */}
                <div className="bg-accent border-y-4 border-black py-8 md:py-10 text-center mb-12 md:mb-16">
                    <p className="font-heading text-2xl md:text-4xl uppercase">{t('butNotHere')}</p>
                    <p className="font-heading text-3xl md:text-4xl mt-2">↓ ↓ ↓</p>
                </div>
                
                <div className="container mx-auto px-4">

                    {/* Solution Cards */}
                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        <div className="card-comic bg-white p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-5xl md:text-6xl mb-4">✅</div>
                            <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase">{t('solutions.aiFree.title')}</h3>
                            <p className="font-body text-gray-700 leading-relaxed">
                                {t('solutions.aiFree.desc')}
                            </p>
                        </div>
                        <div className="card-comic bg-white p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-5xl md:text-6xl mb-4">❤️</div>
                            <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase">{t('solutions.noAlgo.title')}</h3>
                            <p className="font-body text-gray-700 leading-relaxed">
                                {t('solutions.noAlgo.desc')}
                            </p>
                        </div>
                        <div className="card-comic bg-white p-6 md:p-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-5xl md:text-6xl mb-4">💎</div>
                            <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase">{t('solutions.fairFees.title')}</h3>
                            <p className="font-body text-gray-700 leading-relaxed">
                                {t('solutions.fairFees.desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================================
                FEATURES SHOWCASE
            ========================================= */}
            <section className="bg-accent py-16 md:py-24 border-y-4 border-black">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-center mb-12 md:mb-16 uppercase">
                        {t('features.title')}
                    </h2>

                    {/* Feature Cards - Horizontal Scroll on Mobile */}
                    <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-0">
                        {/* Feature 1: Swipe Discovery */}
                        <div className="flex-shrink-0 w-[280px] md:w-auto snap-center">
                            <div className="bg-white h-full p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                                <div className="text-5xl md:text-6xl mb-6 text-center">👆📱</div>
                                <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase text-center">{t('features.swipe.title')}</h3>
                                <p className="font-body text-gray-700 leading-relaxed text-center mb-6">
                                    {t('features.swipe.desc')}
                                </p>
                                <Link href="/feed" className="block text-center">
                                    <span className="font-heading text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.swipe.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Feature 2: Local Radar */}
                        <div className="flex-shrink-0 w-[280px] md:w-auto snap-center">
                            <div className="bg-white h-full p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                                <div className="text-5xl md:text-6xl mb-6 text-center">📍🗺️</div>
                                <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase text-center">{t('features.local.title')}</h3>
                                <p className="font-body text-gray-700 leading-relaxed text-center mb-6">
                                    {t('features.local.desc')}
                                </p>
                                <Link href="/local" className="block text-center">
                                    <span className="font-heading text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.local.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Feature 3: Story-Driven */}
                        <div className="flex-shrink-0 w-[280px] md:w-auto snap-center">
                            <div className="bg-white h-full p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                                <div className="text-5xl md:text-6xl mb-6 text-center">🎙️📖</div>
                                <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase text-center">{t('features.story.title')}</h3>
                                <p className="font-body text-gray-700 leading-relaxed text-center mb-6">
                                    {t('features.story.desc')}
                                </p>
                                <Link href="/feed" className="block text-center">
                                    <span className="font-heading text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.story.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Feature 4: Challenges */}
                        <div className="flex-shrink-0 w-[280px] md:w-auto snap-center">
                            <div className="bg-white h-full p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                                <div className="text-5xl md:text-6xl mb-6 text-center">🏆🎨</div>
                                <h3 className="font-heading text-xl md:text-2xl mb-4 uppercase text-center">{t('features.challenges.title')}</h3>
                                <p className="font-body text-gray-700 leading-relaxed text-center mb-6">
                                    {t('features.challenges.desc')}
                                </p>
                                <Link href="/challenges" className="block text-center">
                                    <span className="font-heading text-sm uppercase underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4">
                                        {t('features.challenges.link')}
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator for Mobile */}
                    <div className="flex md:hidden justify-center gap-2 mt-6">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                        <div className="w-2 h-2 bg-black/30 rounded-full"></div>
                        <div className="w-2 h-2 bg-black/30 rounded-full"></div>
                        <div className="w-2 h-2 bg-black/30 rounded-full"></div>
                    </div>
                </div>
            </section>

            {/* =========================================
                COMMUNITY PROMISE
            ========================================= */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-center mb-12 md:mb-16 uppercase">
                        {t('promise.title')}
                    </h2>

                    {/* Promise Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10">
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl mb-4">🚫🤖</div>
                            <p className="font-heading text-xl md:text-2xl uppercase mb-2">
                                {t('promise.noAi.title')}
                            </p>
                            <p className="font-body text-gray-600">
                                {t('promise.noAi.desc')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl mb-4">💰</div>
                            <p className="font-heading text-xl md:text-2xl uppercase mb-2">
                                {t('promise.forYou.title')}
                            </p>
                            <p className="font-body text-gray-600">
                                {t('promise.forYou.desc')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl mb-4">👥</div>
                            <p className="font-heading text-xl md:text-2xl uppercase mb-2">
                                {t('promise.community.title')}
                            </p>
                            <p className="font-body text-gray-600">
                                {t('promise.community.desc')}
                            </p>
                        </div>
                    </div>

                    {/* Subtext */}
                    <p className="font-body text-lg md:text-xl text-gray-600 text-center italic">
                        {t('promise.subtext')}
                    </p>
                </div>
            </section>

            {/* =========================================
                FINAL CTA SECTION
            ========================================= */}
            <section className="bg-accent py-16 md:py-24 border-y-4 border-black">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading mb-4 md:mb-6 uppercase">
                        {t('cta.title')}
                    </h2>
                    <p className="font-body text-lg md:text-xl text-gray-800 max-w-xl mx-auto mb-10">
                        {t('cta.description')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/register">
                            <Button variant="primary" className="w-full sm:w-auto px-8 py-4 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {t('cta.registerButton')}
                            </Button>
                        </Link>
                        <Link href="/feed">
                            <Button variant="secondary" className="w-full sm:w-auto px-8 py-4 text-lg bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(204,255,0,1)]">
                                {t('cta.discoverButton')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </main>
    );
}
