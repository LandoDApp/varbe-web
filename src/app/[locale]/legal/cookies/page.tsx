"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function CookiesPage() {
    const t = useTranslations('legal.cookies');
    const tLegal = useTranslations('legal');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8 max-w-4xl">
                <h1 className="text-5xl font-heading mb-4">{t('title')}</h1>
                <p className="text-gray-600 mb-8 font-body"><strong>{t('asOf')}:</strong> {t('date')}</p>
                
                <div className="space-y-8 font-body text-lg leading-relaxed">
                    
                    {/* Was sind Cookies? */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('whatAreCookies.title')}</h2>
                        <p className="mb-4">{t('whatAreCookies.text1')}</p>
                        <p>{t('whatAreCookies.text2')}</p>
                    </section>

                    {/* Unsere Cookie-Philosophie */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('philosophy.title')}</h2>
                        <p className="font-semibold mb-4">{t('philosophy.subtitle')}</p>
                        <p className="mb-6">{t('philosophy.text')}</p>
                        
                        <p className="font-semibold mb-3">{t('philosophy.notUsed')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>{t('philosophy.notUsedItems.facebook')}</li>
                            <li>{t('philosophy.notUsedItems.tiktok')}</li>
                            <li>{t('philosophy.notUsedItems.thirdParty')}</li>
                            <li>{t('philosophy.notUsedItems.crossSite')}</li>
                            <li>{t('philosophy.notUsedItems.fingerprinting')}</li>
                            <li>{t('philosophy.notUsedItems.selling')}</li>
                        </ul>
                    </section>

                    {/* Wie verwendet Varbe Cookies? */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('howWeUse.title')}</h2>
                        <p className="mb-4">{t('howWeUse.intro')}</p>
                    </section>

                    {/* 1. Notwendige Cookies */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('necessary.title')}</h2>
                        <p className="mb-4 italic bg-gray-100 p-4 border-l-4 border-black">{t('necessary.note')}</p>
                        <p className="mb-6">{t('necessary.intro')}</p>
                        
                        <p className="font-semibold mb-3">{t('necessary.whatWeStore')}:</p>
                        
                        <p className="font-semibold mt-4 mb-2">{t('necessary.auth.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('necessary.auth.items.session')}</li>
                            <li>{t('necessary.auth.items.token')}</li>
                            <li>{t('necessary.auth.items.userId')}</li>
                            <li>{t('necessary.auth.items.loginStatus')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('necessary.security.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('necessary.security.items.csrf')}</li>
                            <li>{t('necessary.security.items.fraud')}</li>
                            <li>{t('necessary.security.items.rateLimit')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('necessary.technical.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('necessary.technical.items.language')}</li>
                            <li>{t('necessary.technical.items.theme')}</li>
                            <li>{t('necessary.technical.items.consent')}</li>
                        </ul>

                        <div className="bg-gray-50 p-4 mt-6 space-y-2">
                            <p><strong>{t('legalBasis')}:</strong> {t('necessary.legalBasisText')}</p>
                            <p><strong>{t('storageDuration')}:</strong> {t('necessary.storageDurationText')}</p>
                            <p><strong>{t('provider')}:</strong> Firebase (Google Ireland Limited)</p>
                        </div>
                    </section>

                    {/* 2. Funktionale Cookies */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('functional.title')}</h2>
                        <p className="mb-4 italic bg-accent/10 p-4 border-l-4 border-accent">{t('functional.note')}</p>
                        <p className="mb-6">{t('functional.intro')}</p>
                        
                        <p className="font-semibold mb-3">{t('necessary.whatWeStore')}:</p>
                        
                        <p className="font-semibold mt-4 mb-2">{t('functional.preferences.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('functional.preferences.items.display')}</li>
                            <li>{t('functional.preferences.items.filters')}</li>
                            <li>{t('functional.preferences.items.savedFilters')}</li>
                            <li>{t('functional.preferences.items.categories')}</li>
                            <li>{t('functional.preferences.items.sorting')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('functional.discovery.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('functional.discovery.items.recentlyViewed')}</li>
                            <li>{t('functional.discovery.items.feedPosition')}</li>
                            <li>{t('functional.discovery.items.feedModes')}</li>
                        </ul>

                        <div className="bg-gray-50 p-4 mt-6 space-y-2">
                            <p><strong>{t('legalBasis')}:</strong> {t('functional.legalBasisText')}</p>
                            <p><strong>{t('storageDuration')}:</strong> {t('functional.storageDurationText')}</p>
                            <p><strong>{t('control')}:</strong> {t('functional.control')}</p>
                        </div>
                    </section>

                    {/* 3. Analytische Cookies */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('analytics.title')}</h2>
                        <p className="mb-4 italic bg-accent/10 p-4 border-l-4 border-accent">{t('analytics.note')}</p>
                        <p className="mb-6">{t('analytics.intro')}</p>
                        
                        <p className="font-semibold mb-3">{t('analytics.whatWeAnalyze')}:</p>
                        
                        <p className="font-semibold mt-4 mb-2">Firebase Analytics:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('analytics.firebase.items.visitors')}</li>
                            <li>{t('analytics.firebase.items.features')}</li>
                            <li>{t('analytics.firebase.items.duration')}</li>
                            <li>{t('analytics.firebase.items.errors')}</li>
                            <li>{t('analytics.firebase.items.technical')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('analytics.important.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('analytics.important.items.ipAnonymization')}</li>
                            <li>{t('analytics.important.items.noTracking')}</li>
                            <li>{t('analytics.important.items.aggregated')}</li>
                            <li>{t('analytics.important.items.noLinking')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">Google Analytics ({t('analytics.google.ifImplemented')}):</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('analytics.google.items.ipAnonymization')}</li>
                            <li>{t('analytics.google.items.noCrossSite')}</li>
                            <li>{t('analytics.google.items.optOut')}</li>
                        </ul>

                        <div className="bg-gray-50 p-4 mt-6 space-y-2">
                            <p><strong>{t('legalBasis')}:</strong> {t('analytics.legalBasisText')}</p>
                            <p><strong>{t('storageDuration')}:</strong> {t('analytics.storageDurationText')}</p>
                            <p><strong>{t('objectionRight')}:</strong> {t('analytics.objectionText')}</p>
                        </div>
                    </section>

                    {/* 4. Marketing-Cookies */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('marketing.title')}</h2>
                        <p className="mb-4 font-semibold text-green-700 bg-green-50 p-4 border-l-4 border-green-700">{t('marketing.noMarketing')}</p>
                        <p className="mb-6">{t('marketing.intro')}</p>
                        
                        <ul className="space-y-2 mb-6">
                            <li>❌ {t('marketing.notUsed.tracking')}</li>
                            <li>❌ {t('marketing.notUsed.ads')}</li>
                            <li>❌ {t('marketing.notUsed.socialPixels')}</li>
                            <li>❌ {t('marketing.notUsed.remarketing')}</li>
                        </ul>

                        <p className="font-semibold mb-2">{t('marketing.socialSharing.title')}:</p>
                        <p className="mb-4">{t('marketing.socialSharing.text')}</p>

                        <p className="font-semibold mb-2">{t('marketing.future.title')}:</p>
                        <p>{t('marketing.future.text')}</p>
                    </section>

                    {/* Drittanbieter-Cookies */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('thirdParty.title')}</h2>
                        <p className="mb-6">{t('thirdParty.intro')}</p>
                        
                        <div className="space-y-6">
                            <div className="border-l-4 border-accent pl-4">
                                <h3 className="text-xl font-heading mb-3">Firebase / Google Cloud Platform</h3>
                                <p><strong>{t('thirdParty.purpose')}:</strong> {t('thirdParty.firebase.purpose')}</p>
                                <p><strong>{t('provider')}:</strong> Google Ireland Limited, Dublin, {t('ireland')}</p>
                                <p><strong>Cookies:</strong> {t('thirdParty.firebase.cookies')}</p>
                                <p><strong>{t('thirdParty.privacy')}:</strong> <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">firebase.google.com/support/privacy</a></p>
                                <p><strong>{t('legalBasis')}:</strong> {t('thirdParty.firebase.legalBasis')}</p>
                            </div>

                            <div className="border-l-4 border-gray-400 pl-4">
                                <h3 className="text-xl font-heading mb-3">Stripe ({t('thirdParty.stripe.future')})</h3>
                                <p><strong>{t('thirdParty.purpose')}:</strong> {t('thirdParty.stripe.purpose')}</p>
                                <p><strong>{t('provider')}:</strong> Stripe Payments Europe Ltd., Dublin, {t('ireland')}</p>
                                <p><strong>Cookies:</strong> {t('thirdParty.stripe.cookies')}</p>
                                <p><strong>{t('thirdParty.privacy')}:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">stripe.com/privacy</a></p>
                                <p><strong>{t('legalBasis')}:</strong> {t('thirdParty.stripe.legalBasis')}</p>
                                <p className="mt-2 italic text-gray-600">{t('thirdParty.stripe.note')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Wie können Sie Cookies verwalten? */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('manage.title')}</h2>
                        <p className="mb-6">{t('manage.intro')}</p>
                        
                        <h3 className="text-xl font-heading mb-3">{t('manage.option1.title')}</h3>
                        <p className="mb-4">{t('manage.option1.text')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-6">
                            <li><strong>{t('manage.option1.acceptAll')}:</strong> {t('manage.option1.acceptAllDesc')}</li>
                            <li><strong>{t('manage.option1.onlyNecessary')}:</strong> {t('manage.option1.onlyNecessaryDesc')}</li>
                            <li><strong>{t('manage.option1.settings')}:</strong> {t('manage.option1.settingsDesc')}</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-3">{t('manage.option2.title')}</h3>
                        <p className="mb-4">{t('manage.option2.text')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-6">
                            <li>{t('manage.option2.items.accountSettings')}</li>
                            <li>{t('manage.option2.items.footerLink')}</li>
                            <li>{t('manage.option2.items.email')}</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-3">{t('manage.option3.title')}</h3>
                        <p className="mb-4">{t('manage.option3.text')}</p>
                        <div className="bg-gray-50 p-4 space-y-2">
                            <p><strong>Chrome:</strong> {t('manage.option3.chrome')}</p>
                            <p><strong>Firefox:</strong> {t('manage.option3.firefox')}</p>
                            <p><strong>Safari:</strong> {t('manage.option3.safari')}</p>
                            <p><strong>Edge:</strong> {t('manage.option3.edge')}</p>
                            <p><strong>Mobile (Safari iOS):</strong> {t('manage.option3.safariIos')}</p>
                            <p><strong>Mobile (Chrome Android):</strong> {t('manage.option3.chromeAndroid')}</p>
                        </div>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('manage.option4.title')}</h3>
                        <p className="mb-4">{t('manage.option4.text')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>uBlock Origin</li>
                            <li>Privacy Badger</li>
                            <li>Cookie AutoDelete</li>
                        </ul>

                        <p className="mt-4 font-semibold text-red-700">{t('manage.warning')}</p>
                    </section>

                    {/* Auswirkungen der Cookie-Deaktivierung */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('impact.title')}</h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 border-l-4 border-accent">
                                <h3 className="font-heading text-xl mb-4">{t('impact.onlyNecessary.title')}:</h3>
                                <ul className="space-y-2">
                                    <li>✅ {t('impact.onlyNecessary.can.login')}</li>
                                    <li>✅ {t('impact.onlyNecessary.can.basic')}</li>
                                    <li>✅ {t('impact.onlyNecessary.can.upload')}</li>
                                    <li>❌ {t('impact.onlyNecessary.cannot.preferences')}</li>
                                    <li>❌ {t('impact.onlyNecessary.cannot.recommendations')}</li>
                                </ul>
                            </div>

                            <div className="bg-red-50 p-6 border-l-4 border-red-700">
                                <h3 className="font-heading text-xl mb-4">{t('impact.allDisabled.title')}:</h3>
                                <ul className="space-y-2">
                                    <li>❌ {t('impact.allDisabled.cannot.login')}</li>
                                    <li>❌ {t('impact.allDisabled.cannot.session')}</li>
                                    <li>❌ {t('impact.allDisabled.cannot.website')}</li>
                                </ul>
                            </div>
                        </div>

                        <p className="mt-6">{t('impact.recommendation')}</p>
                    </section>

                    {/* Cookie-Übersicht */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('overview.title')}</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 p-2 text-left">{t('overview.table.name')}</th>
                                        <th className="border border-gray-300 p-2 text-left">{t('overview.table.type')}</th>
                                        <th className="border border-gray-300 p-2 text-left">{t('overview.table.purpose')}</th>
                                        <th className="border border-gray-300 p-2 text-left">{t('overview.table.duration')}</th>
                                        <th className="border border-gray-300 p-2 text-left">{t('provider')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 p-2 font-mono text-sm">__session</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.necessary')}</td>
                                        <td className="border border-gray-300 p-2">{t('overview.purposes.session')}</td>
                                        <td className="border border-gray-300 p-2">Session</td>
                                        <td className="border border-gray-300 p-2">Firebase</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="border border-gray-300 p-2 font-mono text-sm">firebase-auth-token</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.necessary')}</td>
                                        <td className="border border-gray-300 p-2">{t('overview.purposes.auth')}</td>
                                        <td className="border border-gray-300 p-2">30 {t('overview.days')}</td>
                                        <td className="border border-gray-300 p-2">Firebase</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 p-2 font-mono text-sm">varbe-lang</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.functional')}</td>
                                        <td className="border border-gray-300 p-2">{t('overview.purposes.language')}</td>
                                        <td className="border border-gray-300 p-2">12 {t('overview.months')}</td>
                                        <td className="border border-gray-300 p-2">Varbe</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="border border-gray-300 p-2 font-mono text-sm">varbe-theme</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.functional')}</td>
                                        <td className="border border-gray-300 p-2">{t('overview.purposes.theme')}</td>
                                        <td className="border border-gray-300 p-2">12 {t('overview.months')}</td>
                                        <td className="border border-gray-300 p-2">Varbe</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 p-2 font-mono text-sm">varbe-consent</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.necessary')}</td>
                                        <td className="border border-gray-300 p-2">{t('overview.purposes.consent')}</td>
                                        <td className="border border-gray-300 p-2">12 {t('overview.months')}</td>
                                        <td className="border border-gray-300 p-2">Varbe</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="border border-gray-300 p-2 font-mono text-sm">_ga</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.analytics')}</td>
                                        <td className="border border-gray-300 p-2">Google Analytics</td>
                                        <td className="border border-gray-300 p-2">24 {t('overview.months')}</td>
                                        <td className="border border-gray-300 p-2">Google</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 p-2 font-mono text-sm">_gid</td>
                                        <td className="border border-gray-300 p-2">{t('overview.types.analytics')}</td>
                                        <td className="border border-gray-300 p-2">Google Analytics</td>
                                        <td className="border border-gray-300 p-2">24 {t('overview.hours')}</td>
                                        <td className="border border-gray-300 p-2">Google</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4 text-sm text-gray-600">{t('overview.updateNote')}</p>
                    </section>

                    {/* Änderungen an dieser Cookie-Richtlinie */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('changes.title')}</h2>
                        <p className="mb-6">{t('changes.intro')}</p>
                        
                        <p className="font-semibold mb-3">{t('changes.significantChanges')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-6">
                            <li>{t('changes.items.email')}</li>
                            <li>{t('changes.items.banner')}</li>
                            <li>{t('changes.items.blog')}</li>
                        </ul>

                        <p className="mb-4"><strong>{t('changes.recommendation')}:</strong> {t('changes.recommendationText')}</p>

                        <p className="font-semibold mb-2">{t('changes.versionHistory')}:</p>
                        <ul className="list-disc list-inside ml-4">
                            <li><strong>{t('date')}:</strong> {t('changes.firstVersion')}</li>
                        </ul>
                    </section>

                    {/* FAQ */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('faq.title')}</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-heading text-xl mb-2">{t('faq.q1.question')}</h3>
                                <p>{t('faq.q1.answer')}</p>
                            </div>
                            <div>
                                <h3 className="font-heading text-xl mb-2">{t('faq.q2.question')}</h3>
                                <p><strong>{t('faq.q2.answer')}</strong></p>
                            </div>
                            <div>
                                <h3 className="font-heading text-xl mb-2">{t('faq.q3.question')}</h3>
                                <p>{t('faq.q3.answer')}</p>
                            </div>
                            <div>
                                <h3 className="font-heading text-xl mb-2">{t('faq.q4.question')}</h3>
                                <p>{t('faq.q4.answer')}</p>
                            </div>
                            <div>
                                <h3 className="font-heading text-xl mb-2">{t('faq.q5.question')}</h3>
                                <p>{t('faq.q5.answer')}</p>
                            </div>
                        </div>
                    </section>

                    {/* Kontakt */}
                    <section className="pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('contact.title')}</h2>
                        <p className="mb-4">{t('contact.intro')}</p>
                        
                        <div className="bg-accent/10 p-6 border-l-4 border-accent mb-6">
                            <p><strong>Email:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a></p>
                            <p><strong>{t('contact.subject')}:</strong> {t('contact.subjectText')}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-6">
                            <p className="font-semibold">{t('contact.postalAddress')}:</p>
                            <p>Varbe</p>
                            <p>Olando Heeke</p>
                            <p>Fesenfeld 12</p>
                            <p>28203 Bremen</p>
                            <p>{t('germany')}</p>
                        </div>
                        
                        <p className="mt-4">{t('contact.responseTime')}</p>
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
