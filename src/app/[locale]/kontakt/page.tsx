"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function KontaktPage() {
    const t = useTranslations('pages.kontakt');
    const locale = useLocale();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');
        
        try {
            const response = await fetch('/api/contact/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus('success');
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                setStatus('error');
                setErrorMessage(data.error || (locale === 'de' ? 'Fehler beim Senden' : 'Failed to send'));
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage(locale === 'de' ? 'Fehler beim Senden' : 'Failed to send');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-6xl font-heading mb-8 text-center">{t('title')}</h1>
                
                <div className="space-y-12 font-body text-lg leading-relaxed">
                    {/* Intro */}
                    <section className="text-center">
                        <p className="text-xl md:text-2xl mb-6">
                            {t('heroTitle')}
                        </p>
                        <p className="text-gray-700">
                            {t('heroDesc')}
                        </p>
                    </section>

                    {/* Contact Info - Only Email */}
                    <section className="flex justify-center">
                        <div className="card-comic bg-white p-6 border-4 border-black max-w-md w-full text-center">
                            <h2 className="text-2xl font-heading mb-4">{t('emailTitle')}</h2>
                            <p className="text-xl">
                                <a href="mailto:info@varbe.org" className="text-accent hover:underline">
                                    info@varbe.org
                                </a>
                            </p>
                            <p className="mt-4 text-gray-600">
                                {t('emailDesc')}
                            </p>
                        </div>
                    </section>

                    {/* Contact Form */}
                    <section className="card-comic bg-white p-8 border-4 border-black">
                        <h2 className="text-3xl font-heading mb-6">{t('formTitle')}</h2>
                        {status === 'success' ? (
                            <div className="bg-accent p-6 border-4 border-black text-center">
                                <p className="text-2xl font-heading mb-2">{t('formSuccess')}</p>
                                <p>{t('formSuccessDesc')}</p>
                                <Button 
                                    variant="primary" 
                                    className="mt-4"
                                    onClick={() => setStatus('idle')}
                                >
                                    {locale === 'de' ? 'Neue Nachricht senden' : 'Send another message'}
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {status === 'error' && (
                                    <div className="bg-red-100 border-2 border-red-500 p-4 text-red-700">
                                        {errorMessage}
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="name" className="block font-heading text-xl mb-2">
                                        {t('formName')}
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-comic w-full"
                                        placeholder={locale === 'de' ? 'Dein Name' : 'Your name'}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block font-heading text-xl mb-2">
                                        {t('formEmail')}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-comic w-full"
                                        placeholder={locale === 'de' ? 'deine@email.de' : 'your@email.com'}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block font-heading text-xl mb-2">
                                        {t('formSubject')}
                                    </label>
                                    <select
                                        id="subject"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="input-comic w-full"
                                        disabled={status === 'loading'}
                                    >
                                        <option value="">{locale === 'de' ? 'Bitte wählen...' : 'Please select...'}</option>
                                        <option value="general">{t('formSubjectOptions.general')}</option>
                                        <option value="artist">{t('formSubjectOptions.artist')}</option>
                                        <option value="buyer">{t('formSubjectOptions.buyer')}</option>
                                        <option value="technical">{t('formSubjectOptions.technical')}</option>
                                        <option value="other">{t('formSubjectOptions.other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block font-heading text-xl mb-2">
                                        {t('formMessage')}
                                    </label>
                                    <textarea
                                        id="message"
                                        required
                                        rows={6}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="input-comic w-full"
                                        placeholder={locale === 'de' ? 'Deine Nachricht...' : 'Your message...'}
                                        disabled={status === 'loading'}
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    variant="accent" 
                                    className="text-xl px-8 py-4 w-full md:w-auto"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' 
                                        ? (locale === 'de' ? 'Wird gesendet...' : 'Sending...') 
                                        : t('formSubmit')}
                                </Button>
                            </form>
                        )}
                    </section>

                    {/* FAQ Link */}
                    <section className="card-comic bg-accent p-6 border-4 border-black text-center">
                        <h2 className="text-2xl font-heading mb-4">{t('faqTitle')}</h2>
                        <p className="mb-4">
                            {t('faqText')}
                        </p>
                        <Link href="/faq">
                            <Button variant="primary" className="text-lg px-6 py-3">
                                {t('faqButton')}
                            </Button>
                        </Link>
                    </section>

                    {/* Social */}
                    <section className="text-center">
                        <h2 className="text-2xl font-heading mb-4">{t('socialTitle')}</h2>
                        <div className="flex gap-4 justify-center">
                            <a href="https://instagram.com/varbe.art" target="_blank" rel="noopener noreferrer" className="text-3xl hover:scale-110 transition-transform">
                                📷 Instagram
                            </a>
                            <a href="https://tiktok.com/@varbe.art" target="_blank" rel="noopener noreferrer" className="text-3xl hover:scale-110 transition-transform">
                                🎵 TikTok
                            </a>
                            <a href="https://pinterest.com/varbe" target="_blank" rel="noopener noreferrer" className="text-3xl hover:scale-110 transition-transform">
                                📌 Pinterest
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
