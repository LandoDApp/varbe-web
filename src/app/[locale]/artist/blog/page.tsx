"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getBlogPostsByAuthor, deleteBlogPost, getCategoryDisplayName } from "@/lib/blog";
import { BlogPost } from "@/types";

export default function ArtistBlogPage() {
    const { user, profile } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadPosts();
        }
    }, [user]);

    const loadPosts = async () => {
        if (!user) return;
        try {
            const userPosts = await getBlogPostsByAuthor(user.uid, true);
            setPosts(userPosts);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Bist du sicher, dass du diesen Beitrag löschen möchtest?")) return;
        
        setDeleting(postId);
        try {
            await deleteBlogPost(postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Fehler beim Löschen des Beitrags");
        } finally {
            setDeleting(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl font-heading mb-4">NICHT ANGEMELDET</h1>
                        <p className="mb-8">Du musst angemeldet sein, um Blog-Beiträge zu verwalten.</p>
                        <Link href="/auth/login">
                            <Button variant="accent">ANMELDEN</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Check if user is verified artist
    const isVerifiedArtist = profile?.verificationStatus === 'verified';

    if (!isVerifiedArtist) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <h1 className="text-4xl font-heading mb-4">🔒 NUR FÜR VERIFIZIERTE KÜNSTLER</h1>
                        <p className="mb-8 text-gray-600">
                            Du musst ein verifizierter Künstler sein, um Blog-Beiträge zu erstellen.
                        </p>
                        <Link href="/artist/verify">
                            <Button variant="accent">JETZT VERIFIZIEREN</Button>
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-heading uppercase">MEINE BLOG-BEITRÄGE</h1>
                            <p className="text-gray-600 mt-2">Teile dein Wissen mit der Community</p>
                        </div>
                        <Link href="/artist/blog/new">
                            <Button variant="accent" className="text-lg px-6 py-3">
                                ✏️ NEUER BEITRAG
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Posts List */}
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
                            Teile dein Wissen und deine Erfahrungen mit der Community!
                        </p>
                        <Link href="/artist/blog/new">
                            <Button variant="accent">ERSTEN BEITRAG ERSTELLEN</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div 
                                key={post.id}
                                className="bg-white border-4 border-black p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 text-xs font-heading uppercase border-2 border-black ${
                                            post.status === 'published' ? 'bg-accent' : 'bg-gray-200'
                                        }`}>
                                            {post.status === 'published' ? '✅ Veröffentlicht' : '📝 Entwurf'}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-heading uppercase border-2 border-black bg-white">
                                            {getCategoryDisplayName(post.category)}
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-heading uppercase mb-1">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span>📅 {new Date(post.createdAt).toLocaleDateString('de-DE')}</span>
                                        <span>⏱️ {post.readTimeMinutes} Min</span>
                                        {post.views !== undefined && <span>👁️ {post.views} Views</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/blog/${post.slug}`}>
                                        <Button variant="secondary" className="text-sm">
                                            👁️ ANSEHEN
                                        </Button>
                                    </Link>
                                    <Link href={`/artist/blog/${post.id}/edit`}>
                                        <Button variant="primary" className="text-sm">
                                            ✏️ BEARBEITEN
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="secondary" 
                                        className="text-sm bg-red-100 border-red-500 text-red-700"
                                        onClick={() => handleDelete(post.id)}
                                        disabled={deleting === post.id}
                                    >
                                        {deleting === post.id ? '...' : '🗑️'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}



