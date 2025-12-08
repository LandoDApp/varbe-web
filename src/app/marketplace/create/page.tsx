"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function CreateListingPage() {
    // Marketplace is temporarily disabled - show coming soon page
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="card-comic bg-gradient-to-br from-[#CCFF00]/20 to-pink-100 p-8 md:p-12 border-4 border-black">
                        <div className="text-6xl md:text-8xl mb-6">🎨</div>
                        <h1 className="text-3xl md:text-5xl font-heading mb-4">Kunstwerk verkaufen</h1>
                        <div className="inline-block bg-[#CCFF00] px-4 py-2 border-2 border-black mb-6">
                            <span className="font-heading text-lg md:text-xl uppercase">Coming Soon</span>
                        </div>
                        <p className="text-lg font-body text-gray-700 mb-8">
                            Das Erstellen von Listings ist vorübergehend deaktiviert. 
                            Wir fokussieren uns aktuell auf den Community-Aspekt von Varbe.
                        </p>
                        
                        <div className="space-y-4 md:space-y-0 md:flex md:gap-4 justify-center">
                            <Link href="/feed/create">
                                <Button variant="accent" className="w-full md:w-auto text-lg px-8 py-4">
                                    📷 Post erstellen
                                </Button>
                            </Link>
                            <Link href="/feed">
                                <Button variant="primary" className="w-full md:w-auto text-lg px-8 py-4">
                                    🎨 Feed entdecken
                                </Button>
                            </Link>
                        </div>
                        
                        <div className="mt-8 p-4 bg-white/50 border-2 border-dashed border-black">
                            <p className="font-body text-sm text-gray-600">
                                <strong>Tipp:</strong> Du kannst deine Kunst jetzt schon im Feed teilen und dein Profil aufbauen. 
                                Sobald der Marketplace wieder aktiv ist, kannst du deine Werke zum Verkauf anbieten!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
