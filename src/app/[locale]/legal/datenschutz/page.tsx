"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function DatenschutzPage() {
    const t = useTranslations('legal.datenschutz');
    const tLegal = useTranslations('legal');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8 max-w-4xl">
                <h1 className="text-5xl font-heading mb-4">{t('title')}</h1>
                <p className="text-gray-600 mb-8 font-body"><strong>{t('asOf')}:</strong> {t('date')}</p>
                
                <div className="space-y-8 font-body text-lg leading-relaxed">
                    
                    {/* 1. Datenschutz auf einen Blick */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s1.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s1.general.title')}</h3>
                        <p className="mb-4">{t('s1.general.p1')}</p>
                        <p className="mb-4">{t('s1.general.p2')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s1.whatWeCollect.title')}</h3>
                        
                        <p className="font-semibold mt-4 mb-2">{t('s1.whatWeCollect.current')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s1.whatWeCollect.currentItems.account')}</li>
                            <li>{t('s1.whatWeCollect.currentItems.profile')}</li>
                            <li>{t('s1.whatWeCollect.currentItems.usage')}</li>
                            <li>{t('s1.whatWeCollect.currentItems.technical')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('s1.whatWeCollect.future')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s1.whatWeCollect.futureItems.discovery')}</li>
                            <li>{t('s1.whatWeCollect.futureItems.marketplace')}</li>
                            <li>{t('s1.whatWeCollect.futureItems.location')}</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s1.howWeUse.title')}</h3>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s1.howWeUse.items.platform')}</li>
                            <li>{t('s1.howWeUse.items.account')}</li>
                            <li>{t('s1.howWeUse.items.personalization')}</li>
                            <li>{t('s1.howWeUse.items.communication')}</li>
                            <li>{t('s1.howWeUse.items.transactions')}</li>
                            <li>{t('s1.howWeUse.items.improvement')}</li>
                            <li>{t('s1.howWeUse.items.protection')}</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s1.yourRights.title')}</h3>
                        <p className="mb-2">{t('s1.yourRights.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>{t('s1.yourRights.items.access')}</li>
                            <li>{t('s1.yourRights.items.correction')}</li>
                            <li>{t('s1.yourRights.items.deletion')}</li>
                            <li>{t('s1.yourRights.items.restriction')}</li>
                            <li>{t('s1.yourRights.items.portability')}</li>
                            <li>{t('s1.yourRights.items.objection')}</li>
                            <li>{t('s1.yourRights.items.complaint')}</li>
                        </ul>
                    </section>

                    {/* 2. Verantwortliche Stelle */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s2.title')}</h2>
                        <p className="mb-4">{t('s2.intro')}</p>
                        <div className="bg-gray-50 p-6 border-l-4 border-accent mb-4">
                            <p className="font-bold">Varbe</p>
                            <p>Olando Heeke</p>
                            <p>Fesenfeld 12</p>
                            <p>28203 Bremen</p>
                            <p>{t('s2.germany')}</p>
                            <p className="mt-4">
                                <strong>Email:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a><br />
                                <strong>{t('s2.phone')}:</strong> <a href="tel:+4915227027977" className="text-accent underline">015227027977</a>
                            </p>
                        </div>
                        <p>{t('s2.responsibility')}</p>
                    </section>

                    {/* 3. Hosting und technische Infrastruktur */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s3.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">Firebase / Google Cloud Platform</h3>
                        <p className="mb-4">{t('s3.firebase.intro')}</p>
                        <div className="bg-gray-50 p-4 mb-4">
                            <p><strong>Google Ireland Limited</strong></p>
                            <p>Gordon House, Barrow Street</p>
                            <p>Dublin 4, {t('s3.firebase.ireland')}</p>
                        </div>
                        <p className="mb-4">{t('s3.firebase.processing')}</p>
                        <p className="mb-4">
                            <strong>{t('s3.firebase.usaTransfer')}:</strong><br />
                            {t('s3.firebase.usaTransferText')}
                        </p>
                        <p className="mb-4">
                            <strong>{t('s3.firebase.legalBasis')}:</strong><br />
                            {t('s3.firebase.legalBasisText')}
                        </p>
                        <p className="mb-4">
                            <strong>{t('s3.firebase.moreInfo')}:</strong><br />
                            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">{t('s3.firebase.firebasePrivacy')}</a><br />
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">Google Privacy Policy</a>
                        </p>

                        <h3 className="text-xl font-heading mb-3 mt-6">Firestore Database</h3>
                        <p className="mb-4">{t('s3.firestore')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">Firebase Storage</h3>
                        <p>{t('s3.storage')}</p>
                    </section>

                    {/* 4. Datenerfassung und Verarbeitung */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s4.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.registration.title')}</h3>
                        <p className="mb-4">{t('s4.registration.intro')}</p>
                        
                        <p className="font-semibold mt-4 mb-2">{t('s4.registration.required')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.registration.requiredItems.email')}</li>
                            <li>{t('s4.registration.requiredItems.password')}</li>
                            <li>{t('s4.registration.requiredItems.username')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('s4.registration.optional')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.registration.optionalItems.profilePic')}</li>
                            <li>{t('s4.registration.optionalItems.bio')}</li>
                            <li>{t('s4.registration.optionalItems.artistName')}</li>
                            <li>{t('s4.registration.optionalItems.location')}</li>
                            <li>{t('s4.registration.optionalItems.social')}</li>
                            <li>{t('s4.registration.optionalItems.background')}</li>
                        </ul>

                        <p className="mb-2"><strong>{t('s4.legalBasis')}:</strong> {t('s4.registration.legalBasisText')}</p>
                        <p className="mb-4"><strong>{t('s4.storageDuration')}:</strong> {t('s4.registration.storageDurationText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.auth.title')}</h3>
                        <p className="mb-4">{t('s4.auth.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.auth.items.email')}</li>
                            <li>{t('s4.auth.items.password')}</li>
                            <li>{t('s4.auth.items.userId')}</li>
                            <li>{t('s4.auth.items.timestamps')}</li>
                        </ul>
                        <p className="mb-4">{t('s4.auth.socialLogin')}</p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s4.auth.legalBasisText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.verification.title')}</h3>
                        <p className="mb-4">{t('s4.verification.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.verification.items.artworks')}</li>
                            <li>{t('s4.verification.items.background')}</li>
                            <li>{t('s4.verification.items.details')}</li>
                            <li>{t('s4.verification.items.aiDetection')}</li>
                        </ul>
                        <p className="mb-4">{t('s4.verification.review')}</p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s4.verification.legalBasisText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.content.title')}</h3>
                        <p className="mb-4">{t('s4.content.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.content.items.media')}</li>
                            <li>{t('s4.content.items.details')}</li>
                            <li>{t('s4.content.items.voiceNotes')}</li>
                            <li>{t('s4.content.items.processVideos')}</li>
                            <li>{t('s4.content.items.metadata')}</li>
                        </ul>
                        <p className="mb-4">
                            <strong>{t('s4.content.visibility')}:</strong><br />
                            {t('s4.content.visibilityText')}
                        </p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s4.content.legalBasisText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.usage.title')}</h3>
                        <p className="mb-4">{t('s4.usage.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s4.usage.items.likes')}</li>
                            <li>{t('s4.usage.items.follows')}</li>
                            <li>{t('s4.usage.items.comments')}</li>
                            <li>{t('s4.usage.items.views')}</li>
                            <li>{t('s4.usage.items.swipes')}</li>
                            <li>{t('s4.usage.items.searches')}</li>
                        </ul>
                        <p className="mb-4">{t('s4.usage.purpose')}</p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s4.usage.legalBasisText')}</p>
                        <p className="mb-4">{t('s4.usage.optOut')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s4.chat.title')}</h3>
                        <p className="mb-4">{t('s4.chat.intro')}</p>
                        <p className="mb-2"><strong>{t('s4.legalBasis')}:</strong> {t('s4.chat.legalBasisText')}</p>
                        <p><strong>{t('s4.storageDuration')}:</strong> {t('s4.chat.storageDurationText')}</p>
                    </section>

                    {/* 5. Zukünftige Features und Datenverarbeitung */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s5.title')}</h2>
                        <p className="mb-4 italic bg-accent/10 p-4 border-l-4 border-accent">{t('s5.notice')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s5.discovery.title')}</h3>
                        <p className="mb-4">{t('s5.discovery.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s5.discovery.items.viewTime')}</li>
                            <li>{t('s5.discovery.items.swipes')}</li>
                            <li>{t('s5.discovery.items.preferences')}</li>
                            <li>{t('s5.discovery.items.stories')}</li>
                        </ul>
                        <p className="mb-4">{t('s5.discovery.purpose')}</p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s5.discovery.legalBasisText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s5.local.title')}</h3>
                        <p className="mb-4">{t('s5.local.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s5.local.items.current')}</li>
                            <li>{t('s5.local.items.saved')}</li>
                        </ul>
                        <p className="mb-4 font-semibold">{t('s5.local.important')}</p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s5.local.legalBasisText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s5.marketplace.title')}</h3>
                        <p className="mb-4">{t('s5.marketplace.intro')}</p>
                        
                        <p className="font-semibold mt-4 mb-2">{t('s5.marketplace.sellers')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s5.marketplace.sellerItems.stripe')}</li>
                            <li>{t('s5.marketplace.sellerItems.transactions')}</li>
                            <li>{t('s5.marketplace.sellerItems.shipping')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('s5.marketplace.buyers')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s5.marketplace.buyerItems.address')}</li>
                            <li>{t('s5.marketplace.buyerItems.payment')}</li>
                            <li>{t('s5.marketplace.buyerItems.orders')}</li>
                            <li>{t('s5.marketplace.buyerItems.tracking')}</li>
                        </ul>

                        <p className="mb-4">
                            <strong>{t('s5.marketplace.stripeTitle')}:</strong><br />
                            {t('s5.marketplace.stripeText')}
                        </p>
                        <p className="mb-4">
                            <strong>{t('s5.marketplace.stripePrivacy')}:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline">https://stripe.com/privacy</a>
                        </p>
                        <p className="mb-2"><strong>{t('s4.legalBasis')}:</strong> {t('s5.marketplace.legalBasisText')}</p>
                        <p><strong>{t('s4.storageDuration')}:</strong> {t('s5.marketplace.storageDurationText')}</p>
                    </section>

                    {/* 6. Cookies und Tracking */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s6.title')}</h2>
                        
                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s6.cookies.title')}</h3>
                        <p className="mb-4">{t('s6.cookies.intro')}</p>
                        
                        <p className="font-semibold mt-4 mb-2">{t('s6.cookies.necessary')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s6.cookies.necessaryItems.session')}</li>
                            <li>{t('s6.cookies.necessaryItems.preferences')}</li>
                        </ul>
                        <p className="mb-4">{t('s6.cookies.necessaryNote')}</p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s6.cookies.legalBasisText')}</p>

                        <p className="mb-4">
                            <strong>{t('s6.cookies.analytics')}:</strong><br />
                            {t('s6.cookies.analyticsText')}
                        </p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s6.cookies.analyticsLegalBasis')}</p>
                        <p className="mb-4">{t('s6.cookies.management')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s6.analytics.title')}</h3>
                        <p className="mb-4">
                            <strong>Firebase Analytics:</strong><br />
                            {t('s6.analytics.firebaseText')}
                        </p>
                        <p className="mb-4">
                            <strong>{t('s6.analytics.ipAnonymization')}:</strong><br />
                            {t('s6.analytics.ipAnonymizationText')}
                        </p>
                        <p className="mb-4"><strong>{t('s4.legalBasis')}:</strong> {t('s6.analytics.legalBasisText')}</p>
                        <p className="mb-4"><strong>{t('s6.analytics.objection')}:</strong> {t('s6.analytics.objectionText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s6.noTrackers.title')}</h3>
                        <p className="mb-4">{t('s6.noTrackers.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>Facebook Pixel</li>
                            <li>TikTok Pixel</li>
                            <li>{t('s6.noTrackers.items.thirdParty')}</li>
                            <li>Cross-Site Tracking</li>
                            <li>Fingerprinting</li>
                        </ul>
                        <p>{t('s6.noTrackers.respect')}</p>
                    </section>

                    {/* 7. Datenweitergabe an Dritte */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s7.title')}</h2>
                        <p className="mb-4">{t('s7.intro')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s7.processors.title')}:</h3>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s7.processors.items.firebase')}</li>
                            <li>{t('s7.processors.items.stripe')}</li>
                        </ul>
                        <p className="mb-4">{t('s7.processors.note')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s7.legal.title')}:</h3>
                        <p className="mb-4">{t('s7.legal.text')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s7.merger.title')}:</h3>
                        <p>{t('s7.merger.text')}</p>
                    </section>

                    {/* 8. Datenübermittlung in Drittländer */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s8.title')}</h2>
                        <p className="mb-4">{t('s8.text1')}</p>
                        <p>{t('s8.text2')}</p>
                    </section>

                    {/* 9. Datensicherheit */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s9.title')}</h2>
                        <p className="mb-4">{t('s9.intro')}</p>

                        <p className="font-semibold mt-4 mb-2">{t('s9.technical.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s9.technical.items.ssl')}</li>
                            <li>{t('s9.technical.items.passwords')}</li>
                            <li>{t('s9.technical.items.firewall')}</li>
                            <li>{t('s9.technical.items.updates')}</li>
                            <li>{t('s9.technical.items.backups')}</li>
                        </ul>

                        <p className="font-semibold mt-4 mb-2">{t('s9.organizational.title')}:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s9.organizational.items.access')}</li>
                            <li>{t('s9.organizational.items.confidentiality')}</li>
                            <li>{t('s9.organizational.items.assessments')}</li>
                            <li>{t('s9.organizational.items.incident')}</li>
                        </ul>

                        <p className="italic text-gray-600">{t('s9.disclaimer')}</p>
                    </section>

                    {/* 10. Speicherdauer */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s10.title')}</h2>
                        <p className="mb-4">{t('s10.intro')}</p>
                        
                        <div className="bg-gray-50 p-6 space-y-3">
                            <p><strong>{t('s10.items.account')}:</strong> {t('s10.items.accountText')}</p>
                            <p><strong>{t('s10.items.content')}:</strong> {t('s10.items.contentText')}</p>
                            <p><strong>{t('s10.items.comments')}:</strong> {t('s10.items.commentsText')}</p>
                            <p><strong>{t('s10.items.transactions')}:</strong> {t('s10.items.transactionsText')}</p>
                            <p><strong>{t('s10.items.logs')}:</strong> {t('s10.items.logsText')}</p>
                            <p><strong>{t('s10.items.analytics')}:</strong> {t('s10.items.analyticsText')}</p>
                        </div>
                    </section>

                    {/* 11. Ihre Rechte als betroffene Person */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s11.title')}</h2>
                        <p className="mb-6">{t('s11.intro')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.access.title')}</h3>
                        <p className="mb-4">{t('s11.access.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s11.access.items.what')}</li>
                            <li>{t('s11.access.items.purpose')}</li>
                            <li>{t('s11.access.items.recipients')}</li>
                            <li>{t('s11.access.items.duration')}</li>
                        </ul>
                        <p className="mb-4"><strong>{t('s11.request')}:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a></p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.correction.title')}</h3>
                        <p className="mb-4">{t('s11.correction.text')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.deletion.title')}</h3>
                        <p className="mb-4">{t('s11.deletion.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s11.deletion.items.noLongerNeeded')}</li>
                            <li>{t('s11.deletion.items.consent')}</li>
                            <li>{t('s11.deletion.items.objection')}</li>
                            <li>{t('s11.deletion.items.unlawful')}</li>
                        </ul>
                        <p className="mb-4"><strong>{t('s11.deletion.exceptions')}:</strong> {t('s11.deletion.exceptionsText')}</p>
                        <p className="mb-4">
                            <strong>{t('s11.deletion.accountDeletion')}:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a><br />
                            {t('s11.deletion.accountDeletionText')}
                        </p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.restriction.title')}</h3>
                        <p className="mb-4">{t('s11.restriction.intro')}</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                            <li>{t('s11.restriction.items.accuracy')}</li>
                            <li>{t('s11.restriction.items.unlawful')}</li>
                            <li>{t('s11.restriction.items.legal')}</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.portability.title')}</h3>
                        <p className="mb-4">{t('s11.portability.text')}</p>
                        <p className="mb-4">
                            <strong>{t('s11.portability.request')}:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a><br />
                            {t('s11.portability.format')}
                        </p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.objection.title')}</h3>
                        <p className="mb-4">{t('s11.objection.text')}</p>
                        <p className="mb-4"><strong>{t('s11.objection.special')}:</strong> {t('s11.objection.specialText')}</p>

                        <h3 className="text-xl font-heading mb-3 mt-6">{t('s11.withdrawal.title')}</h3>
                        <p>{t('s11.withdrawal.text')}</p>
                    </section>

                    {/* 12. Beschwerderecht bei Aufsichtsbehörde */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s12.title')}</h2>
                        <p className="mb-4">{t('s12.intro')}</p>
                        <div className="bg-gray-50 p-6">
                            <p className="font-bold">{t('s12.authority')}:</p>
                            <p>Die Landesbeauftragte für Datenschutz und Informationsfreiheit der Freien Hansestadt Bremen</p>
                            <p>Arndtstraße 1</p>
                            <p>27570 Bremerhaven</p>
                            <p>{t('s2.phone')}: 0421 361-2010</p>
                            <p>E-Mail: <a href="mailto:office@datenschutz.bremen.de" className="text-accent underline">office@datenschutz.bremen.de</a></p>
                            <p>Website: <a href="https://www.datenschutz.bremen.de" target="_blank" rel="noopener noreferrer" className="text-accent underline">https://www.datenschutz.bremen.de</a></p>
                        </div>
                    </section>

                    {/* 13. Änderungen dieser Datenschutzerklärung */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s13.title')}</h2>
                        <p className="mb-4">{t('s13.text1')}</p>
                        <p className="mb-4">{t('s13.text2')}</p>
                        <p className="italic"><strong>{t('s13.recommendation')}:</strong> {t('s13.recommendationText')}</p>
                    </section>

                    {/* 14. Kontakt zum Datenschutz */}
                    <section className="border-b-2 border-gray-200 pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s14.title')}</h2>
                        <p className="mb-4">{t('s14.intro')}</p>
                        <div className="bg-accent/10 p-6 border-l-4 border-accent">
                            <p><strong>Email:</strong> <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a></p>
                            <p><strong>{t('s14.subject')}:</strong> {t('s14.subjectText')}</p>
                        </div>
                        <p className="mt-4">{t('s14.response')}</p>
                    </section>

                    {/* 15. SSL/TLS-Verschlüsselung */}
                    <section className="pb-8">
                        <h2 className="text-3xl font-heading mb-6">{t('s15.title')}</h2>
                        <p className="mb-4">{t('s15.text1')}</p>
                        <p>{t('s15.text2')}</p>
                    </section>

                    {/* Footer note */}
                    <div className="bg-gray-100 p-6 text-center">
                        <p className="font-semibold">{t('lastUpdated')}: {t('date')}</p>
                        <p className="mt-2 text-gray-600">
                            {t('footer.contact')}{' '}
                            <a href="mailto:info@varbe.org" className="text-accent underline">info@varbe.org</a>
                        </p>
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
