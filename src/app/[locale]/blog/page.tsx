"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from "react";
import { getPublishedBlogPosts, getCategoryDisplayName, getAllCategories } from "@/lib/blog";
import { BlogPost, BlogCategory, BlogLanguage } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function BlogPage() {
    const t = useTranslations('blog');
    const locale = useLocale();
    const { profile } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');
    const [selectedLanguage, setSelectedLanguage] = useState<BlogLanguage | 'all'>('all');

    const categories = getAllCategories();
    const isVerifiedArtist = profile?.verificationStatus === 'verified';

    useEffect(() => {
        loadPosts();
    }, [selectedCategory, selectedLanguage]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const { posts } = await getPublishedBlogPosts({
                category: selectedCategory === 'all' ? undefined : selectedCategory,
                language: selectedLanguage === 'all' ? undefined : selectedLanguage,
                limitCount: 50
            });
            setPosts(posts);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12">
                    <h1 className="text-5xl md:text-6xl font-heading uppercase mb-4">
                        VARBE BLOG
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tipps, Tutorials und Insights aus der Kunst-Community
                    </p>
                    
                    {/* Artist CTA */}
                    {isVerifiedArtist && (
                        <div className="mt-6">
                            <Link href="/artist/blog/new">
                                <Button variant="accent" className="text-lg px-6 py-3">
                                    ✏️ EIGENEN BEITRAG SCHREIBEN
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Filters Section */}
                <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
                    {/* Language Filter */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <button
                            onClick={() => setSelectedLanguage('all')}
                            className={`px-4 py-2 border-4 border-black font-heading text-sm transition-all ${
                                selectedLanguage === 'all' 
                                    ? 'bg-black text-white' 
                                    : 'bg-white text-black hover:bg-gray-100'
                            }`}
                        >
                            🌍 ALLE SPRACHEN
                        </button>
                        <button
                            onClick={() => setSelectedLanguage('de')}
                            className={`px-4 py-2 border-4 border-black font-heading text-sm transition-all ${
                                selectedLanguage === 'de' 
                                    ? 'bg-black text-white' 
                                    : 'bg-white text-black hover:bg-gray-100'
                            }`}
                        >
                            🇩🇪 DEUTSCH
                        </button>
                        <button
                            onClick={() => setSelectedLanguage('en')}
                            className={`px-4 py-2 border-4 border-black font-heading text-sm transition-all ${
                                selectedLanguage === 'en' 
                                    ? 'bg-black text-white' 
                                    : 'bg-white text-black hover:bg-gray-100'
                            }`}
                        >
                            🇬🇧 ENGLISH
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                            variant={selectedCategory === 'all' ? 'accent' : 'secondary'}
                            onClick={() => setSelectedCategory('all')}
                            className="text-sm"
                        >
                            ALLE KATEGORIEN
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.value}
                                variant={selectedCategory === cat.value ? 'accent' : 'secondary'}
                                onClick={() => setSelectedCategory(cat.value)}
                                className="text-sm"
                            >
                                {cat.label.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Blog Posts Grid */}
                {loading ? (
                    <div className="text-center py-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                        <div className="animate-spin text-4xl mb-4">🎨</div>
                        <p className="font-body">Lade Beiträge...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-2xl font-heading mb-4">NOCH KEINE BEITRÄGE</h2>
                        <p className="text-gray-600 mb-6">
                            {selectedCategory !== 'all' 
                                ? 'In dieser Kategorie gibt es noch keine Beiträge.' 
                                : 'Hier werden bald spannende Blog-Beiträge erscheinen!'
                            }
                        </p>
                        {isVerifiedArtist && (
                            <Link href="/artist/blog/new">
                                <Button variant="accent">ERSTEN BEITRAG SCHREIBEN</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`}>
                                <article className="card-comic bg-white border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer h-full flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {post.coverImage ? (
                                        <div className="aspect-video border-b-4 border-black overflow-hidden">
                                            <img 
                                                src={post.coverImage} 
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-accent border-b-4 border-black flex items-center justify-center">
                                            <span className="text-4xl">📝</span>
                                        </div>
                                    )}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            <span className="inline-block bg-accent px-3 py-1 border-2 border-black text-sm font-heading">
                                                {getCategoryDisplayName(post.category)}
                                            </span>
                                            <span className="inline-block bg-gray-100 px-2 py-1 border-2 border-black text-xs font-heading">
                                                {post.language === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-heading mb-3 line-clamp-2 uppercase">{post.title}</h2>
                                        <p className="font-body text-gray-600 mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
                                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t-2 border-dashed border-gray-300">
                                            <span>
                                                {post.publishedAt 
                                                    ? new Date(post.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
                                                    : new Date(post.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
                                                }
                                            </span>
                                            <span>{post.readTimeMinutes} Min Lesezeit</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Newsletter CTA */}
                <section className="bg-black text-white p-8 border-4 border-accent text-center">
                    <h2 className="text-3xl font-heading mb-4 uppercase">BLEIB INFORMIERT</h2>
                    <p className="mb-6 text-gray-300">
                        Erhalte neue Blog-Beiträge und Updates direkt in dein Postfach.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="deine@email.com"
                            className="flex-1 px-4 py-3 border-2 border-white bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                        />
                        <Button variant="accent" type="submit" className="px-6">
                            ABONNIEREN
                        </Button>
                    </form>
                </section>
            </main>

            <Footer />
        </div>
    );
}
