"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/context/AuthContext";
import { BADGES, getBadgeById } from "@/lib/badges";
import { Badge, BadgeCategory, BadgeRarity, UserAchievement } from "@/types";
import { useTranslations } from 'next-intl';

const RARITY_COLORS: Record<BadgeRarity, string> = {
    common: '#9CA3AF',      // Gray
    uncommon: '#22C55E',    // Green
    rare: '#3B82F6',        // Blue
    very_rare: '#A855F7',   // Purple
    legendary: '#F59E0B',   // Gold
};

const RARITY_NAMES: Record<BadgeRarity, string> = {
    common: 'Gewöhnlich',
    uncommon: 'Ungewöhnlich',
    rare: 'Selten',
    very_rare: 'Sehr Selten',
    legendary: 'Legendär',
};

const CATEGORY_NAMES: Record<BadgeCategory, string> = {
    artist: '🎨 Künstler',
    buyer: '🛍️ Käufer',
    community: '👥 Community',
    special: '⭐ Spezial',
    easter_egg: '🔮 Geheim',
};

export default function BadgesPage() {
    const { user, profile } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
    const [selectedRarity, setSelectedRarity] = useState<BadgeRarity | 'all'>('all');
    const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
    
    const userAchievements = profile?.achievementData?.achievements || [];
    const unlockedBadgeIds = userAchievements.map(a => a.badgeId);
    
    // Filter badges
    const filteredBadges = BADGES.filter(badge => {
        // Hide hidden badges unless unlocked
        if (badge.category === 'easter_egg' && !unlockedBadgeIds.includes(badge.id)) {
            return false;
        }
        
        if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
            return false;
        }
        
        if (selectedRarity !== 'all' && badge.rarity !== selectedRarity) {
            return false;
        }
        
        if (showUnlockedOnly && !unlockedBadgeIds.includes(badge.id)) {
            return false;
        }
        
        return true;
    });
    
    // Stats
    const totalBadges = BADGES.filter(b => b.category !== 'easter_egg').length;
    const unlockedCount = userAchievements.length;
    const totalPoints = profile?.achievementData?.stats?.totalPoints || 0;
    
    // Group by category
    const categories: BadgeCategory[] = ['artist', 'buyer', 'community', 'special'];
    if (unlockedBadgeIds.some(id => BADGES.find(b => b.id === id && b.category === 'easter_egg'))) {
        categories.push('easter_egg');
    }
    
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            {/* Hero Section */}
            <div className="bg-black text-white py-12">
                <div className="container mx-auto max-w-6xl px-4">
                    <h1 className="text-5xl font-heading mb-4">🏆 BADGES</h1>
                    <p className="text-gray-400 text-lg max-w-2xl">
                        Sammle Badges durch Aktivität auf Varbe. Je seltener das Badge, desto mehr Punkte!
                    </p>
                    
                    {user && (
                        <div className="flex gap-8 mt-8">
                            <div>
                                <p className="text-4xl font-heading text-[#CCFF00]">{unlockedCount}</p>
                                <p className="text-gray-400 text-sm">von {totalBadges} Badges</p>
                            </div>
                            <div>
                                <p className="text-4xl font-heading text-[#CCFF00]">{totalPoints}</p>
                                <p className="text-gray-400 text-sm">Punkte</p>
                            </div>
                            <div>
                                <p className="text-4xl font-heading text-[#CCFF00]">
                                    {totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0}%
                                </p>
                                <p className="text-gray-400 text-sm">Fortschritt</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="container mx-auto max-w-6xl px-4 py-8">
                {/* Filters */}
                <div className="bg-white border-4 border-black p-4 mb-8 shadow-comic">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Category Filter */}
                        <div>
                            <label className="text-sm font-bold mr-2">Kategorie:</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as any)}
                                className="border-2 border-black p-2"
                            >
                                <option value="all">Alle</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{CATEGORY_NAMES[cat]}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Rarity Filter */}
                        <div>
                            <label className="text-sm font-bold mr-2">Seltenheit:</label>
                            <select
                                value={selectedRarity}
                                onChange={(e) => setSelectedRarity(e.target.value as any)}
                                className="border-2 border-black p-2"
                            >
                                <option value="all">Alle</option>
                                {Object.entries(RARITY_NAMES).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Unlocked Only */}
                        {user && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showUnlockedOnly}
                                    onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                                    className="w-5 h-5 border-2 border-black"
                                />
                                <span className="font-bold">Nur Freigeschaltete</span>
                            </label>
                        )}
                        
                        <div className="ml-auto text-sm text-gray-500">
                            {filteredBadges.length} Badges
                        </div>
                    </div>
                </div>
                
                {/* Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBadges.map(badge => {
                        const isUnlocked = unlockedBadgeIds.includes(badge.id);
                        const achievement = userAchievements.find(a => a.badgeId === badge.id);
                        
                        return (
                            <div
                                key={badge.id}
                                className={`bg-white border-4 border-black p-4 transition-all ${
                                    isUnlocked 
                                        ? 'shadow-comic' 
                                        : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                                }`}
                                style={{ 
                                    borderTopWidth: '6px', 
                                    borderTopColor: isUnlocked ? RARITY_COLORS[badge.rarity] : '#9CA3AF' 
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div 
                                        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4 ${
                                            isUnlocked ? 'border-black' : 'border-gray-300'
                                        }`}
                                        style={{ 
                                            backgroundColor: isUnlocked ? RARITY_COLORS[badge.rarity] + '20' : '#f3f4f6' 
                                        }}
                                    >
                                        {badge.icon}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-heading text-lg">{badge.name}</h3>
                                            {isUnlocked && (
                                                <span className="text-green-500">✓</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                                        
                                        {/* Meta */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <span 
                                                className="text-xs px-2 py-0.5 border font-bold"
                                                style={{ 
                                                    borderColor: RARITY_COLORS[badge.rarity],
                                                    color: RARITY_COLORS[badge.rarity]
                                                }}
                                            >
                                                {RARITY_NAMES[badge.rarity]}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                +{badge.points} Punkte
                                            </span>
                                        </div>
                                        
                                        {/* Unlock date */}
                                        {isUnlocked && achievement && (
                                            <p className="text-xs text-green-600 mt-2">
                                                ✅ Freigeschaltet am {new Date(achievement.unlockedAt).toLocaleDateString('de-DE')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {filteredBadges.length === 0 && (
                    <div className="text-center py-16">
                        <span className="text-6xl">🔍</span>
                        <p className="mt-4 font-heading text-xl">Keine Badges gefunden</p>
                        <p className="text-gray-500">Versuche andere Filter</p>
                    </div>
                )}
                
                {/* How to earn section */}
                <div className="mt-12 bg-white border-4 border-black p-8 shadow-comic">
                    <h2 className="font-heading text-2xl mb-6">🎯 WIE VERDIENE ICH BADGES?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 border-2 border-gray-200">
                            <span className="text-3xl">🎨</span>
                            <h3 className="font-heading mt-2">Künstler-Badges</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Verkaufe Kunstwerke, lade Videos hoch, bekomme gute Bewertungen
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-2 border-gray-200">
                            <span className="text-3xl">🛍️</span>
                            <h3 className="font-heading mt-2">Käufer-Badges</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Kaufe Kunst, schreibe Reviews, folge Künstlern
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-2 border-gray-200">
                            <span className="text-3xl">👥</span>
                            <h3 className="font-heading mt-2">Community-Badges</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Like, kommentiere, teile und hilf anderen
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-2 border-gray-200">
                            <span className="text-3xl">🔮</span>
                            <h3 className="font-heading mt-2">Geheime Badges</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Versteckte Achievements - kannst du sie alle finden?
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Rarity Guide */}
                <div className="mt-8 bg-white border-4 border-black p-8 shadow-comic">
                    <h2 className="font-heading text-2xl mb-6">💎 SELTENHEITSSTUFEN</h2>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(RARITY_NAMES).map(([rarity, name]) => (
                            <div 
                                key={rarity}
                                className="flex items-center gap-2 px-4 py-2 border-2"
                                style={{ borderColor: RARITY_COLORS[rarity as BadgeRarity] }}
                            >
                                <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: RARITY_COLORS[rarity as BadgeRarity] }}
                                />
                                <span className="font-bold">{name}</span>
                                <span className="text-sm text-gray-500">
                                    ({rarity === 'common' ? '10-50' : 
                                      rarity === 'uncommon' ? '75-100' : 
                                      rarity === 'rare' ? '150-200' : 
                                      rarity === 'very_rare' ? '250-300' : '500-1000'} Punkte)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}

