"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';

export default function CommissionsPage() {
    const t = useTranslations('commissions');

    // Commissions are temporarily disabled - show coming soon page
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="card-comic bg-gradient-to-br from-purple-100 to-pink-100 p-8 md:p-12 border-4 border-black">
                        <div className="text-6xl md:text-8xl mb-6">✨</div>
                        <h1 className="text-4xl md:text-6xl font-heading mb-4">Aufträge</h1>
                        <div className="inline-block bg-accent px-4 py-2 border-2 border-black mb-6">
                            <span className="font-heading text-xl md:text-2xl uppercase">Coming Soon</span>
                        </div>
                        <p className="text-lg md:text-xl font-body text-gray-700 mb-8 max-w-xl mx-auto">
                            Die Kommissionsbörse wird bald verfügbar sein! Aktuell fokussieren wir uns auf den Aufbau einer starken Künstler-Community.
                        </p>
                        
                        <div className="space-y-4 md:space-y-0 md:flex md:gap-4 justify-center">
                            <Link href="/feed">
                                <Button variant="accent" className="w-full md:w-auto text-lg px-8 py-4">
                                    📷 Feed entdecken
                                </Button>
                            </Link>
                            <Link href="/kuenstler">
                                <Button variant="primary" className="w-full md:w-auto text-lg px-8 py-4">
                                    🎨 Künstler entdecken
                                </Button>
                            </Link>
                        </div>
                    </div>
                    
                    {/* Info Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mt-12">
                        <div className="card-comic bg-white p-6 border-4 border-black text-center">
                            <div className="text-4xl mb-3">🎨</div>
                            <h3 className="font-heading text-xl mb-2">Aufträge vergeben</h3>
                            <p className="font-body text-gray-600 text-sm">
                                Bald kannst du individuelle Kunstaufträge an verifizierte Künstler vergeben.
                            </p>
                        </div>
                        <div className="card-comic bg-white p-6 border-4 border-black text-center">
                            <div className="text-4xl mb-3">💜</div>
                            <h3 className="font-heading text-xl mb-2">Aufträge annehmen</h3>
                            <p className="font-body text-gray-600 text-sm">
                                Als Künstler kannst du bald auf Auftragsanfragen reagieren.
                            </p>
                        </div>
                        <div className="card-comic bg-white p-6 border-4 border-black text-center">
                            <div className="text-4xl mb-3">🤝</div>
                            <h3 className="font-heading text-xl mb-2">Jetzt vernetzen</h3>
                            <p className="font-body text-gray-600 text-sm">
                                Nutze den Feed und Direktnachrichten, um Künstler kennenzulernen!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
