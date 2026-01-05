"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import { getPost, likePost, unlikePost, getLike, addComment, getPostComments } from "@/lib/feed";
import { getUserProfile } from "@/lib/db";
import { FeedPost, FeedComment, UserProfile } from "@/types";
import { useTranslations } from 'next-intl';

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.postId as string;
    const { user, profile } = useAuth();
    const router = useRouter();
    const t = useTranslations('feed');
    
    const [post, setPost] = useState<FeedPost | null>(null);
    const [author, setAuthor] = useState<UserProfile | null>(null);
    const [comments, setComments] = useState<(FeedComment & { author?: UserProfile })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        loadPost();
    }, [postId]);

    useEffect(() => {
        if (user && post) {
            checkIfLiked();
        }
    }, [user, post]);

    const loadPost = async () => {
        try {
            setLoading(true);
            const postData = await getPost(postId);
            
            if (!postData) {
                return;
            }
            
            setPost(postData);
            setLikesCount(postData.likesCount || 0);
            
            // Load author
            const authorData = await getUserProfile(postData.artistId);
            setAuthor(authorData);
            
            // Load comments
            const commentsData = await getPostComments(postId);
            const commentsWithAuthors = await Promise.all(
                commentsData.map(async (comment) => {
                    const commentAuthor = await getUserProfile(comment.userId);
                    return { ...comment, author: commentAuthor || undefined };
                })
            );
            setComments(commentsWithAuthors);
            
        } catch (error) {
            console.error("Error loading post:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkIfLiked = async () => {
        if (!user || !post) return;
        const like = await getLike(post.id, user.uid);
        setIsLiked(!!like);
    };

    const handleLike = async () => {
        if (!user || !post) return;
        
        try {
            if (isLiked) {
                await unlikePost(post.id, user.uid);
                setIsLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            } else {
                await likePost(post.id, user.uid);
                setIsLiked(true);
                setLikesCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;
        
        setSubmittingComment(true);
        try {
            const result = await addComment(postId, user.uid, newComment.trim());
            if (result.success) {
                setNewComment("");
                loadPost(); // Reload to get new comment
            } else {
                alert(result.error || "Fehler beim Kommentieren");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleReport = async () => {
        if (!user || !reportReason.trim()) return;
        
        setReportSubmitting(true);
        try {
            const response = await fetch('/api/reports/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId: user.uid,
                    contentType: 'feed_post',
                    contentId: postId,
                    reason: reportReason,
                }),
            });
            
            if (response.ok) {
                alert("✅ Meldung wurde eingereicht. Danke für deine Hilfe!");
                setShowReportModal(false);
                setReportReason("");
            } else {
                alert("❌ Fehler beim Melden. Bitte versuche es erneut.");
            }
        } catch (error) {
            console.error("Error reporting post:", error);
            alert("❌ Fehler beim Melden.");
        } finally {
            setReportSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-12">
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (!post) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center py-20">
                        <span className="text-6xl mb-4 block">😢</span>
                        <h1 className="text-3xl font-heading mb-4">{t('postDetail.postNotFound')}</h1>
                        <p className="text-gray-600 mb-8">{t('postDetail.postNotFoundDesc')}</p>
                        <Button onClick={() => router.push("/")} variant="primary">
                            {t('postDetail.toHomepage')}
                        </Button>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    // Check if post is pending review and user is not the author
    const isPendingReview = (post as any).moderationStatus === 'pending_review';
    const isOwnPost = user?.uid === post.artistId;

    if (isPendingReview && !isOwnPost && profile?.role !== 'admin') {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center py-20">
                        <span className="text-6xl mb-4 block">🔒</span>
                        <h1 className="text-3xl font-heading mb-4">{t('postDetail.postUnderReview')}</h1>
                        <p className="text-gray-600 mb-8">{t('postDetail.postUnderReviewDesc')}</p>
                        <Button onClick={() => router.back()} variant="primary">
                            {t('postDetail.back')}
                        </Button>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Button */}
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 font-body"
                >
                    ← {t('postDetail.back')}
                </button>

                {/* Pending Review Banner */}
                {isPendingReview && (
                    <div className="bg-orange-100 border-4 border-orange-500 p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⏳</span>
                            <div>
                                <p className="font-heading text-orange-800">{t('postDetail.postUnderReview')}</p>
                                <p className="text-sm text-orange-600">{t('postDetail.postUnderReviewDesc')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Post Card */}
                <article className="border-4 border-black shadow-comic bg-white">
                    {/* Header */}
                    <div className="p-4 border-b-4 border-black flex items-center justify-between">
                        <Link 
                            href={`/profile/${post.artistId}`}
                            className="flex items-center gap-3 hover:opacity-80"
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-black bg-gray-200 overflow-hidden">
                                {author?.profilePictureUrl ? (
                                    <img 
                                        src={author.profilePictureUrl} 
                                        alt={author.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">
                                        {author?.displayName?.[0] || '?'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-heading text-lg">{author?.displayName || t('postDetail.unknown')}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(post.createdAt).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </Link>
                        
                        {/* Report Button */}
                        {user && !isOwnPost && (
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="text-gray-400 hover:text-red-500 p-2 flex items-center gap-1 text-sm"
                                title={t('postDetail.reportPost')}
                            >
                                🚩 <span className="hidden sm:inline">{t('postDetail.report')}</span>
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-lg font-body whitespace-pre-wrap mb-4">{post.text}</p>
                        
                        {/* Images */}
                        {post.images && post.images.length > 0 && (
                            <div className={`grid gap-2 mb-4 ${
                                post.images.length === 1 ? 'grid-cols-1' : 
                                post.images.length === 2 ? 'grid-cols-2' : 
                                'grid-cols-2 md:grid-cols-3'
                            }`}>
                                {post.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className="relative aspect-square overflow-hidden border-2 border-black hover:opacity-90 transition-opacity"
                                    >
                                        <img 
                                            src={img} 
                                            alt={`${t('postDetail.image')} ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag, i) => (
                                    <span 
                                        key={i}
                                        className="bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t-4 border-black flex items-center gap-6">
                        <button
                            onClick={handleLike}
                            disabled={!user}
                            className={`flex items-center gap-2 font-heading ${
                                isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            } disabled:opacity-50`}
                        >
                            <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                            <span>{likesCount}</span>
                        </button>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-xl">💬</span>
                            <span>{comments.length}</span>
                        </div>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="mt-8">
                    <h2 className="text-2xl font-heading mb-4">{t('postDetail.comments')} ({comments.length})</h2>
                    
                    {/* Comment Form */}
                    {user ? (
                        <form onSubmit={handleComment} className="mb-6">
                            <div className="border-4 border-black p-4 bg-gray-50">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t('postDetail.writeComment')}
                                    className="w-full p-3 border-2 border-black font-body resize-none"
                                    rows={3}
                                />
                                <div className="flex justify-end mt-3">
                                    <Button 
                                        type="submit" 
                                        variant="primary"
                                        disabled={!newComment.trim() || submittingComment}
                                    >
                                        {submittingComment ? t('postDetail.sending') : t('postDetail.comment')}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="border-4 border-black p-4 bg-gray-50 text-center mb-6">
                            <p className="text-gray-600 mb-3">{t('postDetail.loginToComment')}</p>
                            <Link href="/auth/login">
                                <Button variant="primary">{t('postDetail.login')}</Button>
                            </Link>
                        </div>
                    )}

                    {/* Comments List */}
                    {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <span className="text-4xl mb-2 block">💬</span>
                            <p>{t('postDetail.noComments')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="border-2 border-black p-4 bg-white">
                                    <div className="flex items-start gap-3">
                                        <Link href={`/profile/${comment.userId}`}>
                                            <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-200 overflow-hidden flex-shrink-0">
                                                {comment.author?.profilePictureUrl ? (
                                                    <img 
                                                        src={comment.author.profilePictureUrl} 
                                                        alt={comment.author.displayName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {comment.author?.displayName?.[0] || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link 
                                                    href={`/profile/${comment.userId}`}
                                                    className="font-heading hover:underline"
                                                >
                                                    {comment.author?.displayName || t('postDetail.unknown')}
                                                </Link>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                                                </span>
                                            </div>
                                            <p className="font-body text-gray-800">{comment.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Image Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white text-3xl hover:opacity-80"
                        onClick={() => setSelectedImage(null)}
                    >
                        ✕
                    </button>
                    <img 
                        src={selectedImage} 
                        alt={t('postDetail.fullscreen')}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-comic">
                        <h3 className="text-2xl font-heading mb-4">🚩 {t('postDetail.reportPost')}</h3>
                        <p className="text-gray-600 mb-4">
                            {t('postDetail.whyReport')}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                            {[
                                { key: 'inappropriateContent', label: t('postDetail.inappropriateContent') },
                                { key: 'hateSpeech', label: t('postDetail.hateSpeech') },
                                { key: 'spam', label: t('postDetail.spam') },
                                { key: 'aiArt', label: t('postDetail.aiArt') },
                                { key: 'copyright', label: t('postDetail.copyright') },
                                { key: 'other', label: t('postDetail.other') }
                            ].map((reason) => (
                                <button
                                    key={reason.key}
                                    onClick={() => setReportReason(reason.label)}
                                    className={`w-full text-left p-3 border-2 transition-colors ${
                                        reportReason === reason.label 
                                            ? 'border-red-500 bg-red-50' 
                                            : 'border-black hover:bg-gray-50'
                                    }`}
                                >
                                    {reason.label}
                                </button>
                            ))}
                        </div>

                        {reportReason === t('postDetail.other') && (
                            <textarea
                                placeholder={t('postDetail.describeProblem')}
                                className="w-full p-3 border-2 border-black mb-4"
                                rows={3}
                                onChange={(e) => setReportReason(e.target.value || t('postDetail.other'))}
                            />
                        )}

                        <div className="flex gap-3">
                            <Button 
                                variant="secondary" 
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportReason("");
                                }}
                                className="flex-1"
                            >
                                {t('postDetail.cancel')}
                            </Button>
                            <Button 
                                variant="primary"
                                onClick={handleReport}
                                disabled={!reportReason || reportSubmitting}
                                className="flex-1 bg-red-500 hover:bg-red-600"
                            >
                                {reportSubmitting ? t('postDetail.reporting') : t('postDetail.report')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}

