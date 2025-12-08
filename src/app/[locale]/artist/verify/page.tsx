"use client";

import { Button } from "@/components/ui/Button";
import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { ArtistProfile } from "@/types";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useTranslations } from 'next-intl';
import { compressImage, validateImage, formatFileSize, COMPRESSION_PRESETS, CompressionResult } from "@/lib/image-compression";

export default function VerifyArtistPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const t = useTranslations('artist.verify');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        artistName: "",
        artStyle: "",
        bio: "",
        // Provenance / Herkunftsprotokoll
        education: "",
        exhibitions: "",
        // Social Media
        instagram: "",
        behance: "",
        website: "",
    });
    const [images, setImages] = useState<File[]>([]);
    const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
    const [compressing, setCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
    
    // Process images for KI-free verification
    const [processImages, setProcessImages] = useState<File[]>([]);
    const [processCompressionResults, setProcessCompressionResults] = useState<CompressionResult[]>([]);
    const [compressingProcess, setCompressingProcess] = useState(false);
    const [processCompressionProgress, setProcessCompressionProgress] = useState({ current: 0, total: 0 });
    
    // Artist signature
    const [signature, setSignature] = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

    if (!user) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="text-center py-20">
                        <p className="font-heading text-2xl">{t('pleaseLogin')}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (profile?.verificationStatus === 'pending') {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-halftone p-4">
                    <div className="card-comic max-w-md text-center">
                        <h2 className="text-3xl font-heading mb-4">{t('pending')}</h2>
                        <p className="font-body">{t('pendingMessage')}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const files = Array.from(e.target.files).slice(0, 5); // Max 5 portfolio images
        
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
        setImages([]);
        setCompressionResults([]);
        
        try {
            const results: CompressionResult[] = [];
            const compressedFiles: File[] = [];
            
            for (let i = 0; i < files.length; i++) {
                setCompressionProgress({ current: i + 1, total: files.length });
                
                const result = await compressImage(files[i], COMPRESSION_PRESETS.artwork);
                results.push(result);
                compressedFiles.push(result.file);
            }
            
            setImages(compressedFiles);
            setCompressionResults(results);
            
        } catch (error: any) {
            console.error("Fehler bei Bildkomprimierung:", error);
            alert(`Fehler bei der Bildkomprimierung: ${error.message}`);
        } finally {
            setCompressing(false);
        }
    }, []);
    
    // Handler for process images (KI-free verification)
    const handleProcessImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const files = Array.from(e.target.files).slice(0, 5);
        
        for (const file of files) {
            const validation = validateImage(file);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
        }
        
        setCompressingProcess(true);
        setProcessCompressionProgress({ current: 0, total: files.length });
        setProcessImages([]);
        setProcessCompressionResults([]);
        
        try {
            const results: CompressionResult[] = [];
            const compressedFiles: File[] = [];
            
            for (let i = 0; i < files.length; i++) {
                setProcessCompressionProgress({ current: i + 1, total: files.length });
                const result = await compressImage(files[i], COMPRESSION_PRESETS.process);
                results.push(result);
                compressedFiles.push(result.file);
            }
            
            setProcessImages(compressedFiles);
            setProcessCompressionResults(results);
        } catch (error: any) {
            console.error("Fehler:", error);
            alert(`Fehler: ${error.message}`);
        } finally {
            setCompressingProcess(false);
        }
    }, []);
    
    // Handler for signature
    const handleSignatureChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const validation = validateImage(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }
        
        try {
            const result = await compressImage(file, COMPRESSION_PRESETS.signature);
            setSignature(result.file);
            setSignaturePreview(URL.createObjectURL(result.file));
        } catch (error: any) {
            console.error("Fehler:", error);
            alert(`Fehler: ${error.message}`);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload Portfolio Images
            const imageUrls = await Promise.all(
                images.map(async (file) => {
                    const storageRef = ref(storage, `verification/${user.uid}/portfolio_${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );
            
            // 2. Upload Process Images (for KI-free verification)
            let processImageUrls: string[] = [];
            if (processImages.length > 0) {
                processImageUrls = await Promise.all(
                    processImages.map(async (file) => {
                        const storageRef = ref(storage, `verification/${user.uid}/process_${Date.now()}_${file.name}`);
                        await uploadBytes(storageRef, file);
                        return getDownloadURL(storageRef);
                    })
                );
            }
            
            // 3. Upload Signature
            let signatureUrl: string | undefined;
            if (signature) {
                const storageRef = ref(storage, `verification/${user.uid}/signature_${Date.now()}.png`);
                await uploadBytes(storageRef, signature);
                signatureUrl = await getDownloadURL(storageRef);
            }

            // 4. Save Artist Profile with all data (filter out undefined values for Firestore)
            const artistData: Record<string, any> = {
                uid: user.uid,
                artistName: formData.artistName,
                artStyle: formData.artStyle,
                bio: formData.bio,
                portfolioImages: imageUrls,
                verificationSubmittedAt: Date.now(),
                verificationMethod: 'admin', // Will be updated if community voting is added
            };
            
            // Only add optional fields if they have values
            if (processImageUrls.length > 0) {
                artistData.verificationProcessImages = processImageUrls;
            }
            if (signatureUrl) {
                artistData.signatureImage = signatureUrl;
            }
            if (formData.education && formData.education.trim()) {
                artistData.education = formData.education.trim();
            }
            if (formData.exhibitions && formData.exhibitions.trim()) {
                const exhibitionsList = formData.exhibitions.split(',').map(e => e.trim()).filter(e => e);
                if (exhibitionsList.length > 0) {
                    artistData.exhibitions = exhibitionsList;
                }
            }
            
            // Build socialMedia object only with actual values
            const socialMedia: Record<string, string> = {};
            if (formData.instagram && formData.instagram.trim()) {
                socialMedia.instagram = formData.instagram.trim();
            }
            if (formData.behance && formData.behance.trim()) {
                socialMedia.behance = formData.behance.trim();
            }
            if (formData.website && formData.website.trim()) {
                socialMedia.website = formData.website.trim();
            }
            // Only add socialMedia if it has at least one entry
            if (Object.keys(socialMedia).length > 0) {
                artistData.socialMedia = socialMedia;
            }

            // 5. Update User Document
            await updateDoc(doc(db, "users", user.uid), {
                verificationStatus: 'pending',
                artistProfile: artistData,
            });

            router.push("/");
        } catch (error) {
            console.error("Error submitting verification:", error);
            alert(t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="min-h-screen bg-halftone bg-[length:20px_20px] p-8">
                <div className="max-w-2xl mx-auto card-comic bg-white">
                    <h1 className="text-4xl font-heading mb-8 text-center">{t('title')}</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-heading">{t('step1')}</h3>
                            <div>
                                <label className="block font-bold mb-2">{t('artistName')}</label>
                                <input
                                    className="input-comic"
                                    value={formData.artistName}
                                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-bold mb-2">{t('artStyle')}</label>
                                <select
                                    className="input-comic"
                                    value={formData.artStyle}
                                    onChange={(e) => setFormData({ ...formData, artStyle: e.target.value })}
                                    required
                                >
                                    <option value="">{t('selectStyle')}</option>
                                    <option value="painting">{t('styles.painting')}</option>
                                    <option value="digital">{t('styles.digital')}</option>
                                    <option value="sculpture">{t('styles.sculpture')}</option>
                                    <option value="mixed">{t('styles.mixed')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold mb-2">{t('bio')}</label>
                                <textarea
                                    className="input-comic h-32"
                                    maxLength={500}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500</p>
                            </div>
                        </div>

                        {/* Step 2: Portfolio */}
                        <div className="space-y-4 border-t-4 border-black pt-6">
                            <h3 className="text-2xl font-heading">{t('step2')}</h3>
                            <p className="text-sm text-gray-600">{t('portfolioHint')}</p>
                            
                            {/* Compression Info */}
                            <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded">
                                <p className="text-sm font-bold text-blue-800">📸 Bildkomprimierung aktiv</p>
                                <p className="text-xs text-blue-700">
                                    Bilder werden automatisch auf max. Full HD (1920×1080) skaliert und komprimiert.
                                </p>
                            </div>
                            
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="input-comic"
                                disabled={compressing}
                                required={images.length === 0}
                            />
                            
                            {/* Compression Progress */}
                            {compressing && (
                                <div className="p-4 bg-yellow-50 border-4 border-yellow-400">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                                        <span className="font-bold">
                                            Komprimiere Bild {compressionProgress.current} von {compressionProgress.total}...
                                        </span>
                                    </div>
                                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-accent h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Image Previews with Compression Info */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-5 gap-2 mt-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="aspect-square border-4 border-black overflow-hidden">
                                                <img
                                                    src={URL.createObjectURL(img)}
                                                    alt={`Portfolio ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {compressionResults[idx] && (
                                                <div className="absolute -bottom-1 -right-1 bg-accent text-black text-xs font-bold px-1 py-0.5 border-2 border-black">
                                                    -{compressionResults[idx].compressionRatio}%
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Compression Summary */}
                            {compressionResults.length > 0 && (
                                <div className="p-3 bg-green-50 border-2 border-green-400 rounded">
                                    <p className="text-sm font-bold text-green-800">✅ {compressionResults.length} Bilder komprimiert</p>
                                    <p className="text-xs text-green-700">
                                        {formatFileSize(compressionResults.reduce((sum, r) => sum + r.originalSize, 0))} → {formatFileSize(compressionResults.reduce((sum, r) => sum + r.compressedSize, 0))}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Step 3: KI-Free Verification (Process Images) */}
                        <div className="space-y-4 border-t-4 border-black pt-6 bg-gradient-to-r from-lime-50 to-white p-6 -mx-6 px-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-heading">🎨 KI-Freie Verifizierung</h3>
                                <span className="bg-accent text-black text-xs font-bold px-2 py-1 border-2 border-black">
                                    OPTIONAL
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Zeige uns deinen kreativen Prozess! Upload Fotos von Skizzen, Zwischenschritten oder 
                                Werkstatt-Fotos. Dies hilft uns zu verifizieren, dass deine Kunst 100% menschengemacht ist.
                            </p>
                            
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleProcessImagesChange}
                                className="input-comic"
                                disabled={compressingProcess}
                            />
                            
                            {/* Process Compression Progress */}
                            {compressingProcess && (
                                <div className="p-3 bg-yellow-50 border-2 border-yellow-400">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                        <span className="text-sm font-bold">
                                            Komprimiere {processCompressionProgress.current}/{processCompressionProgress.total}...
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Process Images Preview */}
                            {processImages.length > 0 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {processImages.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="aspect-square border-2 border-black overflow-hidden">
                                                <img
                                                    src={URL.createObjectURL(img)}
                                                    alt={`Prozess ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {processCompressionResults[idx] && (
                                                <div className="absolute -bottom-1 -right-1 bg-lime-400 text-black text-xs font-bold px-1 border border-black">
                                                    -{processCompressionResults[idx].compressionRatio}%
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Signature Upload */}
                            <div className="mt-4">
                                <label className="block font-bold mb-2">✍️ Künstler-Signatur (optional)</label>
                                <p className="text-xs text-gray-600 mb-2">
                                    Lade deine Unterschrift hoch - sie wird auf Zertifikaten deiner Werke angezeigt
                                </p>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleSignatureChange}
                                    className="input-comic"
                                />
                                {signaturePreview && (
                                    <div className="mt-2 p-3 bg-white border-2 border-black inline-block">
                                        <img src={signaturePreview} alt="Signatur" className="max-h-16" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Step 4: Provenance / Herkunftsprotokoll */}
                        <div className="space-y-4 border-t-4 border-black pt-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-heading">📜 Herkunftsprotokoll</h3>
                                <span className="text-xs text-gray-500">(optional)</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Erzähle uns mehr über deinen künstlerischen Hintergrund
                            </p>
                            
                            <div>
                                <label className="block font-bold mb-2">Ausbildung</label>
                                <input
                                    type="text"
                                    className="input-comic"
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    placeholder="z.B. Hochschule für Künste Bremen, Autodidakt, etc."
                                />
                            </div>
                            
                            <div>
                                <label className="block font-bold mb-2">Ausstellungen</label>
                                <input
                                    type="text"
                                    className="input-comic"
                                    value={formData.exhibitions}
                                    onChange={(e) => setFormData({ ...formData, exhibitions: e.target.value })}
                                    placeholder="Komma-getrennte Liste: Galerie XY 2023, Kunstverein ABC 2022"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-bold mb-2">Instagram</label>
                                    <input
                                        type="text"
                                        className="input-comic"
                                        value={formData.instagram}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="@deinname"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-2">Behance</label>
                                    <input
                                        type="text"
                                        className="input-comic"
                                        value={formData.behance}
                                        onChange={(e) => setFormData({ ...formData, behance: e.target.value })}
                                        placeholder="URL"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-2">Website</label>
                                    <input
                                        type="url"
                                        className="input-comic"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Submit Info */}
                        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded">
                            <h4 className="font-bold text-blue-800 mb-2">📋 Was passiert nach dem Einreichen?</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>1. Unser Team prüft deine Unterlagen (1-3 Werktage)</li>
                                <li>2. Bei erfolgreicher Verifizierung: ✅ Verifizierter Künstler Badge</li>
                                <li>3. Mit Prozess-Fotos: 🎨 100% KI-frei Badge möglich</li>
                                <li>4. Du kannst sofort Kunstwerke listen (nach Freigabe sichtbar)</li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full text-xl mt-8" variant="accent" disabled={loading || compressing || compressingProcess || images.length === 0}>
                            {loading ? t('submitting') : compressing || compressingProcess ? 'Bilder werden komprimiert...' : t('submit')}
                        </Button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}





