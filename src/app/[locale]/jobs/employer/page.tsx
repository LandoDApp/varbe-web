"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

export default function EmployerPage() {
    const plans = [
        {
            name: "BASIC",
            price: "49",
            duration: "30 Tage",
            features: [
                "1 Stellenanzeige",
                "Standard-Platzierung",
                "Unbegrenzte Bewerbungen",
                "E-Mail Support",
            ],
            cta: "Anzeige schalten",
            popular: false,
        },
        {
            name: "FEATURED",
            price: "99",
            duration: "45 Tage",
            features: [
                "1 Stellenanzeige",
                "Featured-Platzierung",
                "Hervorgehobenes Design",
                "Social Media Boost",
                "Unbegrenzte Bewerbungen",
                "Priority Support",
            ],
            cta: "Featured buchen",
            popular: true,
        },
        {
            name: "ENTERPRISE",
            price: "Auf Anfrage",
            duration: "Flexibel",
            features: [
                "Unbegrenzte Anzeigen",
                "Premium-Platzierung",
                "Eigenes Employer Branding",
                "Analytics Dashboard",
                "API-Zugang",
                "Dedicated Account Manager",
            ],
            cta: "Kontakt aufnehmen",
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            {/* Hero */}
            <section className="bg-black text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }}></div>
                </div>
                
                <div className="container mx-auto px-4 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <span className="inline-block bg-[#FF10F0] text-white px-4 py-1 text-sm font-heading mb-6">
                            FÜR ARBEITGEBER
                        </span>
                        <h1 className="text-4xl md:text-6xl font-heading mb-6">
                            FINDE DIE BESTEN<br />
                            <span className="text-accent">KREATIVEN TALENTE</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            Varbe verbindet dich mit tausenden talentierten Künstlern, 
                            Designern und Kreativen aus ganz Deutschland.
                        </p>
                        <a href="mailto:jobs@varbe.de?subject=Job Anzeige schalten">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                JETZT ANZEIGE SCHALTEN
                            </Button>
                        </a>
                    </div>
                </div>
            </section>
            
            {/* How it Works */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-heading text-center mb-16">
                        SO FUNKTIONIERT ES
                    </h2>
                    
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-6 flex items-center justify-center">
                                <span className="text-4xl font-heading">1</span>
                            </div>
                            <h3 className="font-heading text-xl mb-3">ANZEIGE ERSTELLEN</h3>
                            <p className="text-gray-600">
                                Sende uns deine Stellenbeschreibung per E-Mail. 
                                Wir erstellen deine Anzeige innerhalb von 24 Stunden.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-20 h-20 bg-[#FF10F0] border-4 border-black mx-auto mb-6 flex items-center justify-center text-white">
                                <span className="text-4xl font-heading">2</span>
                            </div>
                            <h3 className="font-heading text-xl mb-3">BEWERBUNGEN ERHALTEN</h3>
                            <p className="text-gray-600">
                                Künstler bewerben sich direkt per E-Mail bei dir. 
                                Du behältst die volle Kontrolle.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-20 h-20 bg-black border-4 border-black mx-auto mb-6 flex items-center justify-center text-white">
                                <span className="text-4xl font-heading">3</span>
                            </div>
                            <h3 className="font-heading text-xl mb-3">TALENT EINSTELLEN</h3>
                            <p className="text-gray-600">
                                Wähle den perfekten Kandidaten aus und starte die Zusammenarbeit.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Pricing */}
            <section className="py-20 bg-gray-100">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-heading text-center mb-4">
                        UNSERE PAKETE
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        Wähle das passende Paket für deine Bedürfnisse. 
                        Alle Preise sind Einmalzahlungen, keine Abos.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, index) => (
                            <div 
                                key={index}
                                className={`bg-white border-4 border-black shadow-comic p-6 relative ${
                                    plan.popular ? 'border-[#FF10F0] transform -translate-y-2' : ''
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF10F0] text-white px-4 py-1 text-sm font-heading">
                                        BELIEBT
                                    </div>
                                )}
                                
                                <h3 className="font-heading text-2xl mb-2">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-4xl font-heading">{plan.price}</span>
                                    {plan.price !== "Auf Anfrage" && <span className="text-gray-500">EUR</span>}
                                </div>
                                <p className="text-sm text-gray-500 mb-6">{plan.duration}</p>
                                
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-accent font-bold">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                
                                <a href={`mailto:jobs@varbe.de?subject=${encodeURIComponent(`${plan.name} Paket buchen`)}&body=${encodeURIComponent(`Hallo Varbe Team,\n\nich möchte das ${plan.name} Paket buchen.\n\nUnternehmen:\nStellenbezeichnung:\nBeschreibung:\n\nMit freundlichen Grüßen`)}`}>
                                    <Button 
                                        variant={plan.popular ? "accent" : "secondary"} 
                                        className="w-full"
                                    >
                                        {plan.cta}
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* What to Include */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-heading text-center mb-12">
                            WAS DEINE ANZEIGE ENTHALTEN SOLLTE
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-50 border-2 border-black p-6">
                                <h3 className="font-heading text-lg mb-2">Unternehmensinformationen</h3>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Firmenname und Logo (falls vorhanden)</li>
                                    <li>• Website-URL</li>
                                    <li>• Kurze Unternehmensbeschreibung</li>
                                </ul>
                            </div>
                            
                            <div className="bg-gray-50 border-2 border-black p-6">
                                <h3 className="font-heading text-lg mb-2">Stellendetails</h3>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Stellenbezeichnung</li>
                                    <li>• Art der Anstellung (Vollzeit, Teilzeit, Freelance, etc.)</li>
                                    <li>• Kategorie (Illustration, Game Art, etc.)</li>
                                    <li>• Ausführliche Beschreibung der Aufgaben</li>
                                </ul>
                            </div>
                            
                            <div className="bg-gray-50 border-2 border-black p-6">
                                <h3 className="font-heading text-lg mb-2">Anforderungen</h3>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Benötigte Skills und Tools</li>
                                    <li>• Erfahrungslevel</li>
                                    <li>• Sprachkenntnisse</li>
                                </ul>
                            </div>
                            
                            <div className="bg-gray-50 border-2 border-black p-6">
                                <h3 className="font-heading text-lg mb-2">Konditionen</h3>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Standort / Remote-Option</li>
                                    <li>• Gehalt oder Honorar (empfohlen für mehr Bewerbungen)</li>
                                    <li>• Kontakt-E-Mail für Bewerbungen</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Stats */}
            <section className="py-16 bg-black text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl md:text-5xl font-heading text-accent mb-2">5K+</div>
                            <p className="text-gray-400">Registrierte Künstler</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-heading text-[#FF10F0] mb-2">24h</div>
                            <p className="text-gray-400">Anzeigen-Aktivierung</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-heading text-accent mb-2">15+</div>
                            <p className="text-gray-400">Bewerbungen pro Anzeige</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-heading text-[#FF10F0] mb-2">95%</div>
                            <p className="text-gray-400">Zufriedene Arbeitgeber</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* FAQ */}
            <section className="py-20 bg-gray-100">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-heading text-center mb-12">
                        HÄUFIGE FRAGEN
                    </h2>
                    
                    <div className="max-w-3xl mx-auto space-y-4">
                        {[
                            {
                                q: "Wie schnell wird meine Anzeige veröffentlicht?",
                                a: "Innerhalb von 24 Stunden nach Zahlungseingang erstellen wir deine Anzeige und schalten sie live."
                            },
                            {
                                q: "Kann ich meine Anzeige nachträglich bearbeiten?",
                                a: "Ja, schreib uns einfach eine E-Mail mit den Änderungen und wir passen die Anzeige kostenlos an."
                            },
                            {
                                q: "Wie erhalte ich die Bewerbungen?",
                                a: "Künstler bewerben sich direkt per E-Mail bei dir. Du erhältst alle Bewerbungen an die von dir angegebene E-Mail-Adresse."
                            },
                            {
                                q: "Was ist der Unterschied zwischen Basic und Featured?",
                                a: "Featured-Anzeigen werden oben auf der Jobs-Seite angezeigt, haben ein hervorgehobenes Design und werden zusätzlich auf unseren Social-Media-Kanälen beworben."
                            },
                            {
                                q: "Gibt es eine Rückerstattung?",
                                a: "Wenn wir deine Anzeige noch nicht veröffentlicht haben, erstatten wir den vollen Betrag. Nach Veröffentlichung ist keine Rückerstattung möglich."
                            },
                        ].map((faq, i) => (
                            <details key={i} className="bg-white border-2 border-black group">
                                <summary className="p-4 cursor-pointer font-heading flex items-center justify-between">
                                    {faq.q}
                                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-4 pb-4 text-gray-600">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Final CTA */}
            <section className="py-20 bg-[#FF10F0]">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-heading text-white mb-6">
                        BEREIT LOSZULEGEN?
                    </h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        Schreib uns eine E-Mail mit deinen Stellendetails und wir kümmern uns um den Rest.
                    </p>
                    <a href="mailto:jobs@varbe.de?subject=Job Anzeige schalten">
                        <Button variant="primary" className="text-xl px-10 py-4 bg-white text-black hover:bg-gray-100">
                            JOBS@VARBE.DE
                        </Button>
                    </a>
                    <p className="text-white/70 text-sm mt-4">
                        Antwort innerhalb von 24 Stunden garantiert
                    </p>
                </div>
            </section>
            
            <Footer />
        </div>
    );
}



