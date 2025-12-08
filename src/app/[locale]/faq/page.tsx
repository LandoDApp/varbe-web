"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Link } from "@/i18n/routing";
import { useState } from "react";

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const faqs = [
        {
            category: "🎨 Allgemeines",
            id: "general",
            questions: [
                {
                    id: "g1",
                    q: "Was ist Varbe?",
                    a: "Varbe wird die erste Art Discovery Platform, die Social Media und Marketplace vereint. Wir bauen eine Plattform, auf der du durch Kunstwerke swipen kannst wie auf TikTok, lokale Künstler in deiner Nähe entdeckst und direkt beim Künstler kaufen kannst. Komplett AI-free, fair für Künstler mit nur 10% Gebühr, und ohne Algorithmus-Manipulation."
                },
                {
                    id: "g2",
                    q: "In welcher Phase befindet sich Varbe?",
                    a: "Wir sind aktuell im Early Access. Das bedeutet, du kannst schon jetzt dabei sein, mit anderen Künstlern und Kunstliebhabern in Kontakt treten und die ersten Features nutzen. Der große Launch mit Discovery Feed, Marketplace und allen weiteren Features kommt in den nächsten Monaten. Wenn du jetzt beitrittst, bist du von Anfang an dabei und kannst die Plattform aktiv mitgestalten."
                },
                {
                    id: "g3",
                    q: "Was kann ich aktuell auf Varbe machen?",
                    a: "Im Moment kannst du ein Profil erstellen, dich in unserem Blog über Varbe informieren und in den Chat-Bereichen mit anderen Community-Mitgliedern austauschen. Du kannst dich als Künstler registrieren und Teil der Gründungs-Community werden. Frühe Mitglieder bekommen besondere Vorteile wie ein \"Founding Member\" Badge und in Zukunft reduzierte Gebühren."
                },
                {
                    id: "g4",
                    q: "Wann kommen die Hauptfeatures?",
                    a: "Der Discovery Feed, Marketplace und alle weiteren Features werden schrittweise in den kommenden Monaten ausgerollt. Als Early Access Mitglied wirst du per Email informiert, sobald neue Features live gehen. Du bist bei jedem Schritt dabei und kannst direktes Feedback geben, das in die Entwicklung einfließt."
                }
            ]
        },
        {
            category: "🔮 Geplante Features",
            id: "features",
            questions: [
                {
                    id: "f1",
                    q: "Was ist der \"Discovery Feed\"?",
                    a: "Der Discovery Feed wird das Herzstück von Varbe. Stell dir vor, du scrollst durch TikTok, aber statt Videos siehst du atemberaubende Kunstwerke in voller Bildschirmgröße. Swipe nach oben für das nächste Werk, double-tap zum Liken, und lass dich von echter Kunst inspirieren. Der Feed wird personalisiert sein, aber ohne Algorithmus-Manipulation. Wenn du einem Künstler folgst, siehst du dessen Posts auch wirklich – chronologisch, ehrlich und transparent."
                },
                {
                    id: "f2",
                    q: "Was sind \"Stories\" bei Kunstwerken?",
                    a: "Jedes Kunstwerk wird eine Geschichte erzählen können. Künstler werden Voice Notes aufnehmen können – 30 Sekunden, in denen sie erzählen, wie das Werk entstanden ist, was es bedeutet, oder welche Technik sie verwendet haben. Du wirst Behind-the-Scenes Process Videos sehen können, die zeigen, wie aus einer weißen Leinwand ein fertiges Kunstwerk wurde. Oder kurze Text-Stories über die Inspiration hinter dem Werk. Kunst wird so vom Produkt zum Erlebnis."
                },
                {
                    id: "f3",
                    q: "Was ist der \"Local Art Radar\"?",
                    a: "Der Local Art Radar wird dir auf einer interaktiven Karte zeigen, wo in deiner Nähe Kunst entsteht. Du wirst Benachrichtigungen bekommen wie \"New art posted 500m away\" und kannst lokale Ateliers, Open Studio Events und Ausstellungen entdecken. Vielleicht wohnst du nur zwei Straßen von einem Maler entfernt, dessen Stil du liebst. Der Local Art Radar wird die Online- und Offline-Kunstwelt zusammenbringen."
                },
                {
                    id: "f4",
                    q: "Wie wird das Kaufen und Verkaufen funktionieren?",
                    a: "Wenn der Marketplace live geht, kannst du als Künstler deine Werke mit nur 10% Gebühr verkaufen (maximal 10€ pro Verkauf). Keine monatlichen Kosten, keine versteckten Gebühren. Käufer bekommen 14 Tage Käuferschutz, sichere Zahlung über Stripe und können direkt beim Künstler kaufen ohne Zwischenhändler. Aber das Wichtigste: Du musst nichts verkaufen, um Teil der Community zu sein. Varbe ist zuerst eine Discovery Platform, der Marketplace ist optional."
                }
            ]
        },
        {
            category: "🤖 AI & Verifizierung",
            id: "ai",
            questions: [
                {
                    id: "a1",
                    q: "Ist Varbe wirklich AI-free?",
                    a: "Ja, absolut. Wir haben null Toleranz für AI-generierte Kunst. Jeder Künstler wird manuell verifiziert, und wir nutzen AI-Detection bei jedem Upload. Alle echten Künstler bekommen ein \"Verified Human Artist\" Badge. Wir schützen unsere Community kompromisslos vor AI-Spam."
                },
                {
                    id: "a2",
                    q: "Wie werde ich als Künstler verifiziert?",
                    a: "Du registrierst dich kostenlos, reichst mindestens drei eigene Kunstwerke mit Beschreibung ein und beantwortest kurze Fragen zu deinem künstlerischen Hintergrund. Unser Team prüft dann manuell innerhalb von zwei bis fünf Werktagen. Wir prüfen auf Authentizität, Qualität und nutzen AI-Detection. Nach der Freischaltung bist du offiziell verifizierter Varbe-Künstler."
                },
                {
                    id: "a3",
                    q: "Was passiert, wenn jemand AI-Content hochlädt?",
                    a: "Bei AI-Verdacht gibt es eine sofortige Sperrung des Accounts. Alle Inhalte werden entfernt, und es gibt einen permanenten Ban. Wir tolerieren keinerlei AI-Content auf Varbe."
                }
            ]
        },
        {
            category: "👥 Community",
            id: "community",
            questions: [
                {
                    id: "c1",
                    q: "Kann ich anderen Künstlern folgen?",
                    a: "Ja! Du kannst Künstlern folgen und sie können dir folgen. Aber bei uns zählen nicht die Follower-Zahlen, sondern echte Verbindungen. Deshalb bauen wir Features wie Artist Circles – kleine private Gruppen mit maximal zehn Künstlern, die sich gegenseitig unterstützen und konstruktives Feedback geben."
                },
                {
                    id: "c2",
                    q: "Was sind \"Art Challenges\"?",
                    a: "Unsere Weekly Art Challenges werden die Community zusammenbringen. Ein Prompt wird veröffentlicht, alle haben 48 Stunden Zeit etwas zu kreieren, und die Community votet für ihre Favoriten. Die Gewinner werden gefeatured und bekommen Badges. Es geht nicht darum, täglich zu posten – es geht um Quality over Quantity."
                },
                {
                    id: "c3",
                    q: "Wie kann ich mit anderen Mitgliedern kommunizieren?",
                    a: "Aktuell kannst du über unsere Chat-Bereiche mit anderen Community-Mitgliedern in Kontakt treten. Später kommen Direct Messages, Comments unter Kunstwerken und die Artist Circles für tiefere Verbindungen dazu."
                },
                {
                    id: "c4",
                    q: "Muss ich täglich posten?",
                    a: "Nein! Auf Varbe gibt es keine \"Post täglich oder stirb\"-Kultur. Du kannst in deinem eigenen Tempo arbeiten, ohne Angst zu haben, dass deine Reichweite einbricht. Wenn du einem Künstler folgst, siehst du dessen Posts chronologisch – egal ob sie täglich oder nur monatlich posten."
                }
            ]
        },
        {
            category: "🎨 Für Künstler",
            id: "artists",
            questions: [
                {
                    id: "ar1",
                    q: "Was kostet es, auf Varbe zu sein?",
                    a: "Die Registrierung und das Erstellen deines Profils sind komplett kostenlos. Es gibt keine monatlichen Gebühren. Später, wenn der Marketplace live geht, nehmen wir nur 10% Gebühr pro Verkauf (maximal 10€). Aber das Wichtigste: Du musst nichts verkaufen, um Teil der Community zu sein."
                },
                {
                    id: "ar2",
                    q: "Welche Vorteile habe ich als Early Access Künstler?",
                    a: "Als Gründungsmitglied bekommst du ein spezielles \"Founding Member\" Badge, wirst in Zukunft bevorzugt im Feed gefeatured und erhältst reduzierte Gebühren in den ersten Monaten nach Marketplace-Launch. Außerdem kannst du die Plattform aktiv mitgestalten durch dein Feedback."
                },
                {
                    id: "ar3",
                    q: "Kann ich meine bestehende Social Media Reichweite nutzen?",
                    a: "Absolut! Du kannst deine Instagram, TikTok oder anderen Social Media Accounts verlinken und deine Follower zu Varbe bringen. Aber Varbe soll deine eigene Plattform sein, kein Satellite zu Instagram. Hier gehört deine Community dir, nicht einem Algorithmus."
                },
                {
                    id: "ar4",
                    q: "Muss ich professioneller Künstler sein?",
                    a: "Nein! Varbe ist für alle Künstler – egal ob Hobby, aufstrebend oder etabliert. Solange deine Kunst echt und von dir selbst gemacht ist, bist du willkommen. Wir glauben, dass jeder Künstler eine Stimme verdient."
                }
            ]
        },
        {
            category: "💬 Aktuelle Features",
            id: "current",
            questions: [
                {
                    id: "cu1",
                    q: "Was ist der Blog?",
                    a: "In unserem Blog findest du Updates über die Entwicklung von Varbe, Künstler-Interviews, Tipps für Künstler und Einblicke in unsere Vision. Hier erfährst du als Erstes, wenn neue Features live gehen."
                },
                {
                    id: "cu2",
                    q: "Wie funktionieren die Chat-Bereiche?",
                    a: "In den Chat-Bereichen kannst du dich mit anderen Early Access Mitgliedern austauschen, Fragen stellen und erste Kontakte knüpfen. Es ist der perfekte Ort, um andere Künstler und Kunstliebhaber kennenzulernen, bevor die Hauptfeatures live gehen."
                },
                {
                    id: "cu3",
                    q: "Kann ich schon ein Profil erstellen?",
                    a: "Ja! Du kannst jetzt schon dein Künstler-Profil erstellen, eine Bio schreiben und Teil der Community werden. Wenn später der Discovery Feed und Marketplace live gehen, ist dein Profil schon fertig und du kannst sofort loslegen."
                }
            ]
        },
        {
            category: "🔐 Sicherheit & Datenschutz",
            id: "security",
            questions: [
                {
                    id: "s1",
                    q: "Ist meine Zahlung sicher?",
                    a: "Sobald der Marketplace live geht, laufen alle Zahlungen über Stripe, einen der sichersten Payment-Provider weltweit. Wir speichern keine Kreditkartendaten. Alles ist verschlüsselt und PCI-DSS zertifiziert."
                },
                {
                    id: "s2",
                    q: "Was passiert mit meinen Daten?",
                    a: "Wir verkaufen keine Daten, nutzen keine Tracking-Pixel von Drittanbietern und sind GDPR-konform mit EU-Servern. Du kannst jederzeit dein Konto löschen. Wir erfassen nur die minimalen Daten, die nötig sind, um Varbe zu betreiben."
                },
                {
                    id: "s3",
                    q: "Ist meine Kunst geschützt?",
                    a: "Alle hochgeladenen Bilder werden optional mit Wasserzeichen versehen. Das Copyright bleibt immer bei dir. Wir verhindern einfaches Herunterladen und bei Copyright-Verletzungen gibt es sofortige DMCA-Takedowns."
                }
            ]
        },
        {
            category: "📱 Plattform",
            id: "platform",
            questions: [
                {
                    id: "p1",
                    q: "Gibt es eine Mobile App?",
                    a: "Eine Mobile App für iOS und Android ist in Entwicklung und wird später dieses Jahr erscheinen. Aktuell funktioniert Varbe im Browser auf Desktop, Mobile und Tablet. Die App wird speziell für den Swipe-Discovery Feed optimiert sein."
                },
                {
                    id: "p2",
                    q: "Funktioniert Varbe auf allen Geräten?",
                    a: "Ja, Varbe ist voll responsive und funktioniert auf Desktop (Chrome, Firefox, Safari, Edge), Mobile Browsern und Tablets. Alles synchronisiert sich zwischen deinen Geräten."
                }
            ]
        },
        {
            category: "💡 Die Vision",
            id: "vision",
            questions: [
                {
                    id: "v1",
                    q: "Warum wurde Varbe gegründet?",
                    a: "Wir waren frustriert. Als Künstler sehen wir auf Instagram nur noch 5% unserer Follower erreicht. DeviantArt ist voll mit AI-Spam. Etsy nimmt 35-40% Gebühren. Als Käufer ist es unmöglich geworden, echte Originale zu finden ohne durch AI-Müll zu scrollen oder überteuerte Galerie-Preise zu zahlen. Varbe ist unsere Antwort: Eine Plattform, die für Künstler arbeitet, nicht gegen sie."
                },
                {
                    id: "v2",
                    q: "Was ist eure Mission?",
                    a: "Kunst entdeckbar machen und Künstler sichtbar machen. Wir glauben, dass Kunstentdeckung ein Erlebnis sein sollte, kein Kampf gegen Algorithmen. Deshalb bauen wir eine Plattform, die Social Discovery und fairen Verkauf verbindet. Fair für Künstler, transparent für Käufer, und 100% AI-free."
                },
                {
                    id: "v3",
                    q: "Wie kann ich Varbe unterstützen?",
                    a: "Das Beste was du tun kannst: Werde Early Access Mitglied, erzähle anderen Künstlern von uns und gib uns Feedback. Je mehr Künstler in der Anfangsphase dabei sind, desto stärker wird unsere Community. Später kannst du uns auch auf Social Media folgen und unsere Beiträge teilen."
                }
            ]
        },
        {
            category: "📧 Support & Kontakt",
            id: "support",
            questions: [
                {
                    id: "su1",
                    q: "Wie erreiche ich das Varbe-Team?",
                    a: "Schreib uns einfach eine Email an info@varbe.org. Wir antworten normalerweise innerhalb von 24 Stunden. Du kannst uns auch über die Chat-Bereiche Fragen stellen – oft sind andere Community-Mitglieder auch super hilfreich."
                },
                {
                    id: "su2",
                    q: "Ich habe Feedback oder Feature-Vorschläge",
                    a: "Großartig! Wir wollen Varbe gemeinsam mit der Community aufbauen. Schick uns dein Feedback an info@varbe.org oder teile es in den Chat-Bereichen. Wir lesen alles und viele Vorschläge fließen direkt in die Entwicklung ein."
                },
                {
                    id: "su3",
                    q: "Wann kommt der nächste Update?",
                    a: "Wir arbeiten kontinuierlich an neuen Features. Als Early Access Mitglied erhältst du regelmäßig Updates per Email und im Blog. Folge uns auch auf Social Media für Behind-the-Scenes Einblicke in die Entwicklung."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-5xl md:text-6xl font-heading mb-4">Häufig gestellte Fragen</h1>
                <p className="text-xl font-body text-gray-600 mb-12">Alles was du über Varbe wissen musst</p>

                <div className="space-y-8">
                    {faqs.map((category) => (
                        <div key={category.id} className="card-comic bg-white p-6 border-4 border-black">
                            <h2 className="text-2xl md:text-3xl font-heading mb-6 text-accent">{category.category}</h2>
                            <div className="space-y-4">
                                {category.questions.map((faq) => (
                                    <div key={faq.id} className="border-l-4 border-black">
                                        <button 
                                            onClick={() => toggleItem(faq.id)}
                                            className="w-full text-left pl-4 py-2 flex justify-between items-start hover:bg-gray-50 transition-colors"
                                        >
                                            <h3 className="text-lg md:text-xl font-heading pr-4">{faq.q}</h3>
                                            <span className="text-2xl font-bold flex-shrink-0">
                                                {openItems.includes(faq.id) ? '−' : '+'}
                                            </span>
                                        </button>
                                        {openItems.includes(faq.id) && (
                                            <p className="font-body text-gray-700 leading-relaxed pl-4 pr-4 pb-4 pt-2">
                                                {faq.a}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-12 p-6 bg-accent border-4 border-black">
                    <h2 className="text-2xl font-heading mb-4">🎯 Noch Fragen?</h2>
                    <div className="font-body space-y-2 mb-6">
                        <p><strong>Schreib uns:</strong> info@varbe.org</p>
                        <p><strong>Blog:</strong> varbe.org/blog</p>
                        <p><strong>Community Chat:</strong> varbe.org/chat</p>
                    </div>
                    <p className="font-heading text-lg italic">
                        Kunst entdecken. Künstler supporten. Keine KI-Scheiße.
                    </p>
                </div>

                <div className="mt-12 flex flex-wrap gap-4 justify-center">
                    <Link href="/kontakt">
                        <button className="bg-black text-white px-6 py-3 border-2 border-black font-heading hover:bg-gray-800 transition-colors">
                            Kontakt aufnehmen
                        </button>
                    </Link>
                    <Link href="/blog">
                        <button className="bg-white text-black px-6 py-3 border-2 border-black font-heading hover:bg-gray-100 transition-colors">
                            Zum Blog
                        </button>
                    </Link>
                    <Link href="/chatrooms">
                        <button className="bg-accent text-black px-6 py-3 border-2 border-black font-heading hover:brightness-110 transition-all">
                            Community Chat
                        </button>
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t-4 border-black">
                    <Link href="/" className="text-black underline decoration-accent decoration-2 underline-offset-2 font-heading text-xl">
                        ← Zurück zur Startseite
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
