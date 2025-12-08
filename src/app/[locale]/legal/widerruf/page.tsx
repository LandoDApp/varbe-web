"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import type { Metadata } from "next";

export default function WiderrufPage() {
    const t = useTranslations('legal');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8 max-w-4xl">
                <h1 className="text-5xl font-heading mb-8">Widerrufsbelehrung</h1>
                
                <div className="space-y-6 font-body text-lg leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-heading mb-4">Widerrufsrecht</h2>
                        <p>
                            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
                        </p>
                        <p>
                            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, 
                            der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading mb-4">Widerrufsausschluss</h2>
                        <p>
                            Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die nicht vorgefertigt sind 
                            und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch den Verbraucher maßgeblich 
                            ist oder die eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind.
                        </p>
                        <p>
                            Bei digitalen Inhalten besteht kein Widerrufsrecht, wenn der Verbraucher ausdrücklich zugestimmt hat, 
                            dass der Unternehmer mit der Ausführung des Vertrags vor Ende der Widerrufsfrist beginnt und seine 
                            Bestätigung darüber abgegeben hat, dass er durch seine Zustimmung sein Widerrufsrecht verliert.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading mb-4">Widerrufsbelehrung</h2>
                        <h3 className="text-xl font-heading mb-3 mt-4">Widerrufsrecht</h3>
                        <p>
                            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
                        </p>
                        <p>
                            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, 
                            der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.
                        </p>
                        <p>
                            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Varbe, [Ihre Adresse], E-Mail: [Ihre E-Mail]) 
                            mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief, Telefax oder E-Mail) 
                            über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte 
                            Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading mb-4">Folgen des Widerrufs</h2>
                        <p>
                            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, 
                            einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, 
                            dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), 
                            unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über 
                            Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
                        </p>
                        <p>
                            Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion 
                            eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall 
                            werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
                        </p>
                        <p>
                            Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem 
                            Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. 
                            Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.
                        </p>
                        <p>
                            Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust 
                            der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften 
                            und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading mb-4">Muster-Widerrufsformular</h2>
                        <div className="bg-gray-100 p-6 border-2 border-black">
                            <p className="mb-4">
                                Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.
                            </p>
                            <p className="mb-2">
                                <strong>An:</strong> Varbe, [Ihre Adresse], E-Mail: [Ihre E-Mail]
                            </p>
                            <p className="mb-4">
                                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/ 
                                die Erbringung der folgenden Dienstleistung (*):
                            </p>
                            <p className="mb-2">
                                Bestellt am (*)/erhalten am (*): _________________
                            </p>
                            <p className="mb-2">
                                Name des/der Verbraucher(s): _________________
                            </p>
                            <p className="mb-2">
                                Anschrift des/der Verbraucher(s): _________________
                            </p>
                            <p className="mb-2">
                                Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _________________
                            </p>
                            <p className="mb-2">
                                Datum: _________________
                            </p>
                            <p className="text-sm mt-4">
                                (*) Unzutreffendes streichen.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t-4 border-black">
                    <Link href="/" className="text-black underline decoration-accent decoration-2 underline-offset-2 font-heading text-xl">
                        {t('backToHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
}



