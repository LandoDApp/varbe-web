"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, use } from "react";
import { useTranslations } from 'next-intl';
import { getBlogPostBySlug, incrementBlogPostViews, getCategoryDisplayName } from "@/lib/blog";
import { BlogPost, UserProfile } from "@/types";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [author, setAuthor] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        loadPost();
    }, [resolvedParams.slug]);

    const loadPost = async () => {
        try {
            const blogPost = await getBlogPostBySlug(resolvedParams.slug);
            
            if (!blogPost) {
                setNotFound(true);
                return;
            }
            
            setPost(blogPost);
            
            // Increment view count
            incrementBlogPostViews(blogPost.id).catch(console.error);
            
            // Load author profile
            try {
                const authorDoc = await getDoc(doc(db, "users", blogPost.authorId));
                if (authorDoc.exists()) {
                    setAuthor(authorDoc.data() as UserProfile);
                }
            } catch (error) {
                console.error("Error loading author:", error);
            }
        } catch (error) {
            console.error("Error loading post:", error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <div className="animate-spin text-4xl mb-4">🎨</div>
                        <p className="font-body">Lade Beitrag...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (notFound || !post) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl font-heading mb-4">BEITRAG NICHT GEFUNDEN</h1>
                        <p className="text-gray-600 mb-8">
                            Der gesuchte Blog-Beitrag existiert nicht oder wurde entfernt.
                        </p>
                        <Link href="/blog">
                            <Button variant="accent">ZURÜCK ZUM BLOG</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const publishedDate = post.publishedAt 
        ? new Date(post.publishedAt).toLocaleDateString('de-DE', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        })
        : new Date(post.createdAt).toLocaleDateString('de-DE', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

    return (
        <div className="min-h-screen">
            <Navbar />
            
            <main className="container mx-auto px-4 py-8">
                {/* Back Link */}
                <Link href="/blog" className="inline-block mb-6 text-gray-600 hover:text-black font-heading">
                    ← Zurück zum Blog
                </Link>

                {/* Article Header */}
                <article className="max-w-4xl mx-auto bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 lg:p-12">
                    {/* Category Badge */}
                    <div className="mb-4">
                        <span className="inline-block bg-accent px-4 py-2 border-2 border-black font-heading text-sm uppercase">
                            {getCategoryDisplayName(post.category)}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading uppercase mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8 pb-6 border-b-4 border-black">
                        {/* Author */}
                                        {author && (
                                            <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2 hover:text-black">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                                                    {author.profilePictureUrl ? (
                                                        <img src={author.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-lg">🎨</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-heading flex items-center gap-1">
                                                        {author.displayName}
                                                        {author.verificationStatus === 'verified' && (
                                                            <span className="text-accent">✓</span>
                                                        )}
                                                    </span>
                                                    {author.username && (
                                                        <span className="text-sm text-gray-500">@{author.username}</span>
                                                    )}
                                                </div>
                                            </Link>
                                        )}
                        <span>•</span>
                        <span>{publishedDate}</span>
                        <span>•</span>
                        <span>{post.readTimeMinutes} Min Lesezeit</span>
                        {post.views !== undefined && post.views > 0 && (
                            <>
                                <span>•</span>
                                <span>{post.views} Views</span>
                            </>
                        )}
                    </div>

                    {/* Cover Image */}
                    {post.coverImage && (
                        <div className="mb-8">
                            <img 
                                src={post.coverImage} 
                                alt={post.title}
                                className="w-full h-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            />
                        </div>
                    )}

                    {/* Excerpt */}
                    <p className="text-xl text-gray-700 italic mb-8 pb-6 border-b-2 border-dashed border-gray-300">
                        {post.excerpt}
                    </p>

                    {/* Content */}
                    <div className="mb-12">
                        <MarkdownRenderer content={post.content} />
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t-4 border-black">
                            <span className="font-heading text-sm uppercase mr-2">TAGS:</span>
                            {post.tags.map((tag) => (
                                <span 
                                    key={tag}
                                    className="px-3 py-1 bg-gray-100 border-2 border-black text-sm font-heading uppercase"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Author Box */}
                    {author && (
                        <div className="bg-gray-50 border-4 border-black p-6 mb-8">
                            <div className="flex items-start gap-4">
                                <Link href={`/profile/${post.authorId}`}>
                                    <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-black overflow-hidden flex-shrink-0">
                                        {author.profilePictureUrl ? (
                                            <img src={author.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="flex items-center justify-center h-full text-2xl">🎨</span>
                                        )}
                                    </div>
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/profile/${post.authorId}`}>
                                        <h3 className="font-heading text-xl uppercase flex items-center gap-2">
                                            {author.displayName}
                                            {author.verificationStatus === 'verified' && (
                                                <span className="text-accent">✓</span>
                                            )}
                                        </h3>
                                        {author.username && (
                                            <p className="text-gray-500 text-sm">@{author.username}</p>
                                        )}
                                    </Link>
                                    {author.bio && (
                                        <p className="text-gray-600 mt-2 line-clamp-2">{author.bio}</p>
                                    )}
                                    <Link href={`/profile/${post.authorId}`}>
                                        <Button variant="secondary" className="mt-3 text-sm">
                                            PROFIL ANSEHEN →
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Share & CTA */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center py-6 border-t-4 border-black">
                        <div className="flex items-center gap-3">
                            <span className="font-heading text-sm">TEILEN:</span>
                            <a 
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-accent transition-colors"
                            >
                                🐦
                            </a>
                            <a 
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-accent transition-colors"
                            >
                                📘
                            </a>
                            <button 
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: post.title,
                                            url: window.location.href
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link kopiert!');
                                    }
                                }}
                                className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-accent transition-colors"
                            >
                                🔗
                            </button>
                        </div>
                        <Link href="/blog">
                            <Button variant="accent">
                                MEHR BEITRÄGE LESEN →
                            </Button>
                        </Link>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
