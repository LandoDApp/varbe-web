"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";

export default function BecomeArtistPage() {
    const { user, profile } = useAuth();
    
    // Check if user is already verified
    const isVerified = profile?.verificationStatus === 'verified';
    const isPending = profile?.verificationStatus === 'pending';

    const features = [
        {
            icon: "📝",
            title: "POSTS & BLOG",
            description: "Teile deine Kunstwerke, Work-in-Progress Bilder und schreibe Blogartikel über deine künstlerische Reise. Zeige der Community deine Perspektive.",
            available: true
        },
        {
            icon: "🏆",
            title: "CHALLENGES",
            description: "Nimm an Community-Challenges teil, zeige dein Können und gewinne Badges & Anerkennung. Von wöchentlichen Prompts bis zu großen Wettbewerben.",
            available: true
        },
        {
            icon: "📅",
            title: "EVENTS ERSTELLEN",
            description: "Erstelle lokale Kunst-Events, Open Studio Sessions oder Online-Workshops. Verbinde dich mit der Community in deiner Nähe.",
            available: true
        },
        {
            icon: "💬",
            title: "CHATROOMS",
            description: "Trete Chatrooms bei und diskutiere mit anderen Künstlern über Techniken, Tools und die Kunstszene. Finde Kollaborationspartner.",
            available: true
        },
        {
            icon: "🎨",
            title: "COMMISSIONS",
            description: "Biete deine Dienste für Auftragsarbeiten an. Werde gefunden von Leuten, die genau nach deinem Stil suchen.",
            available: true
        },
        {
            icon: "🛒",
            title: "MARKETPLACE",
            description: "Verkaufe deine Original-Kunstwerke direkt an Sammler. Nur 10% Gebühren – du behältst 90% deines Verdienstes.",
            available: false,
            comingSoon: "COMING SOON"
        }
    ];

    const benefits = [
        {
            emoji: "✓",
            title: "Verifizierter Künstler Badge",
            desc: "Zeige der Community, dass du ein echter, verifizierter Künstler bist"
        },
        {
            emoji: "✓",
            title: "Posts & Blog erstellen",
            desc: "Teile deine Kunst und Gedanken mit der Community"
        },
        {
            emoji: "✓",
            title: "Events erstellen",
            desc: "Erstelle lokale oder Online-Events und verbinde dich"
        },
        {
            emoji: "✓",
            title: "Challenges teilnehmen",
            desc: "Zeige dein Können bei Community-Challenges"
        },
        {
            emoji: "✓",
            title: "Keine AI-Konkurrenz",
            desc: "Bei uns gibt es keine AI-generierte Kunst"
        },
        {
            emoji: "✓",
            title: "Faire Gebühren",
            desc: "Nur 10% – nicht 35% wie bei anderen Plattformen"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Account erstellen",
            description: "Registriere dich kostenlos bei Varbe. Dauert nur 30 Sekunden."
        },
        {
            number: "02",
            title: "Verifizierung starten",
            description: "Fülle das Verifizierungsformular aus und lade 3-5 Beispiele deiner Kunst hoch."
        },
        {
            number: "03",
            title: "Prüfung durch Team",
            description: "Unser Team prüft deine Einreichung in 1-3 Werktagen."
        },
        {
            number: "04",
            title: "Los geht's!",
            description: "Nach der Verifizierung kannst du sofort Posts erstellen, Events planen und an Challenges teilnehmen."
        }
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
                                🎨 FÜR ECHTE KÜNSTLER
                            </span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading mb-6 leading-tight">
                            WERDE EIN
                            <span className="block text-accent" style={{ textShadow: '3px 3px 0px #FF10F0' }}>
                                VARBE KÜNSTLER
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Teile deine Kunst, nimm an Challenges teil, erstelle Events und 
                            verbinde dich mit einer Community, die echte Kunst feiert – nicht AI-Slop.
                        </p>
                        
                        {/* CTA based on auth state */}
                        {!user ? (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/auth/register">
                                    <Button variant="accent" className="text-xl px-8 py-4">
                                        JETZT REGISTRIEREN
                                    </Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button variant="secondary" className="text-xl px-8 py-4 bg-white/10 border-white text-white hover:bg-white/20">
                                        EINLOGGEN
                                    </Button>
                                </Link>
                            </div>
                        ) : isPending ? (
                            <div className="bg-yellow-500/20 border-2 border-yellow-500 px-6 py-4 inline-block">
                                <p className="font-heading text-yellow-400">⏳ DEINE VERIFIZIERUNG WIRD GEPRÜFT</p>
                                <p className="text-sm text-gray-400 mt-1">Wir melden uns in 1-3 Werktagen</p>
                            </div>
                        ) : isVerified ? (
                            <div className="bg-accent/20 border-2 border-accent px-6 py-4 inline-block">
                                <p className="font-heading text-accent">✅ DU BIST BEREITS VERIFIZIERT!</p>
                                <Link href="/profile" className="text-sm text-white hover:underline mt-1 block">
                                    Zu deinem Profil →
                                </Link>
                            </div>
                        ) : (
                            <Link href="/artist/verify">
                                <Button variant="accent" className="text-xl px-8 py-4">
                                    KÜNSTLER WERDEN →
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
                            WAS KANNST DU ALS KÜNSTLER?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Als verifizierter Varbe-Künstler hast du Zugang zu allen Features der Plattform
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
                                            <h3 className="font-heading text-lg">{feature.title}</h3>
                                            {feature.comingSoon && (
                                                <span className="bg-accent-pink text-white text-xs px-2 py-0.5 font-heading">
                                                    {feature.comingSoon}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{feature.description}</p>
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
                            SO WIRST DU <span className="text-accent">KÜNSTLER</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Der Verifizierungsprozess ist einfach und dauert nur wenige Minuten
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
                                    <h3 className="font-heading text-xl mb-2 mt-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm">{step.description}</p>
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
                            DEINE VORTEILE
                        </h2>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                        {benefits.map((benefit, idx) => (
                            <div 
                                key={idx}
                                className="bg-white border-4 border-black p-4 flex items-start gap-4 shadow-comic"
                            >
                                <span className="text-2xl font-heading text-accent bg-black w-10 h-10 flex items-center justify-center flex-shrink-0">
                                    {benefit.emoji}
                                </span>
                                <div>
                                    <h3 className="font-heading text-base">{benefit.title}</h3>
                                    <p className="text-sm text-gray-600">{benefit.desc}</p>
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
                                WARUM VARBE?
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">🚫</span>
                                </div>
                                <h3 className="font-heading text-xl mb-2">KEINE AI-KUNST</h3>
                                <p className="text-sm text-gray-600">
                                    Wir erlauben keine AI-generierte Kunst. Punkt. Deine echte Arbeit wird nicht von 
                                    Bots überschattet.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">💰</span>
                                </div>
                                <h3 className="font-heading text-xl mb-2">FAIRE GEBÜHREN</h3>
                                <p className="text-sm text-gray-600">
                                    Nur 10% bei Verkäufen – nicht 35-40% wie bei anderen Plattformen. 
                                    Du behältst mehr von deinem Verdienst.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-accent border-4 border-black mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">👥</span>
                                </div>
                                <h3 className="font-heading text-xl mb-2">ECHTE COMMUNITY</h3>
                                <p className="text-sm text-gray-600">
                                    Eine Community aus echten Künstlern und Kunstliebhabern. 
                                    Keine Algorithmus-Manipulation, kein Engagement-Farming.
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
                        BEREIT <span className="text-accent">LOSZULEGEN</span>?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Werde Teil einer Community, die echte Kunst feiert. Keine AI. Keine hohen Gebühren. 
                        Nur Kunst, Künstler und Community.
                    </p>
                    
                    {!user ? (
                        <Link href="/auth/register">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                JETZT KOSTENLOS REGISTRIEREN
                            </Button>
                        </Link>
                    ) : isPending ? (
                        <p className="text-yellow-400 font-heading">⏳ Deine Verifizierung wird geprüft...</p>
                    ) : isVerified ? (
                        <Link href="/feed/create">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                ERSTEN POST ERSTELLEN →
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/artist/verify">
                            <Button variant="accent" className="text-xl px-8 py-4">
                                VERIFIZIERUNG STARTEN →
                            </Button>
                        </Link>
                    )}
                </div>
            </section>

            {/* FAQ TEASER */}
            <section className="py-12 bg-gray-100 border-t-4 border-black">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-600">
                        Noch Fragen? Schau in unsere{' '}
                        <Link href="/faq" className="text-accent font-bold hover:underline">
                            FAQ
                        </Link>
                        {' '}oder kontaktiere uns unter{' '}
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

