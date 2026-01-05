"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { getBoard, updateBoard, deleteBoard, removePostFromBoard, setBoardCover } from "@/lib/boards";
import { getPost } from "@/lib/feed";
import { getUserProfile } from "@/lib/db";
import { Board, FeedPost, UserProfile } from "@/types";
import { Link, useRouter } from "@/i18n/routing";

export default function BoardDetailPage() {
    const params = useParams();
    const boardId = params.boardId as string;
    const router = useRouter();
    const { user } = useAuth();
    
    const [board, setBoard] = useState<Board | null>(null);
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [owner, setOwner] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isOwner = user?.uid === board?.userId;

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const boardData = await getBoard(boardId);
                if (!boardData) {
                    setLoading(false);
                    return;
                }
                
                setBoard(boardData);
                setEditTitle(boardData.title);
                setEditDescription(boardData.description || '');
                
                // Fetch owner profile
                const ownerProfile = await getUserProfile(boardData.userId);
                setOwner(ownerProfile);
                
                // Fetch all posts in board
                const postPromises = boardData.postIds.map(id => getPost(id));
                const fetchedPosts = await Promise.all(postPromises);
                setPosts(fetchedPosts.filter((p): p is FeedPost => p !== null));
                
            } catch (error) {
                console.error("Error fetching board:", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (boardId) fetchBoard();
    }, [boardId]);

    const handleSaveEdit = async () => {
        if (!board) return;
        
        setSaving(true);
        try {
            await updateBoard(boardId, {
                title: editTitle,
                description: editDescription,
            });
            setBoard({ ...board, title: editTitle, description: editDescription });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating board:", error);
            alert("Fehler beim Speichern");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBoard = async () => {
        if (!confirm("Board wirklich löschen? Dies kann nicht rückgängig gemacht werden.")) return;
        
        setDeleting(true);
        try {
            await deleteBoard(boardId);
            router.push("/profile");
        } catch (error) {
            console.error("Error deleting board:", error);
            alert("Fehler beim Löschen");
            setDeleting(false);
        }
    };

    const handleRemovePost = async (postId: string) => {
        if (!board) return;
        
        try {
            await removePostFromBoard(boardId, postId);
            setPosts(posts.filter(p => p.id !== postId));
            setBoard({ ...board, postIds: board.postIds.filter(id => id !== postId) });
        } catch (error) {
            console.error("Error removing post:", error);
        }
    };

    const handleSetCover = async (imageUrl: string) => {
        if (!board) return;
        
        try {
            await setBoardCover(boardId, imageUrl);
            setBoard({ ...board, coverImageUrl: imageUrl });
        } catch (error) {
            console.error("Error setting cover:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">Lade Board...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="bg-white border-4 border-black p-8 text-center shadow-comic">
                        <span className="text-6xl">📌</span>
                        <h1 className="text-4xl font-heading mt-4 mb-2">Board nicht gefunden</h1>
                        <p className="text-gray-600">Dieses Board existiert nicht oder ist privat.</p>
                        <Link href="/feed">
                            <Button variant="accent" className="mt-6">Zum Feed →</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Board Header */}
                <div className="bg-white border-4 border-black shadow-comic mb-8">
                    {/* Cover Image */}
                    <div 
                        className="h-48 md:h-64 bg-gradient-to-br from-gray-200 to-gray-300 relative"
                        style={{
                            backgroundImage: board.coverImageUrl ? `url(${board.coverImageUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {!board.coverImageUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-8xl opacity-30">📌</span>
                            </div>
                        )}
                        
                        {/* Back Button */}
                        <Link href={`/profile/${board.userId}`} className="absolute top-4 left-4">
                            <button className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 text-sm font-heading backdrop-blur-sm border-2 border-white/20">
                                ← Zurück
                            </button>
                        </Link>
                        
                        {/* Private Badge */}
                        {board.isPrivate && (
                            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 text-sm font-heading backdrop-blur-sm">
                                🔒 Privat
                            </div>
                        )}
                    </div>
                    
                    {/* Board Info */}
                    <div className="p-6">
                        {isEditing ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-3xl font-heading p-2 border-2 border-black"
                                    placeholder="Board-Name"
                                />
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full p-2 border-2 border-black"
                                    placeholder="Beschreibung (optional)"
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleSaveEdit} variant="accent" disabled={saving}>
                                        {saving ? '⏳' : '✓'} Speichern
                                    </Button>
                                    <Button onClick={() => setIsEditing(false)} variant="secondary">
                                        ✕ Abbrechen
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-heading">{board.title}</h1>
                                        {board.description && (
                                            <p className="text-gray-600 mt-2">{board.description}</p>
                                        )}
                                    </div>
                                    
                                    {isOwner && (
                                        <div className="flex gap-2">
                                            <Button onClick={() => setIsEditing(true)} variant="secondary" className="text-sm">
                                                ✏️ Bearbeiten
                                            </Button>
                                            <Button 
                                                onClick={handleDeleteBoard} 
                                                variant="secondary" 
                                                className="text-sm text-red-600 hover:bg-red-50"
                                                disabled={deleting}
                                            >
                                                {deleting ? '⏳' : '🗑️'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Owner Info */}
                                {owner && (
                                    <Link href={`/profile/${board.userId}`} className="inline-flex items-center gap-2 mt-4 hover:opacity-80">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                                            {owner.profilePictureUrl ? (
                                                <img src={owner.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="flex items-center justify-center h-full text-xs">🎨</span>
                                            )}
                                        </div>
                                        <span className="font-bold">{owner.displayName}</span>
                                    </Link>
                                )}
                                
                                <p className="text-sm text-gray-500 mt-2">
                                    {posts.length} {posts.length === 1 ? 'Pin' : 'Pins'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Posts Grid */}
                {posts.length === 0 ? (
                    <div className="bg-white border-4 border-black p-12 text-center shadow-comic">
                        <span className="text-6xl">📌</span>
                        <h2 className="text-2xl font-heading mt-4">Dieses Board ist leer</h2>
                        <p className="text-gray-600 mt-2">
                            {isOwner 
                                ? "Speichere Posts aus dem Feed um dieses Board zu füllen." 
                                : "Hier wurden noch keine Posts gespeichert."}
                        </p>
                        {isOwner && (
                            <Link href="/feed">
                                <Button variant="accent" className="mt-4">Zum Feed →</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {posts.map((post) => (
                            <div key={post.id} className="relative group">
                                <Link 
                                    href={`/feed?post=${post.id}`}
                                    className="block aspect-square border-2 border-black overflow-hidden bg-gray-100"
                                >
                                    {post.images && post.images[0] ? (
                                        <img 
                                            src={post.images[0]} 
                                            alt="" 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-800 to-gray-900">
                                            <p className="text-white text-sm text-center line-clamp-4">{post.text}</p>
                                        </div>
                                    )}
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="flex gap-3 text-white text-sm font-bold">
                                            <span>❤️ {post.likesCount}</span>
                                            <span>💬 {post.commentsCount}</span>
                                        </div>
                                    </div>
                                </Link>
                                
                                {/* Owner Actions */}
                                {isOwner && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        {post.images && post.images[0] && board.coverImageUrl !== post.images[0] && (
                                            <button
                                                onClick={() => handleSetCover(post.images![0])}
                                                className="bg-white/90 hover:bg-white px-2 py-1 text-xs border border-black"
                                                title="Als Cover setzen"
                                            >
                                                🖼️
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemovePost(post.id)}
                                            className="bg-white/90 hover:bg-red-100 px-2 py-1 text-xs border border-black text-red-600"
                                            title="Entfernen"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
}






