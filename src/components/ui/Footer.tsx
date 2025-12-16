"use client";

import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

export function Footer() {
    const t = useTranslations('footer');
    const locale = useLocale();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    
    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) return;
        
        setStatus('loading');
        
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, locale, source: 'footer' }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus('success');
                setMessage(locale === 'de' ? '✅ Erfolgreich angemeldet!' : '✅ Successfully subscribed!');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(locale === 'de' ? '❌ Fehler beim Anmelden' : '❌ Failed to subscribe');
            }
        } catch (error) {
            setStatus('error');
            setMessage(locale === 'de' ? '❌ Fehler beim Anmelden' : '❌ Failed to subscribe');
        }
        
        // Reset status after 3 seconds
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 3000);
    };
    
    return (
        <footer className="bg-black text-white border-t-4 border-accent">
            <div className="container mx-auto px-4 py-12 md:py-16">
                {/* Top Section: Logo & Tagline + Newsletter */}
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12 pb-12 border-b-2 border-gray-800">
                    {/* Logo & Tagline */}
                    <div>
                        <h3 className="text-3xl md:text-4xl font-heading mb-2 text-white">VARBE</h3>
                        <p className="font-body text-sm uppercase tracking-widest text-gray-400 mb-6">
                            THE ARTIST'S PLATFORM
                        </p>
                        <p className="font-body text-gray-300 max-w-sm">
                            {t('tagline')}
                        </p>
                    </div>
                    
                    {/* Newsletter Signup */}
                    <div>
                        <h4 className="font-heading text-accent text-lg uppercase tracking-wider mb-4">
                            {locale === 'de' ? 'BLEIB INFORMIERT' : 'STAY UPDATED'}
                        </h4>
                        <p className="font-body text-sm text-gray-400 mb-4">
                            {locale === 'de' 
                                ? 'Erhalte News, Künstler-Spotlights und Updates.' 
                                : 'Get the latest news, artist spotlights, and updates.'}
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={locale === 'de' ? 'deine@email.com' : 'your@email.com'}
                                className="flex-1 h-12 px-4 bg-white text-black border-2 border-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                required
                                disabled={status === 'loading'}
                            />
                            <button 
                                type="submit"
                                disabled={status === 'loading'}
                                className="h-12 px-6 bg-accent text-black font-heading uppercase text-sm border-2 border-accent hover:bg-white hover:border-white transition-colors disabled:opacity-50"
                            >
                                {status === 'loading' 
                                    ? '...' 
                                    : locale === 'de' ? 'ANMELDEN' : 'SUBSCRIBE'}
                            </button>
                        </form>
                        {message && (
                            <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Platform Links */}
                    <div>
                        <h4 className="font-heading text-accent text-sm uppercase tracking-wider mb-4">
                            PLATFORM
                        </h4>
                        <ul className="space-y-3 font-body text-sm">
                            <li>
                                <Link href="/feed" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('discover')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/local" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    Local Radar
                                </Link>
                            </li>
                            <li>
                                <Link href="/challenges" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    Challenges
                                </Link>
                            </li>
                            <li>
                                <Link href="/artist/verify" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {locale === 'de' ? 'Für Künstler' : 'For Artists'}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Company Links */}
                    <div>
                        <h4 className="font-heading text-accent text-sm uppercase tracking-wider mb-4">
                            {locale === 'de' ? 'UNTERNEHMEN' : 'COMPANY'}
                        </h4>
                        <ul className="space-y-3 font-body text-sm">
                            <li>
                                <Link href="/ueber-uns" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('aboutUs')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/kontakt" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('contact')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Legal Links */}
                    <div>
                        <h4 className="font-heading text-accent text-sm uppercase tracking-wider mb-4">
                            {t('legal')}
                        </h4>
                        <ul className="space-y-3 font-body text-sm">
                            <li>
                                <Link href="/legal/agb" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('terms')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/datenschutz" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('privacy')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/impressum" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('imprint')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/cookies" className="text-white hover:underline hover:decoration-accent hover:decoration-2 underline-offset-4 transition-all">
                                    {t('cookies')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* Social Links */}
                    <div>
                        <h4 className="font-heading text-accent text-sm uppercase tracking-wider mb-4">
                            {locale === 'de' ? 'FOLGE UNS' : 'FOLLOW US'}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            <a 
                                href="https://instagram.com/varbe.art" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-10 h-10 border-2 border-white flex items-center justify-center hover:bg-accent hover:border-black transition-colors"
                                title="Instagram"
                            >
                                <span className="text-lg">📷</span>
                            </a>
                            <a 
                                href="https://twitter.com/varbe_art" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-10 h-10 border-2 border-white flex items-center justify-center hover:bg-accent hover:border-black transition-colors"
                                title="Twitter/X"
                            >
                                <span className="text-lg">🐦</span>
                            </a>
                            <a 
                                href="https://tiktok.com/@varbe.art" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-10 h-10 border-2 border-white flex items-center justify-center hover:bg-accent hover:border-black transition-colors"
                                title="TikTok"
                            >
                                <span className="text-lg">🎵</span>
                            </a>
                            <a 
                                href="https://discord.gg/varbe" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-10 h-10 border-2 border-white flex items-center justify-center hover:bg-accent hover:border-black transition-colors"
                                title="Discord"
                            >
                                <span className="text-lg">💬</span>
                            </a>
                        </div>
                    </div>
                </div>
                
                {/* Bottom Section: Copyright */}
                <div className="border-t-2 border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="font-body text-xs text-gray-500">
                        {t('copyright')}
                    </p>
                    <div className="flex gap-4 text-xs font-body">
                        <Link href="/legal/impressum" className="text-gray-400 hover:text-white transition-colors">
                            {t('imprint')}
                        </Link>
                        <span className="text-gray-600">|</span>
                        <Link href="/legal/datenschutz" className="text-gray-400 hover:text-white transition-colors">
                            {t('privacy')}
                        </Link>
                        <span className="text-gray-600">|</span>
                        <Link href="/legal/agb" className="text-gray-400 hover:text-white transition-colors">
                            {t('terms')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

