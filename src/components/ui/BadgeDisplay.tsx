"use client";

import { useState } from "react";
import { Badge, BadgeRarity, UserAchievement } from "@/types";
import { getBadgeById, getRarityStars, getRarityLabel, getCategoryLabel } from "@/lib/badges";

// ========================================
// SINGLE BADGE COMPONENT
// ========================================

interface BadgeItemProps {
    badge: Badge;
    unlocked: boolean;
    progress?: { current: number; target: number };
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
    onClick?: () => void;
}

export function BadgeItem({ badge, unlocked, progress, size = 'md', showTooltip = true, onClick }: BadgeItemProps) {
    const [showDetails, setShowDetails] = useState(false);
    
    const sizeClasses = {
        sm: 'w-12 h-12 text-xl',
        md: 'w-16 h-16 text-2xl',
        lg: 'w-24 h-24 text-4xl',
    };
    
    const colorClasses = {
        green: 'from-[#CCFF00]/20 to-[#CCFF00]/5 border-[#CCFF00] shadow-[#CCFF00]/30',
        pink: 'from-[#FF10F0]/20 to-[#FF10F0]/5 border-[#FF10F0] shadow-[#FF10F0]/30',
        gold: 'from-yellow-400/20 to-yellow-400/5 border-yellow-400 shadow-yellow-400/30',
        white: 'from-white/20 to-white/5 border-white shadow-white/30',
        special: 'from-purple-500/20 via-pink-500/20 to-orange-500/20 border-purple-400 shadow-purple-400/30',
    };
    
    const rarityGlow = {
        common: '',
        uncommon: 'animate-pulse',
        rare: 'ring-2 ring-offset-2 ring-offset-black ring-[#CCFF00]/50',
        very_rare: 'ring-2 ring-offset-2 ring-offset-black ring-[#FF10F0]/50 animate-pulse',
        legendary: 'ring-4 ring-offset-2 ring-offset-black ring-yellow-400 animate-bounce',
    };
    
    return (
        <div className="relative">
            <button
                onClick={() => showTooltip ? setShowDetails(!showDetails) : onClick?.()}
                className={`
                    relative ${sizeClasses[size]} 
                    border-4 border-black bg-gradient-to-br
                    ${unlocked ? colorClasses[badge.color] : 'from-gray-300 to-gray-200 border-gray-400'}
                    ${unlocked && rarityGlow[badge.rarity]}
                    transition-all duration-200 hover:scale-110
                    flex items-center justify-center
                    ${unlocked ? '' : 'grayscale opacity-60'}
                `}
                style={{
                    boxShadow: unlocked ? `4px 4px 0px #000` : `2px 2px 0px #666`,
                }}
            >
                {unlocked ? (
                    <span className="drop-shadow-lg">{badge.icon}</span>
                ) : (
                    <span className="text-gray-500">❓</span>
                )}
                
                {/* Progress indicator */}
                {!unlocked && progress && progress.target > 1 && (
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-400">
                        <div 
                            className="h-full bg-[#CCFF00]"
                            style={{ width: `${(progress.current / progress.target) * 100}%` }}
                        />
                    </div>
                )}
                
                {/* Legendary sparkle effect */}
                {unlocked && badge.rarity === 'legendary' && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
                        <div className="absolute top-1/4 right-0 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-100" />
                        <div className="absolute bottom-1/4 left-0 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-200" />
                    </div>
                )}
            </button>
            
            {/* Tooltip */}
            {showTooltip && showDetails && (
                <div 
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white border-4 border-black p-3"
                    style={{ boxShadow: '4px 4px 0px #000' }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                            <h4 className="font-heading text-sm font-bold">{badge.name}</h4>
                            <span className="text-xs">{getRarityStars(badge.rarity)}</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                    <div className="flex justify-between items-center text-xs">
                        <span className="bg-gray-100 px-2 py-0.5 border border-black">
                            {getCategoryLabel(badge.category)}
                        </span>
                        <span className={`px-2 py-0.5 font-bold ${
                            badge.rarity === 'legendary' ? 'bg-yellow-400' :
                            badge.rarity === 'very_rare' ? 'bg-[#FF10F0] text-white' :
                            badge.rarity === 'rare' ? 'bg-[#CCFF00]' :
                            'bg-gray-200'
                        }`}>
                            {getRarityLabel(badge.rarity)}
                        </span>
                    </div>
                    {progress && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Fortschritt</span>
                                <span className="font-bold">{progress.current}/{progress.target}</span>
                            </div>
                            <div className="h-2 bg-gray-200 border border-black">
                                <div 
                                    className="h-full bg-[#CCFF00]"
                                    style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                        🏆 {badge.points} Punkte
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black transform rotate-45" />
                </div>
            )}
        </div>
    );
}

// ========================================
// BADGE GRID COMPONENT
// ========================================

interface BadgeGridProps {
    badges: Badge[];
    unlockedBadgeIds: string[];
    achievements?: UserAchievement[];
    showLocked?: boolean;
    maxDisplay?: number;
    size?: 'sm' | 'md' | 'lg';
}

export function BadgeGrid({ 
    badges, 
    unlockedBadgeIds, 
    achievements = [],
    showLocked = true,
    maxDisplay,
    size = 'md'
}: BadgeGridProps) {
    const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
    
    const getProgress = (badgeId: string) => {
        return achievements.find(a => a.badgeId === badgeId)?.progress;
    };
    
    return (
        <div className="flex flex-wrap gap-2">
            {displayBadges.map(badge => {
                const unlocked = unlockedBadgeIds.includes(badge.id);
                if (!showLocked && !unlocked) return null;
                
                return (
                    <BadgeItem
                        key={badge.id}
                        badge={badge}
                        unlocked={unlocked}
                        progress={getProgress(badge.id)}
                        size={size}
                    />
                );
            })}
        </div>
    );
}

// ========================================
// BADGE SHOWCASE (Profile Display)
// ========================================

interface BadgeShowcaseProps {
    showcasedBadgeIds: string[];
    displayStyle?: 'grid' | 'row';
}

export function BadgeShowcase({ showcasedBadgeIds, displayStyle = 'row' }: BadgeShowcaseProps) {
    if (showcasedBadgeIds.length === 0) return null;
    
    return (
        <div className={`
            ${displayStyle === 'row' ? 'flex gap-2' : 'grid grid-cols-5 gap-2'}
        `}>
            {showcasedBadgeIds.slice(0, 5).map(badgeId => {
                const badge = getBadgeById(badgeId);
                if (!badge) return null;
                
                return (
                    <BadgeItem
                        key={badgeId}
                        badge={badge}
                        unlocked={true}
                        size="sm"
                    />
                );
            })}
        </div>
    );
}

// ========================================
// BADGE UNLOCK NOTIFICATION
// ========================================

interface BadgeUnlockProps {
    badge: Badge;
    onClose: () => void;
}

export function BadgeUnlockNotification({ badge, onClose }: BadgeUnlockProps) {
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={onClose}
        >
            {/* Confetti effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-2 h-2 ${
                            i % 3 === 0 ? 'bg-[#CCFF00]' : 
                            i % 3 === 1 ? 'bg-[#FF10F0]' : 'bg-yellow-400'
                        }`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: '-20px',
                            animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
                            animationDelay: `${Math.random() * 0.5}s`,
                        }}
                    />
                ))}
            </div>
            
            <div 
                className="bg-white border-8 border-black p-8 text-center max-w-md mx-4 animate-bounce-in"
                style={{ boxShadow: '8px 8px 0px #000' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="text-6xl mb-4 animate-spin-slow">{badge.icon}</div>
                <h2 className="font-heading text-3xl mb-2">🏆 BADGE FREIGESCHALTET!</h2>
                <h3 className="font-heading text-xl mb-4 text-[#FF10F0]">{badge.name}</h3>
                <p className="text-gray-600 mb-4">{badge.description}</p>
                <div className="flex justify-center gap-4 mb-4">
                    <span className="bg-gray-100 px-3 py-1 border-2 border-black text-sm">
                        {getCategoryLabel(badge.category)}
                    </span>
                    <span className={`px-3 py-1 border-2 border-black text-sm font-bold ${
                        badge.rarity === 'legendary' ? 'bg-yellow-400' :
                        badge.rarity === 'very_rare' ? 'bg-[#FF10F0] text-white' :
                        badge.rarity === 'rare' ? 'bg-[#CCFF00]' :
                        'bg-gray-200'
                    }`}>
                        {getRarityStars(badge.rarity)} {getRarityLabel(badge.rarity)}
                    </span>
                </div>
                <p className="text-lg font-bold text-[#CCFF00]">+{badge.points} Punkte</p>
                
                <button
                    onClick={onClose}
                    className="mt-6 px-8 py-3 bg-black text-white font-heading text-lg hover:bg-gray-800 transition-colors"
                >
                    AWESOME! 🎉
                </button>
            </div>
            
            <style jsx>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes bounce-in {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
                .animate-spin-slow { animation: spin-slow 2s ease-in-out; }
            `}</style>
        </div>
    );
}

// ========================================
// BADGE PROGRESS CARD
// ========================================

interface BadgeProgressCardProps {
    badge: Badge;
    progress: { current: number; target: number };
}

export function BadgeProgressCard({ badge, progress }: BadgeProgressCardProps) {
    const percentage = Math.min((progress.current / progress.target) * 100, 100);
    const isComplete = percentage >= 100;
    
    return (
        <div 
            className={`border-4 border-black p-4 ${isComplete ? 'bg-[#CCFF00]/20' : 'bg-white'}`}
            style={{ boxShadow: '4px 4px 0px #000' }}
        >
            <div className="flex items-center gap-3 mb-3">
                <span className={`text-3xl ${isComplete ? '' : 'grayscale'}`}>{badge.icon}</span>
                <div className="flex-1">
                    <h4 className="font-heading text-lg">{badge.name}</h4>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                </div>
            </div>
            
            <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                    <span>Fortschritt</span>
                    <span className="font-bold">{progress.current}/{progress.target}</span>
                </div>
                <div className="h-3 bg-gray-200 border-2 border-black">
                    <div 
                        className={`h-full transition-all duration-500 ${isComplete ? 'bg-[#CCFF00]' : 'bg-[#FF10F0]'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">{getRarityStars(badge.rarity)} {getRarityLabel(badge.rarity)}</span>
                <span className="font-bold">🏆 {badge.points} Punkte</span>
            </div>
        </div>
    );
}

// ========================================
// FULL BADGE PAGE COMPONENT
// ========================================

interface BadgePageProps {
    allBadges: Badge[];
    userAchievements: UserAchievement[];
    totalPoints: number;
    currentStreak: number;
}

export function BadgePage({ allBadges, userAchievements, totalPoints, currentStreak }: BadgePageProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showLocked, setShowLocked] = useState(true);
    
    const unlockedIds = userAchievements
        .filter(a => a.progress.current >= a.progress.target)
        .map(a => a.badgeId);
    
    const filteredBadges = allBadges.filter(b => {
        if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
        if (!showLocked && !unlockedIds.includes(b.id)) return false;
        if (b.hidden && !unlockedIds.includes(b.id)) return false;
        return true;
    });
    
    const categories = [
        { id: 'all', label: 'Alle', icon: '🌟' },
        { id: 'artist', label: 'Künstler', icon: '🎨' },
        { id: 'buyer', label: 'Käufer', icon: '🛍️' },
        { id: 'community', label: 'Community', icon: '👥' },
        { id: 'special', label: 'Spezial', icon: '✨' },
        { id: 'easter_egg', label: 'Easter Eggs', icon: '🕹️' },
    ];
    
    return (
        <div className="space-y-6">
            {/* Stats Header */}
            <div 
                className="bg-gradient-to-r from-[#CCFF00]/20 to-[#FF10F0]/20 border-4 border-black p-6"
                style={{ boxShadow: '4px 4px 0px #000' }}
            >
                <h2 className="font-heading text-2xl mb-4">🏆 DEINE ACHIEVEMENTS</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-3xl font-heading">{unlockedIds.length}</div>
                        <div className="text-sm text-gray-600">Badges</div>
                    </div>
                    <div>
                        <div className="text-3xl font-heading text-[#CCFF00]">{totalPoints}</div>
                        <div className="text-sm text-gray-600">Punkte</div>
                    </div>
                    <div>
                        <div className="text-3xl font-heading text-[#FF10F0]">🔥 {currentStreak}</div>
                        <div className="text-sm text-gray-600">Tage Streak</div>
                    </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Gesamtfortschritt</span>
                        <span>{unlockedIds.length}/{allBadges.filter(b => !b.hidden).length}</span>
                    </div>
                    <div className="h-4 bg-white border-2 border-black">
                        <div 
                            className="h-full bg-gradient-to-r from-[#CCFF00] to-[#FF10F0]"
                            style={{ width: `${(unlockedIds.length / allBadges.filter(b => !b.hidden).length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 font-heading border-2 border-black transition-all ${
                            selectedCategory === cat.id 
                                ? 'bg-black text-white' 
                                : 'bg-white hover:bg-gray-100'
                        }`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
                
                <label className="flex items-center gap-2 ml-auto px-4 py-2 border-2 border-black cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showLocked}
                        onChange={(e) => setShowLocked(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm">Gesperrte zeigen</span>
                </label>
            </div>
            
            {/* Badge Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {filteredBadges.map(badge => {
                    const achievement = userAchievements.find(a => a.badgeId === badge.id);
                    const unlocked = achievement ? achievement.progress.current >= achievement.progress.target : false;
                    
                    return (
                        <BadgeItem
                            key={badge.id}
                            badge={badge}
                            unlocked={unlocked}
                            progress={achievement?.progress}
                            size="md"
                        />
                    );
                })}
            </div>
        </div>
    );
}






