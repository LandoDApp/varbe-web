"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { useTranslations } from 'next-intl';

export default function BecomeArtistPage() {
    const { user, profile } = useAuth();
    const t = useTranslations('becomeArtist');
    
    // Check if user is already verified
    const isVerified = profile?.verificationStatus === 'verified';
    const isPending = profile?.verificationStatus === 'pending';

    const features = [
        {
            icon: "📝",
            titleKey: "features.posts.title",
            descKey: "features.posts.desc",
            available: true
        },
        {
            icon: "🏆",
            titleKey: "features.challenges.title",
            descKey: "features.challenges.desc",
            available: true
        },
        {
            icon: "📅",
            titleKey: "features.events.title",
            descKey: "features.events.desc",
            available: true
        },
        {
            icon: "🎨",
            titleKey: "features.commissions.title",
            descKey: "features.commissions.desc",
            available: true
        },
        {
            icon: "🛒",
            titleKey: "features.marketplace.title",
            descKey: "features.marketplace.desc",
            available: false,
            comingSoon: "COMING SOON"
        }
    ];

    const benefits = [
        { titleKey: "benefits.badge.title", descKey: "benefits.badge.desc" },
        { titleKey: "benefits.posts.title", descKey: "benefits.posts.desc" },
        { titleKey: "benefits.events.title", descKey: "benefits.events.desc" },
        { titleKey: "benefits.challenges.title", descKey: "benefits.challenges.desc" },
        { titleKey: "benefits.noAi.title", descKey: "benefits.noAi.desc" },
        { titleKey: "benefits.fees.title", descKey: "benefits.fees.desc" }
    ];

    const steps = [
        { number: "01", titleKey: "steps.account.title", descKey: "steps.account.desc" },
        { number: "02", titleKey: "steps.verify.title", descKey: "steps.verify.desc" },
        { number: "03", titleKey: "steps.review.title", descKey: "steps.review.desc" },
        { number: "04", titleKey: "steps.start.title", descKey: "steps.start.desc" }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            {/* HERO SECTION */}
            <section className="relative bg-black text-white py-16 md:py-24 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle, #CCFF00 1px, transparent 1px)`,
                        backgroundSize: '30px 30px'
                    }} />
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-block mb-6">
                            <span className="bg-accent text-black font-heading text-sm px-4 py-2 border-2 border-accent">
                                🎨 {t('hero.badge')}
                            </span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading mb-6 leading-tight">
                            {t('hero.title1')}
                            <span className="block text-accent" style={{ textShadow: '3px 3px 0px #FF10F0' }}>
                                {t('hero.title2')}
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            {t('hero.description')}
                        </p>
                        
                        {/* CTA based on auth state */}
                        {!user ? (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/auth/register">
                                    <Button variant="accent" className="text-xl px-8 py-4">
                                        {t('cta.register')}
                                    </Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button variant="secondary" className="text-xl px-8 py-4 bg-white/10 border-white text-white hover:bg-white/20">
                                        {t('cta.login')}
                                    </Button>
                                </Link>
                            </div>
                        ) : isPending ? (
                            <div className="bg-yellow-500/20 border-2 border-yellow-500 px-6 py-4 inline-block">
                                <p className="font-heading text-yellow-400">⏳ {t('status.pending')}</p>
                                <p className="text-sm text-gray-400 mt-1">{t('status.pendingNote')}</p>
                            </div>
                        ) : isVerified ? (
                            <div className="bg-accent/20 border-2 border-accent px-6 py-4 inline-block">
                                <p className="font-heading text-accent">✅ {t('status.verified')}</p>
                                <Link href="/profile" className="text-sm text-white hover:underline mt-1 block">
                                    {t('status.toProfile')}
                                </Link>
                            </div>
                        ) : (
                            <Link href="/artist/verify">
                                <Button variant="accent" className="text-xl px-8 py-4">
                                    {t('cta.become')}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* WHAT CAN YOU DO SECTION */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-heading mb-4">
                            {t('whatCanYouDo.title')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            {t('whatCanYouDo.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <div 
                                key={idx}
                                className={`border-4 border-black p-6 ${
                                    feature.available 
                                        ? 'bg-white shadow-comic hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all' 
                                        : 'bg-gray-100 opacity-75'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <span className="text-4xl">{feature.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-heading text-lg">{t(feature.titleKey)}</h3>
                                            {feature.comingSoon && (
                                                <span className="bg-accent-pink text-white text-xs px-2 py-0.5 font-heading">
                                                    {feature.comingSoon}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{t(feature.descKey)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW TO BECOME SECTION */}
            <section className="py-16 md:py-24 bg-black text-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-heading mb-4">
                            {t('howTo.title')} <span className="text-accent">{t('howTo.titleHighlight')}</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            {t('howTo.subtitle')}
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {steps.map((step, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-white/5 border-2 border-white/20 p-6 relative"
                                >
                                    <span className="absolute -top-4 -left-4 bg-accent text-black font-heading text-2xl w-12 h-12 flex items-center justify-center border-2 border-black">
                                        {step.number}
                                    </span>
                                    <h3 className="font-heading text-xl mb-2 mt-2">{t(step.titleKey)}</h3>
                                    <p className="text-gray-400 text-sm">{t(step.descKey)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS SECTION */}
            <section className="py-16 md:py-24 bg-accent">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-heading mb-4">
                            {t('benefits.title')}
                        </h2>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                        {benefits.map((benefit, idx) => (
                            <div 
                                key={idx}
                                className="bg-white border-4 border-black p-4 flex items-start gap-4 shadow-comic"
                            >
                                <span className="text-2xl font-heading text-accent bg-black w-10 h-10 flex items-center justify-center flex-shrink-0">
                                    ✓
                                </span>
                                <div>
                                    <h3 className="font-heading text-base">{t(benefit.titleKey)}</h3>
                                    <p className="text-sm text-gray-600">{t(benefit.descKey)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHY VARBE SECTION */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-heading mb-4">
                                {t('whyVarbe.title')}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">🚫</span>
                                </div>
                                <h3 className="font-heading text-xl mb-2">{t('whyVarbe.noAi.title')}</h3>
                                <p className="text-sm text-gray-600">
                                    {t('whyVarbe.noAi.desc')}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">💰</span>
                                </div>
                                <h3 className="font-heading text-xl mb-2">{t('whyVarbe.fees.title')}</h3>
                                <p className="text-sm text-gray-600">
                                    {t('whyVarbe.fees.desc')}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">👥</span>
                                </div>
                                <h3 className="font-heading text-xl mb-2">{t('whyVarbe.community.title')}</h3>
                                <p className="text-sm text-gray-600">
                                    {t('whyVarbe.community.desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16 md:py-24 bg-black text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-heading mb-6">
                        {t('finalCta.title')} <span className="text-accent">{t('finalCta.titleHighlight')}</span>?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        {t('finalCta.description')}
                    </p>
                    
                    {!user ? (
                        <Link href="/auth/register">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                {t('cta.registerFree')}
                            </Button>
                        </Link>
                    ) : isPending ? (
                        <p className="text-yellow-400 font-heading">⏳ {t('status.pendingShort')}</p>
                    ) : isVerified ? (
                        <Link href="/feed/create">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                {t('cta.createPost')}
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/artist/verify">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                {t('cta.startVerify')}
                            </Button>
                        </Link>
                    )}
                </div>
            </section>

            {/* FAQ TEASER */}
            <section className="py-12 bg-gray-100 border-t-4 border-black">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-600">
                        {t('faq.questions')}{' '}
                        <Link href="/faq" className="text-accent font-bold hover:underline">
                            FAQ
                        </Link>
                        {' '}{t('faq.or')}{' '}
                        <a href="mailto:info@varbe.org" className="text-accent font-bold hover:underline">
                            info@varbe.org
                        </a>
                    </p>
                </div>
            </section>

            <Footer />
            <MobileBottomNav />
        </div>
    );
}
