"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

export default function AppComingSoon() {
    return (
        <main className="min-h-screen bg-transparent">
            <Navbar />
            
            <section className="py-24 md:py-32 lg:py-40">
                <div className="container mx-auto px-4 text-center">
                    {/* Big Emoji */}
                    <div className="text-8xl md:text-9xl mb-8 animate-bounce">
                        📱🚀
                    </div>
                    
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading leading-[0.9] tracking-wide mb-6">
                        <span className="block" style={{ textShadow: '3px 3px 0px #CCFF00' }}>
                            APP KOMMT BALD!
                        </span>
                    </h1>
                    
                    {/* Subheadline */}
                    <p className="text-lg md:text-xl lg:text-2xl font-body text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Wir arbeiten gerade an der VARBE App für iOS und Android. 
                        Swipe-Discovery, Offline-Mode und mehr - direkt in deiner Tasche.
                    </p>
                    
                    {/* Progress Card */}
                    <div className="max-w-lg mx-auto mb-12 bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="font-heading text-2xl md:text-3xl uppercase mb-6">
                            ENTWICKLUNGS-STATUS
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-body">Design</span>
                                <span className="font-heading text-accent">✅ FERTIG</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-body">Core Features</span>
                                <span className="font-heading text-accent">🔨 IN ARBEIT</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-body">Testing</span>
                                <span className="font-heading text-gray-400">⏳ BALD</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-body">Release</span>
                                <span className="font-heading text-gray-400">🎯 Q2 2025</span>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-6 h-4 bg-gray-200 border-2 border-black overflow-hidden">
                            <div 
                                className="h-full bg-accent" 
                                style={{ width: '45%' }}
                            />
                        </div>
                        <p className="font-heading text-sm mt-2">45% FERTIG</p>
                    </div>
                    
                    {/* What's Coming */}
                    <div className="max-w-3xl mx-auto mb-12">
                        <h2 className="font-heading text-2xl md:text-3xl uppercase mb-8">
                            WAS DICH ERWARTET
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="text-3xl mb-2">👆</div>
                                <p className="font-heading text-sm uppercase">SWIPE FEED</p>
                            </div>
                            <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="text-3xl mb-2">📍</div>
                                <p className="font-heading text-sm uppercase">LOCAL RADAR</p>
                            </div>
                            <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="text-3xl mb-2">🔔</div>
                                <p className="font-heading text-sm uppercase">PUSH ALERTS</p>
                            </div>
                            <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="text-3xl mb-2">📴</div>
                                <p className="font-heading text-sm uppercase">OFFLINE MODE</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* CTA */}
                    <div className="space-y-4">
                        <p className="font-body text-gray-600">
                            Nutze bis dahin einfach unsere Web-App:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register">
                                <Button variant="accent" className="w-full sm:w-auto text-lg px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    JETZT REGISTRIEREN
                                </Button>
                            </Link>
                            <Link href="/feed">
                                <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    FEED ENTDECKEN →
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            
            <Footer />
        </main>
    );
}


