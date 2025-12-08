"use client";

import { useState, useEffect } from "react";
import { Button } from "./Button";
import { ProfileCustomization, ProfileBackground, ProfileBlock, ProfileBlockType } from "@/types";
import { compressImage } from "@/lib/image-compression";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// ========================================
// DEFAULT PROFILE CUSTOMIZATION
// ========================================

export const DEFAULT_PROFILE_CUSTOMIZATION: ProfileCustomization = {
    background: {
        type: 'color',
        color: '#ffffff',
    },
    primaryColor: '#CCFF00',
    textColor: '#000000',
    linkColor: '#FF10F0',
    layout: 'classic',
    showCoverImage: false,
    blocks: [
        { id: 'bio', type: 'bio', order: 0, visible: true },
        { id: 'badges', type: 'badges', order: 1, visible: true },
        { id: 'stats', type: 'stats', order: 2, visible: true },
        { id: 'gallery', type: 'gallery', order: 3, visible: true },
        { id: 'links', type: 'links', order: 4, visible: true },
    ],
    showcasedBadges: [],
    badgeDisplayStyle: 'row',
    theme: 'default',
};

// ========================================
// PRESET THEMES
// ========================================

export const PROFILE_THEMES = {
    default: {
        name: 'Standard',
        preview: '⬜',
        customization: {
            background: { type: 'color' as const, color: '#ffffff' },
            primaryColor: '#CCFF00',
            textColor: '#000000',
            linkColor: '#FF10F0',
        }
    },
    dark: {
        name: 'Dunkel',
        preview: '⬛',
        customization: {
            background: { type: 'color' as const, color: '#1a1a1a' },
            primaryColor: '#CCFF00',
            textColor: '#ffffff',
            linkColor: '#FF10F0',
        }
    },
    neon: {
        name: 'Neon',
        preview: '🟢',
        customization: {
            background: { 
                type: 'gradient' as const, 
                gradient: { colors: ['#000000', '#1a0a20'], direction: 'to-br' as const }
            },
            primaryColor: '#CCFF00',
            textColor: '#ffffff',
            linkColor: '#FF10F0',
        }
    },
    minimal: {
        name: 'Minimal',
        preview: '⚪',
        customization: {
            background: { type: 'color' as const, color: '#f5f5f5' },
            primaryColor: '#000000',
            textColor: '#333333',
            linkColor: '#666666',
        }
    },
    retro: {
        name: 'Retro',
        preview: '🟨',
        customization: {
            background: { 
                type: 'pattern' as const, 
                pattern: 'dots' as const,
                color: '#FFF8E1'
            },
            primaryColor: '#FF6B35',
            textColor: '#2D3436',
            linkColor: '#0984E3',
        }
    },
    pastel: {
        name: 'Pastell',
        preview: '🩷',
        customization: {
            background: { 
                type: 'gradient' as const, 
                gradient: { colors: ['#FFE5EC', '#E0F4FF'], direction: 'to-br' as const }
            },
            primaryColor: '#FF85A1',
            textColor: '#5C5470',
            linkColor: '#7868E6',
        }
    },
};

// ========================================
// BACKGROUND PATTERNS
// ========================================

const PATTERNS = {
    dots: 'radial-gradient(circle, #00000010 1px, transparent 1px)',
    grid: 'linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)',
    stripes: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #00000010 10px, #00000010 20px)',
    zigzag: 'linear-gradient(135deg, #00000010 25%, transparent 25%) -10px 0, linear-gradient(225deg, #00000010 25%, transparent 25%) -10px 0',
    comic: 'radial-gradient(#00000020 2px, transparent 2px), radial-gradient(#00000020 2px, transparent 2px)',
};

// ========================================
// PROFILE EDITOR COMPONENT
// ========================================

interface ProfileEditorProps {
    customization: ProfileCustomization;
    onChange: (customization: ProfileCustomization) => void;
    onSave: () => void;
    saving?: boolean;
    userId?: string; // Needed for uploading images to storage
}

export function ProfileEditor({ customization, onChange, onSave, saving, userId }: ProfileEditorProps) {
    const [activeTab, setActiveTab] = useState<'theme' | 'background' | 'colors' | 'blocks' | 'badges'>('theme');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
    const updateBackground = (updates: Partial<ProfileBackground>) => {
        onChange({
            ...customization,
            background: { ...customization.background, ...updates }
        });
    };
    
    // Upload background image to Firebase Storage
    const handleBackgroundImageUpload = async (file: File) => {
        if (!userId) {
            setUploadError("Du musst angemeldet sein um Bilder hochzuladen");
            return;
        }
        
        setUploadError(null);
        setUploading(true);
        
        try {
            // Compress the image first
            const compressionResult = await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.85,
            });
            
            // Upload to Firebase Storage (use compressionResult.file, not the whole object!)
            const storageRef = ref(storage, `profile-backgrounds/${userId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, compressionResult.file);
            const downloadURL = await getDownloadURL(storageRef);
            
            console.log("✅ Background image uploaded:", downloadURL);
            
            // Update with permanent URL
            updateBackground({ imageUrl: downloadURL });
            
        } catch (error: any) {
            console.error("Error uploading background image:", error);
            setUploadError(`Upload fehlgeschlagen: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };
    
    const updateBlock = (blockId: string, updates: Partial<ProfileBlock>) => {
        onChange({
            ...customization,
            blocks: customization.blocks.map(b => 
                b.id === blockId ? { ...b, ...updates } : b
            )
        });
    };
    
    const toggleBlockVisibility = (blockId: string) => {
        onChange({
            ...customization,
            blocks: customization.blocks.map(b =>
                b.id === blockId ? { ...b, visible: !b.visible } : b
            )
        });
    };
    
    const moveBlock = (blockId: string, direction: 'up' | 'down') => {
        const blocks = [...customization.blocks];
        const index = blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= blocks.length) return;
        
        [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
        blocks.forEach((b, i) => b.order = i);
        
        onChange({ ...customization, blocks });
    };
    
    const applyTheme = (themeId: keyof typeof PROFILE_THEMES) => {
        const theme = PROFILE_THEMES[themeId];
        onChange({
            ...customization,
            ...theme.customization,
            theme: themeId,
        });
    };
    
    const tabs = [
        { id: 'theme', label: '🎨 Themes', icon: '🎨' },
        { id: 'background', label: '🖼️ Hintergrund', icon: '🖼️' },
        { id: 'colors', label: '🎨 Farben', icon: '🌈' },
        { id: 'blocks', label: '📦 Blöcke', icon: '📦' },
        { id: 'badges', label: '🏆 Badges', icon: '🏆' },
    ];
    
    return (
        <div className="border-4 border-black bg-white" style={{ boxShadow: '4px 4px 0px #000' }}>
            {/* Tab Navigation */}
            <div className="flex border-b-4 border-black overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-max px-4 py-3 font-heading text-sm transition-colors ${
                            activeTab === tab.id 
                                ? 'bg-[#CCFF00] border-r-4 border-black' 
                                : 'bg-white hover:bg-gray-100 border-r-2 border-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <div className="p-4">
                {/* Theme Tab */}
                {activeTab === 'theme' && (
                    <div className="space-y-4">
                        <h3 className="font-heading text-lg">Wähle ein Theme</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(PROFILE_THEMES).map(([id, theme]) => (
                                <button
                                    key={id}
                                    onClick={() => applyTheme(id as keyof typeof PROFILE_THEMES)}
                                    className={`p-4 border-4 transition-all ${
                                        customization.theme === id 
                                            ? 'border-[#CCFF00] bg-[#CCFF00]/10' 
                                            : 'border-black hover:border-gray-400'
                                    }`}
                                    style={{ boxShadow: '2px 2px 0px #000' }}
                                >
                                    <div className="text-4xl mb-2">{theme.preview}</div>
                                    <div className="font-heading">{theme.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Background Tab */}
                {activeTab === 'background' && (
                    <div className="space-y-4">
                        <h3 className="font-heading text-lg">Hintergrund-Typ</h3>
                        <div className="flex gap-2 flex-wrap">
                            {['color', 'gradient', 'pattern', 'image'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateBackground({ type: type as any })}
                                    className={`px-4 py-2 border-2 border-black font-heading ${
                                        customization.background.type === type 
                                            ? 'bg-black text-white' 
                                            : 'bg-white'
                                    }`}
                                >
                                    {type === 'color' && '🎨 Farbe'}
                                    {type === 'gradient' && '🌈 Gradient'}
                                    {type === 'pattern' && '📐 Muster'}
                                    {type === 'image' && '🖼️ Bild'}
                                </button>
                            ))}
                        </div>
                        
                        {/* Color Picker */}
                        {customization.background.type === 'color' && (
                            <div>
                                <label className="block text-sm font-bold mb-2">Hintergrundfarbe</label>
                                <input
                                    type="color"
                                    value={customization.background.color || '#ffffff'}
                                    onChange={(e) => updateBackground({ color: e.target.value })}
                                    className="w-full h-12 border-2 border-black cursor-pointer"
                                />
                            </div>
                        )}
                        
                        {/* Gradient Picker */}
                        {customization.background.type === 'gradient' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Farbe 1</label>
                                        <input
                                            type="color"
                                            value={customization.background.gradient?.colors[0] || '#CCFF00'}
                                            onChange={(e) => updateBackground({ 
                                                gradient: { 
                                                    colors: [e.target.value, customization.background.gradient?.colors[1] || '#FF10F0'],
                                                    direction: customization.background.gradient?.direction || 'to-br'
                                                }
                                            })}
                                            className="w-full h-10 border-2 border-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Farbe 2</label>
                                        <input
                                            type="color"
                                            value={customization.background.gradient?.colors[1] || '#FF10F0'}
                                            onChange={(e) => updateBackground({ 
                                                gradient: { 
                                                    colors: [customization.background.gradient?.colors[0] || '#CCFF00', e.target.value],
                                                    direction: customization.background.gradient?.direction || 'to-br'
                                                }
                                            })}
                                            className="w-full h-10 border-2 border-black"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Richtung</label>
                                    <select
                                        value={customization.background.gradient?.direction || 'to-br'}
                                        onChange={(e) => updateBackground({
                                            gradient: {
                                                colors: customization.background.gradient?.colors || ['#CCFF00', '#FF10F0'],
                                                direction: e.target.value as any
                                            }
                                        })}
                                        className="w-full p-2 border-2 border-black"
                                    >
                                        <option value="to-right">→ Nach rechts</option>
                                        <option value="to-left">← Nach links</option>
                                        <option value="to-bottom">↓ Nach unten</option>
                                        <option value="to-top">↑ Nach oben</option>
                                        <option value="to-br">↘ Diagonal</option>
                                        <option value="to-bl">↙ Diagonal (anders)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        
                        {/* Pattern Picker */}
                        {customization.background.type === 'pattern' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-bold mb-2">Muster wählen</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.entries(PATTERNS).map(([patternId, patternCss]) => (
                                        <button
                                            key={patternId}
                                            onClick={() => updateBackground({ pattern: patternId as any })}
                                            className={`h-16 border-2 ${
                                                customization.background.pattern === patternId 
                                                    ? 'border-[#CCFF00]' 
                                                    : 'border-black'
                                            }`}
                                            style={{ 
                                                backgroundImage: patternCss,
                                                backgroundSize: patternId === 'comic' ? '20px 20px' : '20px 20px',
                                                backgroundColor: '#f5f5f5'
                                            }}
                                        />
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Hintergrundfarbe</label>
                                    <input
                                        type="color"
                                        value={customization.background.color || '#f5f5f5'}
                                        onChange={(e) => updateBackground({ color: e.target.value })}
                                        className="w-full h-10 border-2 border-black"
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Image Upload */}
                        {customization.background.type === 'image' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-bold mb-2">Hintergrundbild</label>
                                
                                {/* Current Image Preview */}
                                {customization.background.imageUrl && (
                                    <div className="relative">
                                        <div 
                                            className="w-full h-40 border-2 border-black overflow-hidden"
                                            style={{
                                                backgroundImage: `url(${customization.background.imageUrl})`,
                                                backgroundSize: customization.background.imageSize || 'cover',
                                                backgroundPosition: customization.background.imagePosition || 'center',
                                                backgroundRepeat: 'no-repeat',
                                            }}
                                        />
                                        <button
                                            onClick={() => updateBackground({ imageUrl: undefined })}
                                            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm border-2 border-black"
                                        >
                                            ✕ Entfernen
                                        </button>
                                    </div>
                                )}
                                
                                {/* Upload Input */}
                                <div className="border-2 border-dashed border-gray-400 p-4 text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading}
                                        id="bg-image-upload"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                await handleBackgroundImageUpload(file);
                                            }
                                        }}
                                    />
                                    <label 
                                        htmlFor="bg-image-upload"
                                        className={`cursor-pointer block ${uploading ? 'opacity-50' : ''}`}
                                    >
                                        {uploading ? (
                                            <div className="flex items-center justify-center gap-2 text-gray-600">
                                                <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                                                Bild wird hochgeladen...
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-3xl">📷</span>
                                                <p className="mt-2 text-sm text-gray-600">
                                                    Klicke hier oder ziehe ein Bild hinein
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Empfohlen: 1920x1080 oder größer
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                                
                                {/* Upload Error */}
                                {uploadError && (
                                    <div className="text-red-600 text-sm bg-red-100 p-2 border border-red-300">
                                        ❌ {uploadError}
                                    </div>
                                )}
                                
                                {/* Image Position Controls */}
                                {customization.background.imageUrl && (
                                    <div className="space-y-3 pt-3 border-t-2 border-gray-200">
                                        <h4 className="font-bold text-sm">Bildposition anpassen</h4>
                                        
                                        {/* Position Selector */}
                                        <div>
                                            <label className="block text-sm mb-2">Position</label>
                                            <div className="grid grid-cols-3 gap-1 w-32">
                                                {['top left', 'top center', 'top right',
                                                  'center left', 'center', 'center right',
                                                  'bottom left', 'bottom center', 'bottom right'].map((pos) => (
                                                    <button
                                                        key={pos}
                                                        onClick={() => updateBackground({ imagePosition: pos })}
                                                        className={`w-10 h-10 border-2 transition-all ${
                                                            (customization.background.imagePosition || 'center') === pos
                                                                ? 'bg-accent border-black'
                                                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                        title={pos}
                                                    >
                                                        <div className="w-2 h-2 bg-black rounded-full mx-auto" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Size Selector */}
                                        <div>
                                            <label className="block text-sm mb-2">Größe</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {[
                                                    { value: 'cover', label: 'Ausfüllen' },
                                                    { value: 'contain', label: 'Einpassen' },
                                                    { value: '100% auto', label: 'Breite 100%' },
                                                    { value: 'auto 100%', label: 'Höhe 100%' },
                                                ].map((size) => (
                                                    <button
                                                        key={size.value}
                                                        onClick={() => updateBackground({ imageSize: size.value })}
                                                        className={`px-3 py-1 text-sm border-2 transition-all ${
                                                            (customization.background.imageSize || 'cover') === size.value
                                                                ? 'bg-accent border-black'
                                                                : 'bg-white border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {size.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1">Deckkraft</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={customization.background.opacity || 100}
                                            onChange={(e) => updateBackground({ opacity: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Blur</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            value={customization.background.blur || 0}
                                            onChange={(e) => updateBackground({ blur: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Colors Tab */}
                {activeTab === 'colors' && (
                    <div className="space-y-4">
                        <h3 className="font-heading text-lg">Farben anpassen</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Akzentfarbe</label>
                                <input
                                    type="color"
                                    value={customization.primaryColor}
                                    onChange={(e) => onChange({ ...customization, primaryColor: e.target.value })}
                                    className="w-full h-12 border-2 border-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Textfarbe</label>
                                <input
                                    type="color"
                                    value={customization.textColor}
                                    onChange={(e) => onChange({ ...customization, textColor: e.target.value })}
                                    className="w-full h-12 border-2 border-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Linkfarbe</label>
                                <input
                                    type="color"
                                    value={customization.linkColor}
                                    onChange={(e) => onChange({ ...customization, linkColor: e.target.value })}
                                    className="w-full h-12 border-2 border-black"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2">Schriftart</label>
                            <select
                                value={customization.fontFamily || 'default'}
                                onChange={(e) => onChange({ ...customization, fontFamily: e.target.value as any })}
                                className="w-full p-3 border-2 border-black font-heading"
                            >
                                <option value="default">Standard (Comic)</option>
                                <option value="serif">Serif (Elegant)</option>
                                <option value="mono">Mono (Tech)</option>
                                <option value="display">Display (Bold)</option>
                            </select>
                        </div>
                    </div>
                )}
                
                {/* Blocks Tab */}
                {activeTab === 'blocks' && (
                    <div className="space-y-4">
                        <h3 className="font-heading text-lg">Profil-Blöcke</h3>
                        <p className="text-sm text-gray-600">
                            Aktiviere/deaktiviere Blöcke und ordne sie per Drag & Drop an.
                        </p>
                        
                        <div className="space-y-2">
                            {customization.blocks.sort((a, b) => a.order - b.order).map((block, index) => (
                                <div 
                                    key={block.id}
                                    className={`flex items-center gap-3 p-3 border-2 ${
                                        block.visible ? 'border-black bg-white' : 'border-gray-300 bg-gray-100'
                                    }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveBlock(block.id, 'up')}
                                            disabled={index === 0}
                                            className="text-xs disabled:opacity-30"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => moveBlock(block.id, 'down')}
                                            disabled={index === customization.blocks.length - 1}
                                            className="text-xs disabled:opacity-30"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                    
                                    <span className="text-xl">
                                        {block.type === 'bio' && '📝'}
                                        {block.type === 'links' && '🔗'}
                                        {block.type === 'gallery' && '🖼️'}
                                        {block.type === 'badges' && '🏆'}
                                        {block.type === 'stats' && '📊'}
                                        {block.type === 'quote' && '💬'}
                                        {block.type === 'spotify' && '🎵'}
                                    </span>
                                    
                                    <div className="flex-1">
                                        <div className="font-bold">
                                            {block.type === 'bio' && 'Bio'}
                                            {block.type === 'links' && 'Social Links'}
                                            {block.type === 'gallery' && 'Galerie'}
                                            {block.type === 'badges' && 'Badges'}
                                            {block.type === 'stats' && 'Statistiken'}
                                            {block.type === 'quote' && 'Zitat'}
                                            {block.type === 'spotify' && 'Spotify'}
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => toggleBlockVisibility(block.id)}
                                        className={`px-3 py-1 border-2 border-black text-sm ${
                                            block.visible ? 'bg-[#CCFF00]' : 'bg-gray-200'
                                        }`}
                                    >
                                        {block.visible ? '👁️ Sichtbar' : '🚫 Versteckt'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Badges Tab */}
                {activeTab === 'badges' && (
                    <div className="space-y-4">
                        <h3 className="font-heading text-lg">Badge-Anzeige</h3>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2">Anzeige-Stil</label>
                            <div className="flex gap-2">
                                {['row', 'grid', 'hidden'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => onChange({ ...customization, badgeDisplayStyle: style as any })}
                                        className={`px-4 py-2 border-2 border-black ${
                                            customization.badgeDisplayStyle === style 
                                                ? 'bg-black text-white' 
                                                : 'bg-white'
                                        }`}
                                    >
                                        {style === 'row' && '➡️ Reihe'}
                                        {style === 'grid' && '📦 Grid'}
                                        {style === 'hidden' && '🚫 Versteckt'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2">
                                Ausgewählte Badges (max. 5)
                            </label>
                            <p className="text-sm text-gray-600 mb-2">
                                Diese Badges werden prominent auf deinem Profil angezeigt.
                            </p>
                            {/* Badge selection would go here - needs achievement data */}
                            <div className="p-4 border-2 border-dashed border-gray-300 text-center text-gray-500">
                                Badge-Auswahl wird nach dem Speichern verfügbar
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Save Button */}
            <div className="p-4 border-t-4 border-black">
                <Button
                    onClick={onSave}
                    variant="accent"
                    className="w-full"
                    disabled={saving}
                >
                    {saving ? '⏳ Speichere...' : '💾 Änderungen speichern'}
                </Button>
            </div>
        </div>
    );
}

// ========================================
// PROFILE PREVIEW COMPONENT
// ========================================

interface ProfilePreviewProps {
    customization: ProfileCustomization;
    displayName: string;
    bio?: string;
    profilePictureUrl?: string;
}

export function ProfilePreview({ customization, displayName, bio, profilePictureUrl }: ProfilePreviewProps) {
    const getBackgroundStyle = () => {
        const bg = customization.background;
        
        switch (bg.type) {
            case 'color':
                return { backgroundColor: bg.color };
            case 'gradient':
                const direction = {
                    'to-right': '90deg',
                    'to-left': '270deg',
                    'to-bottom': '180deg',
                    'to-top': '0deg',
                    'to-br': '135deg',
                    'to-bl': '225deg',
                }[bg.gradient?.direction || 'to-br'];
                return {
                    background: `linear-gradient(${direction}, ${bg.gradient?.colors[0]}, ${bg.gradient?.colors[1]})`
                };
            case 'pattern':
                return {
                    backgroundColor: bg.color || '#f5f5f5',
                    backgroundImage: PATTERNS[bg.pattern || 'dots'],
                    backgroundSize: '20px 20px',
                };
            case 'image':
                return {
                    backgroundImage: `url(${bg.imageUrl})`,
                    backgroundSize: bg.imageSize || 'cover',
                    backgroundPosition: bg.imagePosition || 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
                    opacity: bg.opacity ? bg.opacity / 100 : 1,
                };
            default:
                return { backgroundColor: '#ffffff' };
        }
    };
    
    return (
        <div 
            className="border-4 border-black overflow-hidden"
            style={{ boxShadow: '4px 4px 0px #000' }}
        >
            {/* Background / Banner */}
            <div className="relative h-40" style={getBackgroundStyle()}>
                {customization.background.type === 'image' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                )}
            </div>
            
            {/* Profile Header Bar - halbtransparent */}
            <div className="bg-black/70 backdrop-blur-md -mt-2 px-4 py-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div 
                        className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden bg-gray-800 flex-shrink-0"
                    >
                        {profilePictureUrl ? (
                            <img src={profilePictureUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-700">
                                🎨
                            </div>
                        )}
                    </div>
                    
                    {/* Name & Info */}
                    <div className="flex-1 min-w-0 text-white">
                        <h2 className="font-heading text-lg truncate">{displayName}</h2>
                        {bio && (
                            <p className="text-gray-300 text-xs truncate">{bio}</p>
                        )}
                    </div>
                    
                    {/* Sample Badges */}
                    {customization.badgeDisplayStyle !== 'hidden' && (
                        <div className="hidden sm:flex gap-1 flex-shrink-0">
                            {['🎨', '💎', '🔥'].map((icon, i) => (
                                <div 
                                    key={i}
                                    className="w-7 h-7 border border-white/30 flex items-center justify-center text-sm"
                                    style={{ 
                                        backgroundColor: customization.primaryColor + '50',
                                    }}
                                >
                                    {icon}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content Area */}
            <div className="p-4" style={{ backgroundColor: customization.background.color || '#f5f5f5' }}>
                {/* Sample Link */}
                <div className="text-center">
                    <a href="#" style={{ color: customization.linkColor }} className="underline text-sm">
                        → Alle Kunstwerke ansehen
                    </a>
                </div>
            </div>
        </div>
    );
}



