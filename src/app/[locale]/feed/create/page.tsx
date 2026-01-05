"use client";

import { useState, useCallback, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter, Link } from "@/i18n/routing";
import { uploadFeedImage, createPostDirect } from "@/lib/feed";
import { getAllListings, getUserListings } from "@/lib/listings";
import { Artwork, FeedPostType } from "@/types";
import { compressImage, validateImage, COMPRESSION_PRESETS, CompressionResult, formatFileSize } from "@/lib/image-compression";
import { useTranslations } from 'next-intl';

const POST_TYPE_KEYS: { value: FeedPostType; icon: string; labelKey: string; descKey: string }[] = [
    { value: 'artwork', icon: '🖼️', labelKey: 'artwork', descKey: 'artworkDesc' },
    { value: 'process', icon: '🎬', labelKey: 'process', descKey: 'processDesc' },
    { value: 'sketch', icon: '✏️', labelKey: 'sketch', descKey: 'sketchDesc' },
    { value: 'thought', icon: '💭', labelKey: 'thought', descKey: 'thoughtDesc' },
    { value: 'update', icon: '📢', labelKey: 'update', descKey: 'updateDesc' },
    { value: 'announcement', icon: '📣', labelKey: 'announcement', descKey: 'announcementDesc' },
];

export default function CreatePostPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('feedCreate');
    
    const [loading, setLoading] = useState(false);
    const [postType, setPostType] = useState<FeedPostType>('update');
    const [text, setText] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
    const [compressing, setCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [linkedListingId, setLinkedListingId] = useState<string | null>(null);
    const [userListings, setUserListings] = useState<Artwork[]>([]);
    const [showListingPicker, setShowListingPicker] = useState(false);
    
    // Check auth
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, authLoading, router]);
    
    // Fetch user's listings for linking
    useEffect(() => {
        const fetchListings = async () => {
            if (user) {
                try {
                    const listings = await getUserListings(user.uid);
                    // Filter for available listings only
                    setUserListings(listings.filter(l => 
                        l.adminApprovalStatus === 'approved' && 
                        l.status !== 'sold' && 
                        l.status !== 'ended'
                    ));
                } catch (error) {
                    console.error("Error fetching listings:", error);
                }
            }
        };
        fetchListings();
    }, [user]);
    
    // Image handler with compression
    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const files = Array.from(e.target.files).slice(0, 5); // Max 5 images
        
        // Validate all files first
        for (const file of files) {
            const validation = validateImage(file);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
        }
        
        setCompressing(true);
        setCompressionProgress({ current: 0, total: files.length });
        
        try {
            const results: CompressionResult[] = [];
            const compressedFiles: File[] = [];
            
            for (let i = 0; i < files.length; i++) {
                setCompressionProgress({ current: i + 1, total: files.length });
                const result = await compressImage(files[i], COMPRESSION_PRESETS.artwork);
                results.push(result);
                compressedFiles.push(result.file);
            }
            
            setImages(prev => [...prev, ...compressedFiles].slice(0, 5));
            setCompressionResults(prev => [...prev, ...results].slice(0, 5));
            
        } catch (error: any) {
            console.error("Compression error:", error);
            alert(`Fehler: ${error.message}`);
        } finally {
            setCompressing(false);
        }
    }, []);
    
    // Remove image
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setCompressionResults(prev => prev.filter((_, i) => i !== index));
    };
    
    // Add tag
    const addTag = () => {
        const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
        if (tag && !tags.includes(tag) && tags.length < 5) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };
    
    // Remove tag
    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };
    
    // Submit post - two-step process:
    // 1. Server-side moderation (API has access to OpenAI key)
    // 2. Client-side post creation (uses Firebase client SDK)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user || !text.trim()) return;
        
        setLoading(true);
        
        try {
            // Upload images first
            let imageUrls: string[] = [];
            if (images.length > 0) {
                imageUrls = await Promise.all(
                    images.map((file) => uploadFeedImage(file, user.uid))
                );
            }
            
            // Step 1: Server-side moderation check
            // (API has access to OPENAI_API_KEY for content moderation)
            const moderationResponse = await fetch('/api/feed/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artistId: user.uid,
                    text: text.trim(),
                    images: imageUrls,
                }),
            });
            
            const moderationResult = await moderationResponse.json();
            
            if (!moderationResult.success) {
                // Show moderation error to user
                alert(moderationResult.error || 'Dein Beitrag konnte nicht veröffentlicht werden.');
                return;
            }
            
            // Step 2: Create post with moderation data from server
            const createResult = await createPostDirect(
                {
                    artistId: user.uid,
                    type: postType,
                    text: text.trim(),
                    images: imageUrls,
                    linkedListingId: linkedListingId || undefined,
                    tags: tags.length > 0 ? tags : undefined,
                    visibility: 'public',
                },
                {
                    scores: moderationResult.moderationResult?.scores,
                    needsReview: moderationResult.needsReview,
                    status: moderationResult.moderationStatus,
                    reasons: moderationResult.moderationReasons,
                }
            );
            
            if (!createResult.success) {
                alert(createResult.error || 'Fehler beim Erstellen des Beitrags');
                return;
            }
            
            // Show pending review message if applicable
            if (createResult.pendingReview && createResult.pendingReviewMessage) {
                alert(createResult.pendingReviewMessage);
            }
            
            router.push("/feed");
            
        } catch (error: any) {
            console.error("Error creating post:", error);
            alert(`Fehler beim Erstellen: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto"></div>
                </div>
            </div>
        );
    }
    
    // Check if user is verified artist
    if (profile?.verificationStatus !== 'verified') {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8 max-w-xl">
                    <div className="card-comic bg-white p-8 text-center">
                        <span className="text-6xl">🎨</span>
                        <h1 className="text-3xl font-heading mt-4 mb-2">{t('onlyVerifiedArtists')}</h1>
                        <p className="text-gray-600 mb-6">
                            {t('onlyVerifiedArtistsDesc')}
                        </p>
                        <Link href="/artist/verify">
                            <Button variant="accent">{t('verifyNow')}</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    
    const selectedListing = linkedListingId 
        ? userListings.find(l => l.id === linkedListingId) 
        : null;
    
    return (
        <div className="min-h-screen bg-halftone bg-[length:20px_20px]">
            <Navbar />
            
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="card-comic bg-white p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
                        <h1 className="text-3xl font-heading">{t('title')}</h1>
                        <Link href="/feed">
                            <button className="text-2xl hover:scale-110 transition-transform">✕</button>
                        </Link>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Post Type */}
                        <div>
                            <label className="block font-bold mb-3">{t('whatToShare')}</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {POST_TYPE_KEYS.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setPostType(type.value)}
                                        className={`p-3 border-4 border-black text-left transition-all ${
                                            postType === type.value 
                                                ? 'bg-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                                : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-2xl">{type.icon}</span>
                                        <p className="font-bold text-sm mt-1">{t(`postTypes.${type.labelKey}`)}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Text Content */}
                        <div>
                            <label className="block font-bold mb-2">{t('yourPost')} *</label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={t('postPlaceholder')}
                                className="input-comic h-40 resize-none"
                                maxLength={2000}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {text.length}/2000
                            </p>
                        </div>
                        
                        {/* Images */}
                        <div>
                            <label className="block font-bold mb-2">
                                {t('images')}
                            </label>
                            
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="input-comic"
                                disabled={compressing || images.length >= 5}
                            />
                            
                            {/* Compression Progress */}
                            {compressing && (
                                <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-400">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                        <span className="text-sm font-bold">
                                            {t('compressing')} {compressionProgress.current}/{compressionProgress.total}...
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Image Previews */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-5 gap-2 mt-3">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="aspect-square border-2 border-black overflow-hidden">
                                                <img
                                                    src={URL.createObjectURL(img)}
                                                    alt={`Upload ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full font-bold text-sm border-2 border-black"
                                            >
                                                ×
                                            </button>
                                            {compressionResults[idx] && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                                                    -{compressionResults[idx].compressionRatio}%
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Link to Listing */}
                        <div>
                            <label className="block font-bold mb-2">
                                💰 {t('linkArtwork')}
                            </label>
                            <p className="text-sm text-gray-600 mb-3">
                                {t('linkArtworkDesc')}
                            </p>
                            
                            {selectedListing ? (
                                <div className="flex items-center gap-3 p-3 border-4 border-black bg-gray-50">
                                    <img 
                                        src={selectedListing.images[0]} 
                                        alt={selectedListing.title}
                                        className="w-16 h-16 object-cover border-2 border-black"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold">{selectedListing.title}</p>
                                        <p className="text-accent font-heading">€{selectedListing.price}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLinkedListingId(null)}
                                        className="text-red-500 font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowListingPicker(true)}
                                    className="w-full p-4 border-4 border-dashed border-gray-300 text-gray-500 hover:border-black hover:text-black transition-colors"
                                >
                                    + {t('selectArtwork')}
                                </button>
                            )}
                            
                            {/* Listing Picker Modal */}
                            {showListingPicker && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white border-4 border-black max-w-lg w-full max-h-[80vh] overflow-y-auto">
                                        <div className="p-4 border-b-4 border-black flex justify-between items-center sticky top-0 bg-white">
                                            <h3 className="font-heading text-xl">{t('chooseArtwork')}</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowListingPicker(false)}
                                                className="text-2xl"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {userListings.length === 0 ? (
                                                <p className="text-center text-gray-500 py-8">
                                                    {t('noActiveListings')}
                                                </p>
                                            ) : (
                                                userListings.map((listing) => (
                                                    <button
                                                        key={listing.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setLinkedListingId(listing.id);
                                                            setShowListingPicker(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-3 border-2 border-black hover:bg-gray-50 text-left"
                                                    >
                                                        <img 
                                                            src={listing.images[0]} 
                                                            alt={listing.title}
                                                            className="w-16 h-16 object-cover border border-black"
                                                        />
                                                        <div>
                                                            <p className="font-bold">{listing.title}</p>
                                                            <p className="text-accent font-heading">€{listing.price}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Tags */}
                        <div>
                            <label className="block font-bold mb-2">
                                {t('tags')}
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder={t('addTag')}
                                    className="input-comic flex-1"
                                    maxLength={30}
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    disabled={tags.length >= 5}
                                    className="px-4 py-2 bg-black text-white font-bold border-2 border-black disabled:opacity-50"
                                >
                                    +
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 text-sm font-bold border border-blue-300 flex items-center gap-1">
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 text-blue-600 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Submit */}
                        <div className="flex gap-4 pt-4 border-t-4 border-black">
                            <Link href="/feed" className="flex-1">
                                <Button type="button" variant="secondary" className="w-full">
                                    {t('cancel')}
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                variant="accent"
                                disabled={loading || compressing || !text.trim()}
                                className="flex-1 text-xl"
                            >
                                {loading ? t('posting') : `✨ ${t('post')}`}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}




