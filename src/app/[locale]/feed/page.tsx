"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function FeedPage() {
    return (
        <main className="min-h-screen bg-transparent">
            <Navbar />
            
            <section className="py-24 md:py-32 lg:py-40">
                <div className="container mx-auto px-4 text-center">
                    {/* Big Emoji */}
                    <div className="text-8xl md:text-9xl mb-8">
                        📱✨
                </div>
                
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading leading-[0.9] tracking-wide mb-6">
                        <span className="block" style={{ textShadow: '3px 3px 0px #CCFF00' }}>
                            FEED KOMMT BALD!
                                        </span>
                    </h1>
                    
                    {/* Beta Badge */}
                    <div className="inline-flex items-center gap-2 bg-accent border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                        <span className="text-2xl">🧪</span>
                        <span className="font-heading text-xl uppercase">TESTPHASE</span>
                                </div>
                    
                    {/* Subheadline */}
                    <p className="text-lg md:text-xl lg:text-2xl font-body text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Wir sind noch in der Testphase! Der Social Feed mit Swipe-Discovery, 
                        Posts und mehr ist in Entwicklung. Bald kannst du hier Kunst entdecken wie auf TikTok.
                    </p>
                    
                    {/* What's Coming Card */}
                    <div className="max-w-lg mx-auto mb-12 bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="font-heading text-2xl md:text-3xl uppercase mb-6">
                            WAS KOMMT
                        </h2>
                        
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">👆</span>
                                <span className="font-body">Swipe-Discovery wie TikTok</span>
                                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📝</span>
                                <span className="font-body">Posts, Likes & Kommentare</span>
                                                </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🔔</span>
                                <span className="font-body">Follower & Benachrichtigungen</span>
                                </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📌</span>
                                <span className="font-body">Boards & Sammlungen</span>
                                </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🔁</span>
                                <span className="font-body">Reposts & Zitate</span>
                        </div>
                                    </div>
                            </div>
                            
                    {/* Progress */}
                    <div className="max-w-md mx-auto mb-12">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-heading text-sm">ENTWICKLUNGSFORTSCHRITT</span>
                            <span className="font-heading text-sm text-accent">35%</span>
                                </div>
                        <div className="h-4 bg-gray-200 border-2 border-black overflow-hidden">
                            <div 
                                className="h-full bg-accent" 
                                style={{ width: '35%' }}
                            />
                                        </div>
                                    </div>
                    
                                                    </div>
            </section>
            
            <Footer />
        </main>
    );
}
