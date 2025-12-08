"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";

export default function UeberUnsPage() {
    const t = useTranslations('pages.ueberUns');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Hero */}
                <h1 className="text-5xl md:text-6xl font-heading mb-4 text-center">{t('title')}</h1>
                <p className="text-2xl md:text-3xl font-heading text-center mb-8 text-accent">
                    {t('tagline')}
                </p>
                
                <div className="space-y-16 font-body text-lg leading-relaxed">
                    {/* Intro */}
                    <section className="text-center max-w-4xl mx-auto">
                        <p className="text-xl text-gray-700 leading-relaxed">
                            {t('intro')}
                        </p>
                    </section>

                    {/* Early Access Banner */}
                    <section className="bg-accent/10 border-4 border-accent p-8 text-center">
                        <p className="text-lg leading-relaxed">
                            {t('earlyAccess')}
                        </p>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Mission */}
                    <section>
                        <h2 className="text-4xl font-heading mb-4">{t('mission.title')}</h2>
                        <p className="text-xl font-semibold text-gray-700 mb-8">{t('mission.subtitle')}</p>
                        
                        <div className="space-y-6">
                            <p>{t('mission.text1')}</p>
                            <p>{t('mission.text2')}</p>
                            <p>{t('mission.text3')}</p>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Was macht Varbe anders? */}
                    <section>
                        <h2 className="text-4xl font-heading mb-12 text-center">{t('different.title')}</h2>
                        
                        {/* Discovery Feed */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-heading mb-4 flex items-center gap-3">
                                <span className="text-3xl">📱</span>
                                {t('different.discovery.title')}
                            </h3>
                            <p className="mb-4">{t('different.discovery.text1')}</p>
                            <p>{t('different.discovery.text2')}</p>
                        </div>

                        {/* Stories */}
                        <div className="mb-12 bg-gray-50 p-8 border-4 border-black">
                            <h3 className="text-2xl font-heading mb-4 flex items-center gap-3">
                                <span className="text-3xl">🎙️</span>
                                {t('different.stories.title')}
                            </h3>
                            <p className="mb-4">{t('different.stories.text1')}</p>
                            <p>{t('different.stories.text2')}</p>
                        </div>

                        {/* Local Art Radar */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-heading mb-4 flex items-center gap-3">
                                <span className="text-3xl">📍</span>
                                {t('different.local.title')}
                            </h3>
                            <p className="mb-4">{t('different.local.text1')}</p>
                            <p>{t('different.local.text2')}</p>
                        </div>

                        {/* Community */}
                        <div className="bg-accent/10 p-8 border-4 border-black">
                            <h3 className="text-2xl font-heading mb-4 flex items-center gap-3">
                                <span className="text-3xl">👥</span>
                                {t('different.community.title')}
                            </h3>
                            <p className="mb-4">{t('different.community.text1')}</p>
                            <p className="mb-4">{t('different.community.text2')}</p>
                            <p>{t('different.community.text3')}</p>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Warum Varbe besser ist */}
                    <section>
                        <h2 className="text-4xl font-heading mb-12 text-center">{t('better.title')}</h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* AI-Free */}
                            <div className="card-comic bg-white p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4 text-red-600">
                                    🚫 {t('better.aiFree.title')}
                                </h3>
                                <p>{t('better.aiFree.text')}</p>
                            </div>

                            {/* Fair Fees */}
                            <div className="card-comic bg-accent p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">
                                    💰 {t('better.fairFees.title')}
                                </h3>
                                <p className="mb-4">{t('better.fairFees.text1')}</p>
                                <p>{t('better.fairFees.text2')}</p>
                            </div>

                            {/* Buyer Protection */}
                            <div className="card-comic bg-accent p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">
                                    🛡️ {t('better.protection.title')}
                                </h3>
                                <p>{t('better.protection.text')}</p>
                            </div>

                            {/* No Algorithm Hell */}
                            <div className="card-comic bg-white p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">
                                    ✨ {t('better.noAlgorithm.title')}
                                </h3>
                                <p>{t('better.noAlgorithm.text')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Unsere Story */}
                    <section className="bg-black text-white p-8 md:p-12">
                        <h2 className="text-4xl font-heading mb-8 text-accent">{t('story.title')}</h2>
                        <div className="space-y-6">
                            <p>{t('story.text1')}</p>
                            <p>{t('story.text2')}</p>
                            <p>{t('story.text3')}</p>
                            <p>{t('story.text4')}</p>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Der aktuelle Stand */}
                    <section>
                        <h2 className="text-4xl font-heading mb-8">{t('status.title')}</h2>
                        <div className="bg-accent/20 p-8 border-4 border-accent mb-8">
                            <p className="text-xl font-semibold mb-4">{t('status.intro')}</p>
                        </div>
                        <div className="space-y-6">
                            <p>{t('status.text1')}</p>
                            <p>{t('status.text2')}</p>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Die Features im Detail */}
                    <section>
                        <h2 className="text-4xl font-heading mb-12 text-center">{t('features.title')}</h2>
                        
                        <div className="space-y-8">
                            <div className="border-4 border-black p-6">
                                <h3 className="text-2xl font-heading mb-4 flex items-center gap-3">
                                    <span className="bg-accent px-3 py-1 text-sm">{t('features.discovery.badge')}</span>
                                    {t('features.discovery.title')}
                                </h3>
                                <p>{t('features.discovery.text')}</p>
                            </div>

                            <div className="border-4 border-black p-6 bg-gray-50">
                                <h3 className="text-2xl font-heading mb-4">{t('features.profiles.title')}</h3>
                                <p>{t('features.profiles.text')}</p>
                            </div>

                            <div className="border-4 border-black p-6">
                                <h3 className="text-2xl font-heading mb-4">{t('features.community.title')}</h3>
                                <p>{t('features.community.text')}</p>
                            </div>

                            <div className="border-4 border-black p-6 bg-gray-50">
                                <h3 className="text-2xl font-heading mb-4 flex items-center gap-3">
                                    <span className="bg-gray-300 px-3 py-1 text-sm">{t('features.marketplace.badge')}</span>
                                    {t('features.marketplace.title')}
                                </h3>
                                <p>{t('features.marketplace.text')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Werde Teil der Varbe-Community */}
                    <section>
                        <h2 className="text-4xl font-heading mb-12 text-center">{t('join.title')}</h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Für Künstler */}
                            <div className="bg-accent p-8 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-6">{t('join.artists.title')}</h3>
                                <p className="mb-6">{t('join.artists.text')}</p>
                                <p className="font-semibold">{t('join.artists.benefits')}</p>
                            </div>

                            {/* Für Kunstliebhaber */}
                            <div className="bg-white p-8 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-6">{t('join.lovers.title')}</h3>
                                <p>{t('join.lovers.text')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Was kommt als Nächstes? */}
                    <section>
                        <h2 className="text-4xl font-heading mb-8">{t('next.title')}</h2>
                        <p className="mb-6">{t('next.text')}</p>
                        <p>{t('next.updates')}</p>
                    </section>

                    {/* Divider */}
                    <hr className="border-t-4 border-black" />

                    {/* Kontakt */}
                    <section className="text-center">
                        <h2 className="text-4xl font-heading mb-6">{t('contact.title')}</h2>
                        <p className="text-xl mb-4">{t('contact.subtitle')}</p>
                        <p className="text-lg mb-8">
                            {t('contact.email')}: <a href="mailto:info@varbe.org" className="text-accent underline font-bold">info@varbe.org</a>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center text-lg">
                            <span>Blog: <Link href="/blog" className="text-accent underline">varbe.org/blog</Link></span>
                            <span>Community Chat: <Link href="/chatrooms" className="text-accent underline">varbe.org/chatrooms</Link></span>
                        </div>
                    </section>

                    {/* CTA Buttons */}
                    <section className="bg-black text-white p-12 text-center">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <Link href="/auth/signup">
                                <Button variant="accent" className="text-xl px-8 py-4 w-full sm:w-auto">
                                    {t('cta.join')}
                                </Button>
                            </Link>
                            <Link href="/blog">
                                <Button variant="primary" className="text-xl px-8 py-4 w-full sm:w-auto">
                                    {t('cta.blog')}
                                </Button>
                            </Link>
                            <Link href="/chatrooms">
                                <Button variant="primary" className="text-xl px-8 py-4 w-full sm:w-auto">
                                    {t('cta.chat')}
                                </Button>
                            </Link>
                        </div>
                        <p className="text-xl font-heading text-accent">
                            {t('cta.slogan')}
                        </p>
                    </section>

                    {/* Trust Badges */}
                    <section className="text-center">
                        <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
                            <span className="bg-red-100 text-red-800 px-4 py-2 border-2 border-red-800">
                                🚫 {t('badges.noAi')}
                            </span>
                            <span className="bg-green-100 text-green-800 px-4 py-2 border-2 border-green-800">
                                💰 {t('badges.fees')}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-4 py-2 border-2 border-blue-800">
                                👥 {t('badges.owned')}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-4 py-2 border-2 border-purple-800">
                                📍 {t('badges.local')}
                            </span>
                            <span className="bg-accent text-black px-4 py-2 border-2 border-black">
                                ✅ {t('badges.earlyAccess')}
                            </span>
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}
