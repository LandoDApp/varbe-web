"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function AGBPage() {
    const t = useTranslations('legal');
    
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8 max-w-4xl">
                <h1 className="text-5xl font-heading mb-4">{t('agb.title')}</h1>
                
                <p className="text-gray-600 font-body mb-2"><strong>Stand:</strong> Dezember 2025</p>
                <p className="text-gray-600 font-body mb-8"><strong>Geltungsbereich:</strong> Varbe Platform (varbe.org)</p>
                
                <div className="space-y-8 font-body text-lg leading-relaxed">
                    
                    {/* 1. Geltungsbereich und Plattform-Status */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">1. Geltungsbereich und Plattform-Status</h2>
                        <p className="mb-4">
                            Diese Allgemeinen Geschäftsbedingungen gelten für alle Nutzer der Plattform Varbe, einer Art Discovery und Community Platform für Künstler und Kunstliebhaber. Mit der Registrierung und Nutzung der Plattform erkennen Sie diese AGB an.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <p className="font-semibold mb-2">Wichtiger Hinweis zum Early Access Status:</p>
                            <p>
                                Varbe befindet sich derzeit im Early Access. Das bedeutet, dass nicht alle geplanten Features bereits verfügbar sind. Der Discovery Feed, Marketplace und weitere Funktionen werden schrittweise in den kommenden Monaten ausgerollt. Die Plattform wird kontinuierlich weiterentwickelt, und diese AGB können sich entsprechend anpassen. Über wesentliche Änderungen werden Sie per Email informiert.
                            </p>
                        </div>
                    </section>

                    {/* 2. Betreiber und Kontakt */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">2. Betreiber und Kontakt</h2>
                        <div className="mb-4">
                            <p className="font-semibold">Betreiber der Plattform:</p>
                            <p>Varbe</p>
                            <p>Bremen, Deutschland</p>
                            <p>Email: info@varbe.org</p>
                        </div>
                        <p>
                            Varbe stellt die technische Plattform zur Verfügung und moderiert die Community. Sobald der Marketplace aktiv ist, fungiert Varbe als Vermittler zwischen Verkäufern (Künstlern) und Käufern.
                        </p>
                    </section>

                    {/* 3. Registrierung und Nutzerkonto */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">3. Registrierung und Nutzerkonto</h2>
                        
                        <h3 className="text-xl font-heading mb-2">3.1 Registrierung</h3>
                        <p className="mb-4">
                            Um Varbe vollständig nutzen zu können, müssen Sie sich registrieren und ein Nutzerkonto erstellen. Die Registrierung ist kostenlos. Sie garantieren, dass alle von Ihnen angegebenen Daten wahrheitsgemäß und vollständig sind.
                        </p>

                        <h3 className="text-xl font-heading mb-2">3.2 Mindestalter</h3>
                        <p className="mb-4">
                            Sie müssen mindestens 16 Jahre alt sein, um ein Konto zu erstellen. Nutzer unter 18 Jahren benötigen die Zustimmung eines Erziehungsberechtigten.
                        </p>

                        <h3 className="text-xl font-heading mb-2">3.3 Account-Sicherheit</h3>
                        <p className="mb-4">
                            Sie sind verantwortlich für die Geheimhaltung Ihrer Zugangsdaten. Jegliche Aktivität unter Ihrem Account gilt als von Ihnen autorisiert. Bei Verdacht auf unbefugten Zugriff informieren Sie uns umgehend unter info@varbe.org.
                        </p>

                        <h3 className="text-xl font-heading mb-2">3.4 Account-Löschung</h3>
                        <p>
                            Sie können Ihren Account jederzeit löschen. Kontaktieren Sie uns dafür unter info@varbe.org. Öffentlich geteilte Inhalte (Kommentare, Posts) können aus technischen Gründen weiterhin sichtbar sein, werden aber anonymisiert.
                        </p>
                    </section>

                    {/* 4. Künstler-Verifizierung */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">4. Künstler-Verifizierung</h2>
                        
                        <h3 className="text-xl font-heading mb-2">4.1 Verifizierungsprozess</h3>
                        <p className="mb-2">
                            Um als Künstler auf Varbe aktiv zu sein und später Kunstwerke verkaufen zu können, müssen Sie eine Verifizierung durchlaufen. Der Verifizierungsprozess umfasst:
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Einreichung von mindestens drei eigenen Kunstwerken mit Beschreibung</li>
                            <li>Beantwortung kurzer Fragen zu Ihrem künstlerischen Hintergrund</li>
                            <li>Manuelle Prüfung durch das Varbe-Team (2-5 Werktage)</li>
                            <li>AI-Detection bei allen eingereichten Werken</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-2">4.2 Ablehnungsgründe</h3>
                        <p className="mb-2">
                            Varbe behält sich vor, Verifizierungsanträge abzulehnen, wenn:
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>AI-generierte oder AI-unterstützte Inhalte erkannt werden</li>
                            <li>Gestohlene oder nicht-originale Inhalte eingereicht werden</li>
                            <li>Die künstlerische Integrität nicht nachgewiesen werden kann</li>
                            <li>Verstöße gegen Community-Richtlinien vorliegen</li>
                        </ul>
                        <p className="mb-4">
                            Eine Ablehnung kann ohne detaillierte Begründung erfolgen. Bei berechtigtem Interesse können Sie Widerspruch einlegen unter info@varbe.org.
                        </p>

                        <h3 className="text-xl font-heading mb-2">4.3 Verified Human Artist Badge</h3>
                        <p>
                            Nach erfolgreicher Verifizierung erhalten Sie ein &quot;Verified Human Artist&quot; Badge, das Ihre Authentizität als echter Künstler bestätigt.
                        </p>
                    </section>

                    {/* 5. AI-Free Policy */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">5. AI-Free Policy (Null-Toleranz)</h2>
                        
                        <h3 className="text-xl font-heading mb-2">5.1 Absolutes Verbot</h3>
                        <p className="mb-2">
                            Varbe hat eine <strong>strikte Null-Toleranz-Politik</strong> gegenüber AI-generierter oder AI-unterstützter Kunst. Es ist strengstens verboten:
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>AI-generierte Bilder hochzuladen (vollständig oder teilweise)</li>
                            <li>AI-Tools zur Bilderstellung zu nutzen (Midjourney, Stable Diffusion, DALL-E, etc.)</li>
                            <li>Eigene Werke mit AI signifikant zu verändern oder zu &quot;verbessern&quot;</li>
                            <li>Bestehende AI-Werke als eigene auszugeben</li>
                        </ul>
                        <p className="mb-4">
                            Erlaubt sind lediglich Standard-Bildbearbeitungstools (Photoshop, Lightroom, etc.) für normale Nachbearbeitung wie Farbkorrektur, Zuschnitt oder Retusche.
                        </p>

                        <h3 className="text-xl font-heading mb-2">5.2 Konsequenzen bei Verstößen</h3>
                        <p className="mb-2">Bei Nachweis oder begründetem Verdacht auf AI-Content:</p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Sofortige Sperrung des Accounts</li>
                            <li>Entfernung aller Inhalte</li>
                            <li>Permanenter Ban ohne Möglichkeit zur Wiederherstellung</li>
                            <li>Keine Rückerstattung gezahlter Gebühren (sobald Marketplace aktiv)</li>
                            <li>Rechtliche Schritte bei wiederholten Verstößen unter falschen Identitäten</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-2">5.3 Meldepflicht</h3>
                        <p>
                            Wenn Sie AI-Content auf Varbe entdecken, sind Sie aufgefordert, dies umgehend zu melden unter info@varbe.org. Falschmeldungen zur Schädigung anderer Künstler können ebenfalls zur Account-Sperrung führen.
                        </p>
                    </section>

                    {/* 6. Inhalte und Nutzungsrechte */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">6. Inhalte und Nutzungsrechte</h2>
                        
                        <h3 className="text-xl font-heading mb-2">6.1 Ihre Inhalte</h3>
                        <p className="mb-4">
                            Sie behalten alle Urheberrechte und Eigentumsrechte an den von Ihnen hochgeladenen Inhalten (Kunstwerke, Texte, Voice Notes, Videos). Durch das Hochladen gewähren Sie Varbe jedoch ein nicht-exklusives, weltweites, gebührenfreies Recht, Ihre Inhalte im Rahmen der Plattform anzuzeigen, zu speichern und zu verbreiten.
                        </p>

                        <h3 className="text-xl font-heading mb-2">6.2 Lizenzumfang</h3>
                        <p className="mb-2">Die Lizenz umfasst:</p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Anzeige Ihrer Kunstwerke im Discovery Feed, auf Profilen, in Suchergebnissen</li>
                            <li>Verwendung für Marketing-Zwecke (Social Media, Blog, Werbung) mit Nennung Ihres Künstlernamens</li>
                            <li>Technische Verarbeitung (Komprimierung, Thumbnail-Erstellung, Wasserzeichen)</li>
                        </ul>
                        <p className="mb-4">
                            Die Lizenz erlischt, wenn Sie den Inhalt löschen oder Ihren Account schließen. Bereits veröffentlichte Marketing-Materialien können weiterhin verwendet werden.
                        </p>

                        <h3 className="text-xl font-heading mb-2">6.3 Verantwortung für Inhalte</h3>
                        <p className="mb-2">Sie garantieren, dass:</p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Sie alle notwendigen Rechte an den hochgeladenen Inhalten besitzen</li>
                            <li>Die Inhalte keine Rechte Dritter verletzen (Urheberrecht, Markenrecht, Persönlichkeitsrecht)</li>
                            <li>Die Inhalte nicht gegen geltendes Recht verstoßen</li>
                            <li>Die Inhalte von Ihnen selbst erstellt wurden (keine AI, keine gestohlenen Werke)</li>
                        </ul>
                        <p>
                            Bei Rechtsverletzungen haften Sie persönlich. Varbe kann Inhalte ohne Vorankündigung entfernen, wenn ein begründeter Verdacht auf Rechtsverletzung besteht.
                        </p>
                    </section>

                    {/* 7. Community-Richtlinien */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">7. Community-Richtlinien</h2>
                        
                        <h3 className="text-xl font-heading mb-2">7.1 Verbotene Inhalte und Verhaltensweisen</h3>
                        <p className="mb-2">Folgende Inhalte und Verhaltensweisen sind auf Varbe strengstens verboten:</p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>AI-generierte Kunst jeglicher Art</li>
                            <li>Hassrede, Diskriminierung, Belästigung</li>
                            <li>Pornografische, gewaltverherrlichende oder illegale Inhalte</li>
                            <li>Spam, Werbung für externe Dienste ohne Genehmigung</li>
                            <li>Manipulation (Fake-Accounts, Bots, gekaufte Follower)</li>
                            <li>Betrug oder betrügerische Absichten</li>
                            <li>Identitätsdiebstahl oder Impersonation</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-2">7.2 Qualitätsstandards für Kommentare</h3>
                        <p className="mb-2">Um konstruktive Diskussionen zu fördern:</p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Kommentare sollten substanziell sein (Minimum 15 Zeichen)</li>
                            <li>Einwort-Kommentare (&quot;cool&quot;, &quot;nice&quot;) sind unerwünscht</li>
                            <li>Respektvoller Umgangston ist Pflicht</li>
                            <li>Konstruktive Kritik ist erlaubt, persönliche Angriffe nicht</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-2">7.3 Moderationsrechte</h3>
                        <p className="mb-2">Varbe behält sich vor:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Inhalte zu entfernen, die gegen diese Richtlinien verstoßen</li>
                            <li>Accounts temporär oder permanent zu sperren</li>
                            <li>Chat-Bereiche zu moderieren</li>
                            <li>Artist Circles aufzulösen bei schwerwiegenden Verstößen</li>
                        </ul>
                    </section>

                    {/* 8. Marketplace-Regelungen */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">8. Marketplace-Regelungen (ab Start des Marketplace)</h2>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                            <p className="font-semibold">Hinweis:</p>
                            <p>Die folgenden Regelungen treten erst in Kraft, sobald der Marketplace auf Varbe live geht. Sie werden rechtzeitig per Email informiert.</p>
                        </div>

                        <h3 className="text-xl font-heading mb-2">8.1 Vertragspartner</h3>
                        <p className="mb-4">
                            Bei Transaktionen über den Varbe Marketplace sind Vertragspartner ausschließlich der Verkäufer (Künstler) und der Käufer. Varbe fungiert als Vermittler und technische Plattform, ist aber nicht Vertragspartei.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.2 Listings erstellen</h3>
                        <p className="mb-2">Verifizierte Künstler können Kunstwerke zum Verkauf einstellen. Jedes Listing muss enthalten:</p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Mindestens ein hochauflösendes Bild</li>
                            <li>Titel und Beschreibung</li>
                            <li>Kategorie, Technik, Maße</li>
                            <li>Preis (inklusive MwSt.)</li>
                            <li>Versandoptionen und -kosten</li>
                        </ul>
                        <p className="mb-4">
                            Varbe behält sich vor, Listings ohne Angabe von Gründen abzulehnen oder zu entfernen.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.3 Gebühren</h3>
                        <p className="mb-2">
                            Varbe erhebt eine Vermittlungsgebühr von <strong>10% des Verkaufspreises</strong>, maximal jedoch <strong>10€</strong> pro Transaktion. Zusätzlich fallen Zahlungsdienstleister-Gebühren an (Stripe: ca. 1,5% + 0,25€).
                        </p>
                        <div className="bg-gray-100 p-3 rounded mb-2">
                            <p><strong>Beispiel:</strong> Bei einem Verkaufspreis von 100€ erhält der Künstler ca. 88,25€ (100€ - 10€ Varbe-Gebühr - 1,75€ Stripe-Gebühren).</p>
                        </div>
                        <p className="mb-4">
                            Es gibt keine monatlichen Gebühren, Listing-Gebühren oder versteckten Kosten.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.4 Zahlungsabwicklung</h3>
                        <p className="mb-2">
                            Alle Zahlungen werden über Stripe abgewickelt. Der Käufer zahlt den Gesamtbetrag (Kunstwerk + Versand) an Stripe. Das Geld wird in Escrow gehalten bis:
                        </p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Der Verkäufer das Kunstwerk versendet hat (mit Tracking)</li>
                            <li>Die 14-tägige Käuferschutz-Frist abgelaufen ist (ohne Beschwerde)</li>
                        </ul>
                        <p className="mb-4">
                            Anschließend erfolgt die automatische Auszahlung an den Verkäufer am 15. des Folgemonats (Mindestauszahlungsbetrag: 10€).
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.5 Preise und Mehrwertsteuer</h3>
                        <p className="mb-4">
                            Alle Preise sind in Euro anzugeben. Verkäufer sind selbst verantwortlich für die korrekte Angabe und Abführung der Mehrwertsteuer. Varbe stellt keine Rechnungen aus und übernimmt keine steuerliche Beratung.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.6 Versand</h3>
                        <p className="mb-2">Der Verkäufer ist verantwortlich für:</p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Fachgerechte Verpackung</li>
                            <li>Versand innerhalb von 5 Werktagen nach Zahlungseingang</li>
                            <li>Angabe einer gültigen Tracking-Nummer</li>
                            <li>Versicherung des Pakets bei hohem Wert (empfohlen)</li>
                        </ul>
                        <p className="mb-4">
                            Varbe übernimmt keine Haftung für Versandschäden oder -verluste. Dies liegt in der Verantwortung von Verkäufer und Versanddienstleister.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.7 Widerrufsrecht (Käufer)</h3>
                        <p className="mb-2">
                            Käufer haben gemäß EU-Recht ein 14-tägiges Widerrufsrecht ab Erhalt der Ware. Das Widerrufsrecht erlischt bei:
                        </p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Maßangefertigten oder personalisierten Kunstwerken</li>
                            <li>Versiegelten Waren, die aus Gründen des Gesundheitsschutzes nicht zurückgegeben werden können</li>
                        </ul>
                        <p className="mb-4">
                            Bei berechtigtem Widerruf trägt der Käufer die Rücksendungskosten, sofern nicht anders vereinbart.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.8 Käuferschutz</h3>
                        <p className="mb-2">
                            Varbe bietet 14 Tage Käuferschutz ab Zustellung. Bei berechtigten Beschwerden (Kunstwerk nicht wie beschrieben, beschädigt, nicht angekommen) erhält der Käufer eine vollständige Rückerstattung.
                        </p>
                        <p className="mb-2">Der Käufer muss Beschwerden innerhalb von 14 Tagen nach Erhalt einreichen mit:</p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Beschreibung des Problems</li>
                            <li>Fotos bei Beschädigung</li>
                            <li>Nachweisen bei Nichtankunft</li>
                        </ul>
                        <p className="mb-4">
                            Varbe prüft jede Beschwerde und entscheidet nach eigenem Ermessen.
                        </p>

                        <h3 className="text-xl font-heading mb-2">8.9 Gewährleistung und Haftung</h3>
                        <p className="mb-2">
                            Der Verkäufer haftet für Mängel der Ware nach gesetzlichen Bestimmungen. Varbe übernimmt keine Gewährleistung für die angebotenen Kunstwerke, da wir lediglich Vermittler sind.
                        </p>
                        <p>
                            Bei Streitigkeiten zwischen Käufer und Verkäufer kann Varbe als Mediator auftreten, ist aber nicht verpflichtet dazu.
                        </p>
                    </section>

                    {/* 9. Datenschutz */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">9. Datenschutz</h2>
                        
                        <h3 className="text-xl font-heading mb-2">9.1 Datenverarbeitung</h3>
                        <p className="mb-2">
                            Varbe verarbeitet personenbezogene Daten gemäß der Datenschutzerklärung und der DSGVO. Wir erheben nur die Daten, die für den Betrieb der Plattform notwendig sind:
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Account-Daten (Name, Email, Passwort verschlüsselt)</li>
                            <li>Profil-Informationen (Bio, Künstlername, Standort optional)</li>
                            <li>Nutzungsdaten (Likes, Follows, Kommentare)</li>
                            <li>Zahlungsdaten (nur bei Marketplace-Nutzung, über Stripe)</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-2">9.2 Datennutzung</h3>
                        <p className="mb-2">Ihre Daten werden verwendet für:</p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Bereitstellung und Verbesserung der Plattform</li>
                            <li>Kommunikation (Updates, Feature-Launches)</li>
                            <li>Personalisierung des Discovery Feeds</li>
                            <li>Abwicklung von Transaktionen (sobald Marketplace aktiv)</li>
                        </ul>
                        <p className="mb-4">
                            Wir verkaufen keine Daten an Dritte. Wir nutzen keine Tracking-Pixel von Drittanbietern außer notwendiger Analytics-Tools.
                        </p>

                        <h3 className="text-xl font-heading mb-2">9.3 Datenlöschung</h3>
                        <p className="mb-2">
                            Sie können jederzeit die Löschung Ihrer Daten verlangen unter info@varbe.org. Wir löschen alle personenbezogenen Daten innerhalb von 30 Tagen, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
                        </p>
                        <p>
                            Detaillierte Informationen finden Sie in unserer <Link href="/legal/datenschutz" className="text-black underline">Datenschutzerklärung</Link>.
                        </p>
                    </section>

                    {/* 10. Haftungsausschluss */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">10. Haftungsausschluss</h2>
                        
                        <h3 className="text-xl font-heading mb-2">10.1 Early Access / Beta-Status</h3>
                        <p className="mb-4">
                            Varbe befindet sich im Early Access. Die Plattform wird kontinuierlich weiterentwickelt. Es können Fehler, Bugs oder Ausfälle auftreten. Wir bemühen uns um maximale Verfügbarkeit, können diese aber nicht garantieren.
                        </p>

                        <h3 className="text-xl font-heading mb-2">10.2 Haftungsbeschränkung</h3>
                        <p className="mb-2">
                            Varbe haftet nur für Schäden, die auf Vorsatz oder grober Fahrlässigkeit beruhen. Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig.
                        </p>
                        <p className="mb-2">Varbe haftet insbesondere nicht für:</p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Schäden durch Nutzungsausfälle oder technische Probleme</li>
                            <li>Verlust von Daten (regelmäßige Backups empfohlen)</li>
                            <li>Streitigkeiten zwischen Nutzern</li>
                            <li>Qualität, Authentizität oder Rechtmäßigkeit von Nutzerinhalten</li>
                            <li>Handlungen Dritter (Betrug, Identitätsdiebstahl)</li>
                        </ul>

                        <h3 className="text-xl font-heading mb-2">10.3 Höchsthaftung</h3>
                        <p>
                            Die Gesamthaftung von Varbe ist begrenzt auf den Betrag der im letzten Jahr vom Nutzer gezahlten Gebühren (maximal 100€).
                        </p>
                    </section>

                    {/* 11. Kündigung und Sperrung */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">11. Kündigung und Sperrung</h2>
                        
                        <h3 className="text-xl font-heading mb-2">11.1 Ordentliche Kündigung</h3>
                        <p className="mb-4">
                            Beide Parteien (Nutzer und Varbe) können das Nutzungsverhältnis jederzeit ohne Angabe von Gründen beenden. Der Nutzer kann seinen Account löschen unter info@varbe.org.
                        </p>

                        <h3 className="text-xl font-heading mb-2">11.2 Außerordentliche Kündigung / Sperrung</h3>
                        <p className="mb-2">Varbe kann Accounts fristlos sperren bei:</p>
                        <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>Verstoß gegen die AI-Free Policy</li>
                            <li>Verstoß gegen Community-Richtlinien</li>
                            <li>Betrug oder betrügerischer Absicht</li>
                            <li>Rechtsverletzungen</li>
                            <li>Missbrauch der Plattform</li>
                        </ul>
                        <p>
                            Bei Sperrung verfallen alle Ansprüche. Bereits gezahlte Gebühren werden nicht erstattet.
                        </p>
                    </section>

                    {/* 12. Änderungen der AGB */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">12. Änderungen der AGB</h2>
                        <p className="mb-2">
                            Varbe behält sich vor, diese AGB jederzeit zu ändern, insbesondere bei:
                        </p>
                        <ul className="list-disc list-inside mb-4 space-y-1">
                            <li>Einführung neuer Features (Discovery Feed, Marketplace)</li>
                            <li>Gesetzlichen Änderungen</li>
                            <li>Anpassung an neue technische Gegebenheiten</li>
                        </ul>
                        <p>
                            Bei wesentlichen Änderungen werden registrierte Nutzer per Email informiert (mindestens 14 Tage vor Inkrafttreten). Widersprechen Sie nicht innerhalb von 14 Tagen, gelten die neuen AGB als akzeptiert. Bei Widerspruch endet das Nutzungsverhältnis.
                        </p>
                    </section>

                    {/* 13. Streitbeilegung */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">13. Streitbeilegung</h2>
                        
                        <h3 className="text-xl font-heading mb-2">13.1 Anwendbares Recht</h3>
                        <p className="mb-4">
                            Es gilt ausschließlich deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG).
                        </p>

                        <h3 className="text-xl font-heading mb-2">13.2 Gerichtsstand</h3>
                        <p className="mb-4">
                            Gerichtsstand für alle Streitigkeiten ist Bremen, Deutschland (soweit gesetzlich zulässig).
                        </p>

                        <h3 className="text-xl font-heading mb-2">13.3 Online-Streitbeilegung</h3>
                        <p className="mb-2">
                            Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                        </p>
                        <p className="mb-2">
                            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-black underline">
                                https://ec.europa.eu/consumers/odr
                            </a>
                        </p>
                        <p>
                            Varbe ist nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                        </p>
                    </section>

                    {/* 14. Salvatorische Klausel */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">14. Salvatorische Klausel</h2>
                        <p>
                            Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die unwirksame Bestimmung wird durch eine wirksame ersetzt, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
                        </p>
                    </section>

                    {/* 15. Kontakt */}
                    <section>
                        <h2 className="text-2xl font-heading mb-4">15. Kontakt</h2>
                        <p className="mb-2">
                            Bei Fragen zu diesen AGB, der Plattform oder sonstigen Anliegen:
                        </p>
                        <p><strong>Email:</strong> info@varbe.org</p>
                        <p><strong>Website:</strong> varbe.org</p>
                    </section>

                    {/* Footer */}
                    <div className="border-t-2 border-gray-200 pt-6 mt-8">
                        <p className="text-gray-600 mb-4">
                            <strong>Zuletzt aktualisiert:</strong> Dezember 2025
                        </p>
                        <p className="italic text-gray-600">
                            Durch die Registrierung und Nutzung von Varbe erklären Sie sich mit diesen Allgemeinen Geschäftsbedingungen einverstanden.
                        </p>
                    </div>
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
