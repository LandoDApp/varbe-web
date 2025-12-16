"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { createBlogPost, getAllCategories } from "@/lib/blog";
import { BlogCategory, BlogLanguage } from "@/types";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useTranslations } from 'next-intl';

export default function NewBlogPostPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const t = useTranslations('blogCreate');
    
    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState<BlogCategory>("tutorial");
    const [language, setLanguage] = useState<BlogLanguage>("de");
    const [tags, setTags] = useState("");
    const [coverImage, setCoverImage] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState("");

    const categories = getAllCategories();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const fileRef = ref(storage, `blog/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setCoverImage(url);
        } catch (error) {
            console.error("Error uploading image:", error);
            setError(t('errorUploadingImage'));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (publish: boolean) => {
        if (!user) return;
        
        // Validation
        if (!title.trim()) {
            setError(t('errorTitle'));
            return;
        }
        if (!excerpt.trim()) {
            setError(t('errorExcerpt'));
            return;
        }
        if (!content.trim()) {
            setError(t('errorContent'));
            return;
        }

        setSaving(true);
        setError("");

        try {
            const postId = await createBlogPost(user.uid, {
                title: title.trim(),
                excerpt: excerpt.trim(),
                content: content.trim(),
                category,
                language,
                coverImage: coverImage || undefined,
                tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                status: publish ? 'published' : 'draft'
            });

            router.push('/artist/blog');
        } catch (error) {
            console.error("Error saving post:", error);
            setError(t('errorSaving'));
        } finally {
            setSaving(false);
        }
    };

    // Auth check
    if (!user) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl font-heading mb-4">{t('notLoggedIn')}</h1>
                        <Link href="/auth/login">
                            <Button variant="accent">{t('login')}</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const isVerifiedArtist = profile?.verificationStatus === 'verified';
    if (!isVerifiedArtist) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl font-heading mb-4">🔒 {t('onlyVerifiedArtists')}</h1>
                        <Link href="/artist/verify">
                            <Button variant="accent">{t('verifyNow')}</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <Link href="/artist/blog" className="text-gray-600 hover:text-black mb-2 inline-block font-heading">
                                ← {t('backToOverview')}
                            </Link>
                            <h1 className="text-4xl md:text-5xl font-heading uppercase">{t('title')}</h1>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="secondary" 
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-sm"
                            >
                                {showPreview ? `✏️ ${t('editor')}` : `👁️ ${t('preview')}`}
                            </Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border-4 border-red-500 p-4 mb-6 text-red-700 font-heading">
                        ❌ {error}
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {showPreview ? (
                            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h1 className="text-4xl font-heading uppercase mb-4">{title || "Titel..."}</h1>
                                <p className="text-gray-600 mb-6 italic">{excerpt || "Kurzbeschreibung..."}</p>
                                {coverImage && (
                                    <img src={coverImage} alt="" className="w-full h-64 object-cover border-4 border-black mb-6" />
                                )}
                                <MarkdownRenderer content={content || "*Kein Inhalt...*"} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block font-heading uppercase mb-2">{t('titleLabel')} *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t('titlePlaceholder')}
                                        className="w-full border-4 border-black p-3 font-body text-lg focus:outline-none focus:ring-4 focus:ring-accent/50"
                                    />
                                </div>

                                {/* Excerpt */}
                                <div>
                                    <label className="block font-heading uppercase mb-2">{t('excerptLabel')} *</label>
                                    <textarea
                                        value={excerpt}
                                        onChange={(e) => setExcerpt(e.target.value)}
                                        placeholder={t('excerptPlaceholder')}
                                        maxLength={200}
                                        rows={2}
                                        className="w-full border-4 border-black p-3 font-body focus:outline-none focus:ring-4 focus:ring-accent/50 resize-none"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">{excerpt.length}/200</p>
                                </div>

                                {/* Cover Image */}
                                <div>
                                    <label className="block font-heading uppercase mb-2">{t('coverImage')}</label>
                                    {coverImage ? (
                                        <div className="relative">
                                            <img src={coverImage} alt="" className="w-full h-48 object-cover border-4 border-black" />
                                            <button
                                                onClick={() => setCoverImage("")}
                                                className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full font-bold"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="block border-4 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-accent transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            {uploading ? (
                                                <span className="text-gray-500">{t('uploading')}</span>
                                            ) : (
                                                <>
                                                    <span className="text-4xl block mb-2">📷</span>
                                                    <span className="text-gray-500">{t('clickToUpload')}</span>
                                                </>
                                            )}
                                        </label>
                                    )}
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block font-heading uppercase mb-2">{t('content')} *</label>
                                    <div className="bg-gray-100 border-2 border-gray-300 p-2 mb-2 text-sm font-mono">
                                        <span className="mr-4">**{t('bold')}**</span>
                                        <span className="mr-4">*{t('italic')}*</span>
                                        <span className="mr-4"># {t('heading')}</span>
                                        <span className="mr-4">## {t('subHeading')}</span>
                                        <span className="mr-4">- {t('list')}</span>
                                    </div>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={t('contentPlaceholder')}
                                        rows={20}
                                        className="w-full border-4 border-black p-3 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-accent/50 resize-y"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Language */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <label className="block font-heading uppercase mb-2">{t('language')}</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLanguage('de')}
                                    className={`flex-1 py-3 border-4 border-black font-heading text-sm transition-all ${
                                        language === 'de' 
                                            ? 'bg-accent' 
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                >
                                    🇩🇪 DEUTSCH
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-3 border-4 border-black font-heading text-sm transition-all ${
                                        language === 'en' 
                                            ? 'bg-accent' 
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                >
                                    🇬🇧 ENGLISH
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <label className="block font-heading uppercase mb-2">{t('category')}</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as BlogCategory)}
                                className="w-full border-4 border-black p-3 font-body focus:outline-none focus:ring-4 focus:ring-accent/50"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <label className="block font-heading uppercase mb-2">{t('tags')}</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder={t('tagsPlaceholder')}
                                className="w-full border-4 border-black p-3 font-body text-sm focus:outline-none focus:ring-4 focus:ring-accent/50"
                            />
                        </div>

                        {/* Actions */}
                        <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                            <Button
                                variant="primary"
                                className="w-full text-lg py-3"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                            >
                                {saving ? '...' : `🚀 ${t('publish')}`}
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                {saving ? '...' : `💾 ${t('saveDraft')}`}
                            </Button>
                        </div>

                        {/* Help */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-heading uppercase mb-2">💡 {t('tips')}</h3>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li>• {t('tip1')}</li>
                                <li>• {t('tip2')}</li>
                                <li>• {t('tip3')}</li>
                                <li>• {t('tip4')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

