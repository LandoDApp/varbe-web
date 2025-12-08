"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

export default function JobsPage() {
    return (
        <main className="min-h-screen bg-transparent">
            <Navbar />
            
            <section className="py-24 md:py-32 lg:py-40">
                <div className="container mx-auto px-4 text-center">
                    {/* Big Emoji */}
                    <div className="text-8xl md:text-9xl mb-8">
                        💼🎨
                    </div>
                    
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading leading-[0.9] tracking-wide mb-6">
                        <span className="block" style={{ textShadow: '3px 3px 0px #FF10F0' }}>
                            JOBS COMING SOON!
                        </span>
                    </h1>
                    
                    {/* Beta Badge */}
                    <div className="inline-flex items-center gap-2 bg-[#FF10F0] text-white border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                        <span className="text-2xl">🧪</span>
                        <span className="font-heading text-xl uppercase">BETA PHASE</span>
                    </div>
                    
                    {/* Subheadline */}
                    <p className="text-lg md:text-xl lg:text-2xl font-body text-gray-700 max-w-2xl mx-auto mb-8 leading-relaxed">
                        The VARBE job board for artists and creatives is in development! 
                        Soon you'll find freelance gigs, full-time positions and creative projects here.
                    </p>
                    
                    {/* What's Coming Card */}
                    <div className="max-w-lg mx-auto mb-12 bg-white border-4 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="font-heading text-2xl md:text-3xl uppercase mb-6">
                            WHAT'S COMING
                        </h2>
                        
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎯</span>
                                <span className="font-body">Freelance & Full-time Positions</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏠</span>
                                <span className="font-body">Remote & On-site Jobs</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎨</span>
                                <span className="font-body">Illustration, Design, 3D, Animation</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">💰</span>
                                <span className="font-body">Transparent Fair Salaries</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📝</span>
                                <span className="font-body">One-Click Applications</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="max-w-md mx-auto mb-12">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-heading text-sm">DEVELOPMENT PROGRESS</span>
                            <span className="font-heading text-sm text-[#FF10F0]">25%</span>
                        </div>
                        <div className="h-4 bg-gray-200 border-2 border-black overflow-hidden">
                            <div 
                                className="h-full bg-[#FF10F0]" 
                                style={{ width: '25%' }}
                            />
                        </div>
                    </div>
                    
                    {/* Notify Me */}
                    <div className="max-w-md mx-auto mb-12 bg-gray-100 border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="font-heading text-lg mb-4">GET NOTIFIED</h3>
                        <p className="font-body text-sm text-gray-600 mb-4">
                            Want to be notified when the job board launches?
                        </p>
                        <Link href="/auth/register">
                            <Button variant="accent" className="w-full">
                                CREATE ACCOUNT →
                            </Button>
                        </Link>
                    </div>
                    
                    {/* CTA */}
                    <div className="space-y-4">
                        <p className="font-body text-gray-600">
                            In the meantime:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/commissions">
                                <Button variant="accent" className="w-full sm:w-auto text-lg px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    📋 COMMISSIONS
                                </Button>
                            </Link>
                            <Link href="/kuenstler">
                                <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    🎨 DISCOVER ARTISTS
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
