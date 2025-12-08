"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/Button";

export default function KuenstlerPage() {
    const t = useTranslations('pages.kuenstler');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <h1 className="text-6xl font-heading mb-8 text-center">{t('title')}</h1>
                
                <div className="space-y-12 font-body text-lg leading-relaxed">
                    {/* Hero */}
                    <section className="text-center">
                        <p className="text-2xl md:text-3xl mb-6">
                            {t('heroTitle')}
                        </p>
                        <Link href="/marketplace/create">
                            <Button variant="accent" className="text-2xl px-8 py-4 mt-4">
                                {t('ctaBecome')}
                            </Button>
                        </Link>
                    </section>

                    {/* Wie es funktioniert */}
                    <section>
                        <h2 className="text-4xl font-heading mb-8 text-center">{t('howTitle')}</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="card-comic bg-white p-6 border-4 border-black text-center">
                                <div className="text-6xl mb-4">{t('steps.step1.number')}</div>
                                <h3 className="text-2xl font-heading mb-4">{t('steps.step1.title')}</h3>
                                <p>
                                    {t('steps.step1.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-accent p-6 border-4 border-black text-center">
                                <div className="text-6xl mb-4">{t('steps.step2.number')}</div>
                                <h3 className="text-2xl font-heading mb-4">{t('steps.step2.title')}</h3>
                                <p>
                                    {t('steps.step2.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-white p-6 border-4 border-black text-center">
                                <div className="text-6xl mb-4">{t('steps.step3.number')}</div>
                                <h3 className="text-2xl font-heading mb-4">{t('steps.step3.title')}</h3>
                                <p>
                                    {t('steps.step3.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Gebühren */}
                    <section className="card-comic bg-white p-8 border-4 border-black">
                        <h2 className="text-4xl font-heading mb-6">{t('feesTitle')}</h2>
                        <div className="space-y-4">
                            <div className="border-l-4 border-accent pl-6">
                                <h3 className="text-2xl font-heading mb-2">{t('fees.platform.title')}</h3>
                                <p>
                                    {t('fees.platform.desc')}
                                </p>
                            </div>
                            <div className="border-l-4 border-black pl-6">
                                <h3 className="text-2xl font-heading mb-2">{t('fees.payment.title')}</h3>
                                <p>
                                    {t('fees.payment.desc')}
                                </p>
                            </div>
                            <div className="border-l-4 border-accent pl-6">
                                <h3 className="text-2xl font-heading mb-2">{t('fees.hidden.title')}</h3>
                                <p>
                                    {t('fees.hidden.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Benefits */}
                    <section>
                        <h2 className="text-4xl font-heading mb-8 text-center">{t('whyTitle')}</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="card-comic bg-accent p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">{t('benefits.fair.title')}</h3>
                                <p>
                                    {t('benefits.fair.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-white p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">{t('benefits.simple.title')}</h3>
                                <p>
                                    {t('benefits.simple.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-white p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">{t('benefits.protection.title')}</h3>
                                <p>
                                    {t('benefits.protection.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-accent p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">{t('benefits.contact.title')}</h3>
                                <p>
                                    {t('benefits.contact.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-accent p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">{t('benefits.flexible.title')}</h3>
                                <p>
                                    {t('benefits.flexible.desc')}
                                </p>
                            </div>
                            <div className="card-comic bg-white p-6 border-4 border-black">
                                <h3 className="text-2xl font-heading mb-4">{t('benefits.payout.title')}</h3>
                                <p>
                                    {t('benefits.payout.desc')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Verifizierung */}
                    <section className="card-comic bg-black text-white p-8 border-4 border-black">
                        <h2 className="text-4xl font-heading mb-6 text-accent">{t('verificationTitle')}</h2>
                        <p className="mb-4 text-xl">
                            {t('verificationText1')}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-heading mb-2">{t('verificationWhatTitle')}</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>{t('verificationWhat.name')}</li>
                                    <li>{t('verificationWhat.style')}</li>
                                    <li>{t('verificationWhat.bio')}</li>
                                    <li>{t('verificationWhat.portfolio')}</li>
                                </ul>
                            </div>
                            <div className="mt-6">
                                <h3 className="text-2xl font-heading mb-2">{t('verificationTimeTitle')}</h3>
                                <p>
                                    {t('verificationTimeText')}
                                </p>
                            </div>
                        </div>
                        <div className="mt-8">
                            <Link href="/artist/verify">
                                <Button variant="accent" className="text-xl px-8 py-4">
                                    {t('verificationCta')}
                                </Button>
                            </Link>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center bg-accent p-12 border-4 border-black">
                        <h2 className="text-4xl font-heading mb-6">{t('finalCtaTitle')}</h2>
                        <p className="text-xl mb-8">
                            {t('finalCtaText')}
                        </p>
                        <Link href="/marketplace/create">
                            <Button variant="primary" className="text-2xl px-8 py-4">
                                {t('finalCtaButton')}
                            </Button>
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}
