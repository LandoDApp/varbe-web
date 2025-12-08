"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./Button";

interface CoverImagePositionerProps {
    imageUrl: string;
    onSave: (position: { x: number; y: number }) => void;
    onCancel: () => void;
    initialPosition?: { x: number; y: number };
    accentColor?: string;
}

export function CoverImagePositioner({ 
    imageUrl, 
    onSave, 
    onCancel, 
    initialPosition = { x: 50, y: 50 },
    accentColor = '#CCFF00'
}: CoverImagePositionerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    
    // Position in percentage (0-100)
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    
    // Load image and get dimensions
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
            setImageLoaded(true);
        };
        img.src = imageUrl;
    }, [imageUrl]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    }, []);
    
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Calculate movement as percentage of container size
        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
        
        setPosition(prev => ({
            x: Math.max(0, Math.min(100, prev.x - deltaX)),
            y: Math.max(0, Math.min(100, prev.y - deltaY))
        }));
        
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, dragStart]);
    
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    // Touch support
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX, y: touch.clientY });
    }, []);
    
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        
        const touch = e.touches[0];
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100;
        
        setPosition(prev => ({
            x: Math.max(0, Math.min(100, prev.x - deltaX)),
            y: Math.max(0, Math.min(100, prev.y - deltaY))
        }));
        
        setDragStart({ x: touch.clientX, y: touch.clientY });
    }, [isDragging, dragStart]);
    
    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    // Quick position buttons
    const setQuickPosition = (pos: string) => {
        switch (pos) {
            case 'top':
                setPosition({ x: 50, y: 0 });
                break;
            case 'center':
                setPosition({ x: 50, y: 50 });
                break;
            case 'bottom':
                setPosition({ x: 50, y: 100 });
                break;
            case 'left':
                setPosition({ x: 0, y: 50 });
                break;
            case 'right':
                setPosition({ x: 100, y: 50 });
                break;
        }
    };
    
    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-black text-white p-4 flex items-center justify-between">
                    <h2 className="font-heading text-xl">📷 COVER-BILD POSITIONIEREN</h2>
                    <button onClick={onCancel} className="text-2xl hover:text-gray-300">×</button>
                </div>
                
                {/* Instructions */}
                <div className="p-4 bg-yellow-50 border-b-2 border-black text-sm">
                    <p className="font-bold">💡 Ziehe das Bild um die Position anzupassen</p>
                    <p className="text-gray-600">Das Bild wird als Banner auf deinem Profil angezeigt</p>
                </div>
                
                {/* Preview Container */}
                <div className="p-4">
                    {/* Aspect ratio container (simulating banner) */}
                    <div 
                        ref={containerRef}
                        className={`relative w-full aspect-[3/1] bg-gray-200 border-4 border-black overflow-hidden ${
                            isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {imageLoaded ? (
                            <img
                                ref={imageRef}
                                src={imageUrl}
                                alt="Cover preview"
                                className="absolute w-full h-full object-cover select-none pointer-events-none"
                                style={{
                                    objectPosition: `${position.x}% ${position.y}%`
                                }}
                                draggable={false}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        )}
                        
                        {/* Drag indicator */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`bg-black/50 text-white px-4 py-2 rounded-full transition-opacity ${
                                isDragging ? 'opacity-100' : 'opacity-0'
                            }`}>
                                ↕️ Ziehen zum Verschieben
                            </div>
                        </div>
                        
                        {/* Grid overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                            <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/30" />
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                            <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/30" />
                        </div>
                    </div>
                    
                    {/* Position indicator */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Position: {Math.round(position.x)}% horizontal, {Math.round(position.y)}% vertikal
                        </div>
                        
                        {/* Quick position buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setQuickPosition('top')}
                                className={`px-3 py-1 border-2 border-black text-sm font-bold hover:bg-gray-100 ${
                                    position.y === 0 ? 'bg-gray-200' : 'bg-white'
                                }`}
                            >
                                ⬆️ Oben
                            </button>
                            <button
                                onClick={() => setQuickPosition('center')}
                                className={`px-3 py-1 border-2 border-black text-sm font-bold hover:bg-gray-100 ${
                                    position.x === 50 && position.y === 50 ? 'bg-gray-200' : 'bg-white'
                                }`}
                            >
                                ⏺️ Mitte
                            </button>
                            <button
                                onClick={() => setQuickPosition('bottom')}
                                className={`px-3 py-1 border-2 border-black text-sm font-bold hover:bg-gray-100 ${
                                    position.y === 100 ? 'bg-gray-200' : 'bg-white'
                                }`}
                            >
                                ⬇️ Unten
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Preview of how it will look */}
                <div className="p-4 bg-gray-50 border-t-2 border-black">
                    <p className="text-sm font-bold mb-2">So wird es auf deinem Profil aussehen:</p>
                    <div className="border-2 border-black overflow-hidden">
                        {/* Cover Image */}
                        <div className="relative h-28 bg-gray-200 overflow-hidden">
                            <img
                                src={imageUrl}
                                alt="Mini preview"
                                className="absolute w-full h-full object-cover"
                                style={{
                                    objectPosition: `${position.x}% ${position.y}%`
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        {/* Profile Header Bar - wie im echten Profil */}
                        <div className="bg-black/70 backdrop-blur-md -mt-2 px-3 py-2 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white/30 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="h-2.5 w-16 bg-white/80 rounded" />
                                <div className="h-2 w-10 bg-white/50 rounded mt-1" />
                            </div>
                            <div className="h-5 w-12 bg-white/20 rounded text-xs" />
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 border-t-2 border-black flex gap-4 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => onSave(position)}
                        style={{ backgroundColor: accentColor, color: '#000' }}
                    >
                        ✓ Position speichern
                    </Button>
                </div>
            </div>
        </div>
    );
}

