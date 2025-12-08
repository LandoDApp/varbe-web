"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function ImpressumPage() {
    const t = useTranslations('legal.impressum');
    const tLegal = useTranslations('legal');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8 max-w-4xl">
                <h1 className="text-5xl font-heading mb-8">{t('title')}</h1>
                
                <div className="space-y-8 font-body text-lg leading-relaxed">
                    
                    {/* Angaben gemäß § 5 TMG */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s1.title')}</h2>
                        <p className="font-semibold mb-4">{t('s1.operator')}:</p>
                        <div className="bg-gray-50 p-6 border-l-4 border-accent">
                            <p className="font-bold">Varbe</p>
                            <p>Olando Heeke</p>
                            <p>Fesenfeld 12</p>
                            <p>28203 Bremen</p>
                            <p>{t('germany')}</p>
                        </div>
                        
                        <p className="font-semibold mt-6 mb-2">{t('s1.contact')}:</p>
                        <p>E-Mail: <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a></p>
                        
                        <p className="font-semibold mt-6 mb-2">{t('s1.responsible')}:</p>
                        <p>Olando Heeke</p>
                        <p>Fesenfeld 12</p>
                        <p>28203 Bremen</p>
                    </section>

                    {/* Hinweise zur Website */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s2.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s2.status.title')}</h3>
                        <p className="mb-4">{t('s2.status.text')}</p>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s2.dispute.title')}</h3>
                        <p className="mb-4">
                            {t('s2.dispute.text1')}<br />
                            <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-accent underline">https://ec.europa.eu/odr</a>
                        </p>
                        <p>{t('s2.dispute.text2')}</p>
                    </section>

                    {/* Haftungsausschluss */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s3.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s3.content.title')}</h3>
                        <p className="mb-4">{t('s3.content.text1')}</p>
                        <p className="mb-4">{t('s3.content.text2')}</p>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s3.userContent.title')}</h3>
                        <p className="mb-4">{t('s3.userContent.text1')}</p>
                        <p className="mb-4">
                            {t('s3.userContent.text2')} <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a>
                        </p>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s3.links.title')}</h3>
                        <p className="mb-4">{t('s3.links.text1')}</p>
                        <p className="mb-4">{t('s3.links.text2')}</p>
                        <p>{t('s3.links.text3')}</p>
                    </section>

                    {/* Urheberrecht */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s4.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.own.title')}</h3>
                        <p className="mb-4">{t('s4.own.text1')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.own.items.texts')}</li>
                            <li>{t('s4.own.items.design')}</li>
                            <li>{t('s4.own.items.logos')}</li>
                            <li>{t('s4.own.items.code')}</li>
                        </ul>
                        <p className="mb-4">{t('s4.own.text2')}</p>
                        <p>{t('s4.own.text3')}</p>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.user.title')}</h3>
                        <p className="mb-4">{t('s4.user.text1')}</p>
                        <p>{t('s4.user.text2')}</p>
                    </section>

                    {/* Datenschutz */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s5.title')}</h2>
                        <p>
                            {t('s5.text')}{' '}
                            <Link href="/legal/datenschutz" className="text-accent underline">varbe.org/datenschutz</Link>
                        </p>
                    </section>

                    {/* Markenrecht */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s6.title')}</h2>
                        <p>{t('s6.text')}</p>
                    </section>

                    {/* Technische Umsetzung */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s7.title')}</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="font-semibold">{t('s7.hosting')}:</p>
                                <p>Firebase / Google Cloud Platform</p>
                                <p>Google Ireland Limited</p>
                                <p>Gordon House, Barrow Street</p>
                                <p>Dublin 4, {t('ireland')}</p>
                            </div>
                            
                            <div>
                                <p className="font-semibold">Framework:</p>
                                <p>React / Next.js</p>
                            </div>
                            
                            <div>
                                <p className="font-semibold">{t('s7.payments')}:</p>
                                <p>Stripe Payments Europe, Ltd.</p>
                                <p>1 Grand Canal Street Lower</p>
                                <p>Dublin 2, {t('ireland')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Kontakt für rechtliche Anfragen */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s8.title')}</h2>
                        <p className="mb-4">{t('s8.intro')}</p>
                        <div className="bg-accent/10 p-6 border-l-4 border-accent">
                            <p><strong>E-Mail:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a></p>
                            <p><strong>{t('s8.subject')}:</strong> {t('s8.subjectText')}</p>
                        </div>
                        <p className="mt-4">{t('s8.note')}</p>
                    </section>

                    {/* Bildnachweise */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s9.title')}</h2>
                        <p className="mb-4">{t('s9.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s9.items.own')}</li>
                            <li>{t('s9.items.cc')}</li>
                            <li>{t('s9.items.stock')}</li>
                        </ul>
                        <p>{t('s9.note')}</p>
                    </section>

                    {/* Hinweis zur Telefonnummer */}
                    <section className="pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s10.title')}</h2>
                        <p className="mb-4">{t('s10.text1')}</p>
                        <p>{t('s10.text2')}</p>
                    </section>

                    {/* Footer note */}
                    <div className="bg-gray-100 p-6 text-center">
                        <p className="font-semibold">{t('lastUpdated')}: {t('date')}</p>
                        <p className="mt-2 text-gray-600 italic">{t('footer.scope')}</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t-4 border-black">
                    <Link href="/" className="text-black underline decoration-accent decoration-2 underline-offset-2 font-heading text-xl">
                        {tLegal('backToHome')}
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
