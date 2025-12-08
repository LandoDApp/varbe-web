"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { 
    getCurrentDailyChallenge, 
    getCurrentWeeklyChallenge,
    getChallengeSubmissions,
    submitToChallenge,
    likeSubmission,
    unlikeSubmission,
    getSubmissionComments,
    addComment,
    getTimeRemaining,
    getUserSubmission
} from "@/lib/challenges";
import { Challenge, ChallengeSubmission, SubmissionComment, CHALLENGE_BADGES } from "@/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Link } from "@/i18n/routing";

export default function ChallengesPage() {
    const { user, profile } = useAuth();
    const t = useTranslations('challenges');
    
    // Challenges
    const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
    const [weeklyChallenge, setWeeklyChallenge] = useState<Challenge | null>(null);
    
    // Submissions
    const [dailySubmissions, setDailySubmissions] = useState<ChallengeSubmission[]>([]);
    const [weeklySubmissions, setWeeklySubmissions] = useState<ChallengeSubmission[]>([]);
    
    // User's submissions
    const [userDailySubmission, setUserDailySubmission] = useState<ChallengeSubmission | null>(null);
    const [userWeeklySubmission, setUserWeeklySubmission] = useState<ChallengeSubmission | null>(null);
    
    // Upload state
    const [uploadingFor, setUploadingFor] = useState<'daily' | 'weekly' | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState<'daily' | 'weekly' | null>(null);
    const [caption, setCaption] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // Comments modal
    const [selectedSubmission, setSelectedSubmission] = useState<ChallengeSubmission | null>(null);
    const [comments, setComments] = useState<SubmissionComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    
    // Expanded submission view
    const [expandedSubmission, setExpandedSubmission] = useState<ChallengeSubmission | null>(null);
    
    // Timer
    const [dailyTime, setDailyTime] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });
    const [weeklyTime, setWeeklyTime] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });
    
    // Loading
    const [loading, setLoading] = useState(true);
    
    // Fetch challenges and submissions
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [daily, weekly] = await Promise.all([
                    getCurrentDailyChallenge(),
                    getCurrentWeeklyChallenge()
                ]);
                
                setDailyChallenge(daily);
                setWeeklyChallenge(weekly);
                
                if (daily) {
                    const dailySubs = await getChallengeSubmissions(daily.id);
                    setDailySubmissions(dailySubs);
                    
                    if (user) {
                        const userSub = await getUserSubmission(daily.id, user.uid);
                        setUserDailySubmission(userSub);
                    }
                }
                
                if (weekly) {
                    const weeklySubs = await getChallengeSubmissions(weekly.id);
                    setWeeklySubmissions(weeklySubs);
                    
                    if (user) {
                        const userSub = await getUserSubmission(weekly.id, user.uid);
                        setUserWeeklySubmission(userSub);
                    }
                }
            } catch (error) {
                console.error("Error fetching challenges:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [user]);
    
    // Update timers
    useEffect(() => {
        const updateTimers = () => {
            if (dailyChallenge) {
                const time = getTimeRemaining(dailyChallenge.endDate);
                setDailyTime(time);
            }
            if (weeklyChallenge) {
                const time = getTimeRemaining(weeklyChallenge.endDate);
                setWeeklyTime(time);
            }
        };
        
        updateTimers();
        const interval = setInterval(updateTimers, 1000);
        return () => clearInterval(interval);
    }, [dailyChallenge, weeklyChallenge]);
    
    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            setUploadError(t('upload.errorImage'));
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            setUploadError(t('upload.errorSize'));
            return;
        }
        
        setSelectedFile(file);
        setPreviewImage(URL.createObjectURL(file));
        setUploadError(null);
    };
    
    // Open upload modal
    const openUploadModal = (type: 'daily' | 'weekly') => {
        console.log("Opening upload modal for:", type);
        setShowUploadModal(type);
        setUploadError(null);
        setCaption("");
        setPreviewImage(null);
        setSelectedFile(null);
    };
    
    // Close upload modal
    const closeUploadModal = () => {
        setShowUploadModal(null);
        setPreviewImage(null);
        setSelectedFile(null);
        setCaption("");
        setUploadError(null);
    };
    
    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile || !user || !profile || !showUploadModal) return;
        
        const challenge = showUploadModal === 'daily' ? dailyChallenge : weeklyChallenge;
        if (!challenge) return;
        
        setUploadingFor(showUploadModal);
        setUploadError(null);
        
        try {
            const fileRef = ref(storage, `challenges/${challenge.id}/${user.uid}_${Date.now()}`);
            await uploadBytes(fileRef, selectedFile);
            const imageUrl = await getDownloadURL(fileRef);
            
            await submitToChallenge(
                challenge.id,
                challenge.type,
                user.uid,
                profile.displayName || profile.username || 'Anonym',
                profile.profilePictureUrl,
                imageUrl,
                caption
            );
            
            // Refresh submissions
            const subs = await getChallengeSubmissions(challenge.id);
            if (showUploadModal === 'daily') {
                setDailySubmissions(subs);
                const userSub = await getUserSubmission(challenge.id, user.uid);
                setUserDailySubmission(userSub);
            } else {
                setWeeklySubmissions(subs);
                const userSub = await getUserSubmission(challenge.id, user.uid);
                setUserWeeklySubmission(userSub);
            }
            
            // Reset and close
            closeUploadModal();
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message || "Fehler beim Hochladen");
        } finally {
            setUploadingFor(null);
        }
    };
    
    // Handle like
    const handleLike = async (submission: ChallengeSubmission, type: 'daily' | 'weekly') => {
        if (!user || submission.artistId === user.uid) return;
        
        try {
            const hasLiked = submission.likedBy.includes(user.uid);
            
            if (hasLiked) {
                await unlikeSubmission(submission.id, user.uid);
            } else {
                await likeSubmission(submission.id, user.uid);
            }
            
            // Refresh submissions
            const challenge = type === 'daily' ? dailyChallenge : weeklyChallenge;
            if (challenge) {
                const subs = await getChallengeSubmissions(challenge.id);
                if (type === 'daily') {
                    setDailySubmissions(subs);
                } else {
                    setWeeklySubmissions(subs);
                }
            }
        } catch (error) {
            console.error("Error liking:", error);
        }
    };
    
    // Open comments
    const openComments = async (submission: ChallengeSubmission) => {
        setSelectedSubmission(submission);
        setLoadingComments(true);
        
        try {
            const cmts = await getSubmissionComments(submission.id);
            setComments(cmts);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };
    
    // Add comment
    const handleAddComment = async () => {
        if (!user || !profile || !selectedSubmission || !newComment.trim()) return;
        if (selectedSubmission.artistId === user.uid) return;
        
        try {
            await addComment(
                selectedSubmission.id,
                selectedSubmission.challengeId,
                user.uid,
                profile.displayName || profile.username || 'Anonym',
                profile.profilePictureUrl,
                newComment.trim()
            );
            
            const cmts = await getSubmissionComments(selectedSubmission.id);
            setComments(cmts);
            setNewComment("");
            
            // Update counts
            const challenge = selectedSubmission.challengeType === 'daily' ? dailyChallenge : weeklyChallenge;
            if (challenge) {
                const subs = await getChallengeSubmissions(challenge.id);
                if (selectedSubmission.challengeType === 'daily') {
                    setDailySubmissions(subs);
                } else {
                    setWeeklySubmissions(subs);
                }
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    // Format time
    const formatTime = (time: { hours: number; minutes: number; seconds: number }) => {
        if (time.hours >= 24) {
            const days = Math.floor(time.hours / 24);
            const hrs = time.hours % 24;
            return `${days}d ${hrs}h`;
        }
        return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;
    };

    // Render submission card
    const SubmissionCard = ({ submission, type, rank }: { submission: ChallengeSubmission; type: 'daily' | 'weekly'; rank: number }) => {
        const isOwn = user?.uid === submission.artistId;
        const hasLiked = user ? submission.likedBy.includes(user.uid) : false;
        
        return (
            <div 
                className={`group relative bg-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                    rank === 1 ? 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]' :
                    rank === 2 ? 'ring-2 ring-gray-300' :
                    rank === 3 ? 'ring-2 ring-orange-300' : 'border border-gray-200'
                }`}
            >
                {/* Image */}
                <div 
                    className="aspect-square cursor-pointer overflow-hidden"
                    onClick={() => setExpandedSubmission(submission)}
                >
                    <img 
                        src={submission.imageUrl} 
                        alt={submission.caption || 'Submission'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
                
                {/* Rank Badge */}
                {rank <= 3 && (
                    <div className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                        rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        rank === 2 ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-300 text-orange-800'
                    }`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                    </div>
                )}
                
                {/* Winner Crown */}
                {rank === 1 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                        👑
                    </div>
                )}
                
                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                    {/* Artist */}
                    <div className="flex items-center gap-2 mb-2">
                        {submission.artistProfilePicture ? (
                            <img 
                                src={submission.artistProfilePicture} 
                                alt=""
                                className="w-7 h-7 rounded-full border-2 border-white"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                                {submission.artistUsername?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-white text-sm font-medium truncate">
                            {submission.artistUsername || 'Anonym'}
                        </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLike(submission, type);
                            }}
                            disabled={!user || isOwn}
                            className={`flex items-center gap-1.5 transition-all ${
                                hasLiked ? 'text-red-400 scale-110' : 'text-white hover:text-red-400'
                            } ${(!user || isOwn) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span className="text-xl">{hasLiked ? '❤️' : '🤍'}</span>
                            <span className="font-bold">{submission.likesCount}</span>
                        </button>
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openComments(submission);
                            }}
                            className="flex items-center gap-1.5 text-white hover:text-blue-400 transition-colors"
                        >
                            <span className="text-xl">💬</span>
                            <span className="font-bold">{submission.commentsCount}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Challenge Card Component
    const ChallengeCard = ({ 
        challenge, 
        submissions, 
        userSubmission, 
        time, 
        type,
        gradient 
    }: { 
        challenge: Challenge; 
        submissions: ChallengeSubmission[];
        userSubmission: ChallengeSubmission | null;
        time: { hours: number; minutes: number; seconds: number };
        type: 'daily' | 'weekly';
        gradient: string;
    }) => (
        <section className="mb-16">
            {/* Challenge Header */}
            <div className={`relative overflow-hidden rounded-3xl ${gradient} p-8 md:p-12 mb-8`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>
                
                <div className="relative z-10">
                    {/* Type Badge & Timer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-5xl">{challenge.emoji}</span>
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white">
                                    {type === 'daily' ? `⚡ ${t('daily.badge')}` : `🏆 ${t('weekly.badge')}`}
                                </span>
                            </div>
                        </div>
                        
                        {/* Timer */}
                        <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3">
                            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                                {type === 'daily' ? t('daily.endsIn') : t('weekly.endsIn')}
                            </p>
                            <p className="text-white text-2xl md:text-3xl font-mono font-bold">
                                {formatTime(time)}
                            </p>
                        </div>
                    </div>
                    
                    {/* Challenge Title & Prompt */}
                    <h2 className="text-3xl md:text-5xl font-heading text-white mb-4 uppercase tracking-wide">
                        {challenge.title}
                    </h2>
                    <p className="text-white/90 text-lg md:text-xl max-w-2xl leading-relaxed mb-8">
                        {challenge.prompt}
                    </p>
                    
                    {/* Stats & CTA */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-6 text-white/80">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">👥</span>
                                <span className="font-bold">{challenge.participantsCount}</span>
                                <span className="text-sm">{t('stats.participants')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🖼️</span>
                                <span className="font-bold">{challenge.submissionsCount}</span>
                                <span className="text-sm">{t('stats.submissions')}</span>
                            </div>
                        </div>
                        
                        {/* Upload Button */}
                        {user ? (
                            userSubmission ? (
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                                    <span className="text-green-300 text-xl">✓</span>
                                    <span className="text-white font-bold">{t('actions.submitted')}</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => openUploadModal(type)}
                                    className="group flex items-center gap-3 bg-white text-black rounded-full px-8 py-4 font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl cursor-pointer"
                                >
                                    <span className="text-2xl group-hover:animate-bounce">📤</span>
                                    {t('actions.joinNow')}
                                </button>
                            )
                        ) : (
                            <Link href="/auth/login">
                                <span className="flex items-center gap-3 bg-white/20 backdrop-blur-sm text-white rounded-full px-8 py-4 font-bold text-lg transition-all hover:bg-white/30 cursor-pointer">
                                    <span className="text-2xl">🔐</span>
                                    {t('actions.loginToJoin')}
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Submissions Grid */}
            {submissions.length > 0 ? (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-heading flex items-center gap-3">
                            <span>🏆</span> {t('leaderboard.title')}
                            <span className="text-sm font-normal text-gray-500">
                                ({t('leaderboard.sortedByLikes')})
                            </span>
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {submissions.map((submission, index) => (
                            <SubmissionCard 
                                key={submission.id} 
                                submission={submission} 
                                type={type}
                                rank={index + 1}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-7xl mb-6">🎨</div>
                    <h3 className="text-2xl font-heading mb-2">{t('empty.title')}</h3>
                    <p className="text-gray-500 mb-6">
                        {t('empty.description')}
                    </p>
                    {user && !userSubmission && (
                        <button
                            type="button"
                            onClick={() => openUploadModal(type)}
                            className="inline-flex items-center gap-2 bg-black text-white rounded-full px-8 py-4 font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <span>📤</span> {t('empty.submitFirst')}
                        </button>
                    )}
                </div>
            )}
        </section>
    );

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-8xl mb-6 animate-pulse">🎨</div>
                        <p className="text-xl font-heading">{t('loading')}</p>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            
            {/* Hero Header */}
            <div className="bg-black text-white py-16 md:py-24 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-orange-900/50" />
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
                            <span className="text-2xl">🔥</span>
                            <span className="font-bold uppercase tracking-wider">{t('hero.badge')}</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading mb-6 leading-none">
                            {t('hero.title')}
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                                {t('hero.titleHighlight')}
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8">
                            {t('hero.description')} 🏆
                        </p>
                        
                        {/* Quick Stats */}
                        <div className="flex flex-wrap justify-center gap-8 text-center">
                            <div>
                                <p className="text-4xl font-bold text-yellow-400">
                                    {(dailyChallenge?.participantsCount || 0) + (weeklyChallenge?.participantsCount || 0)}
                                </p>
                                <p className="text-white/50 text-sm uppercase tracking-wider">{t('hero.activeArtists')}</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-orange-400">
                                    {(dailyChallenge?.submissionsCount || 0) + (weeklyChallenge?.submissionsCount || 0)}
                                </p>
                                <p className="text-white/50 text-sm uppercase tracking-wider">{t('hero.submissions')}</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-red-400">2</p>
                                <p className="text-white/50 text-sm uppercase tracking-wider">{t('hero.activeChallenges')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="container mx-auto px-4 py-12 md:py-20">
                {/* Daily Challenge */}
                {dailyChallenge && (
                    <ChallengeCard
                        challenge={dailyChallenge}
                        submissions={dailySubmissions}
                        userSubmission={userDailySubmission}
                        time={dailyTime}
                        type="daily"
                        gradient="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"
                    />
                )}
                
                {/* Weekly Challenge */}
                {weeklyChallenge && (
                    <ChallengeCard
                        challenge={weeklyChallenge}
                        submissions={weeklySubmissions}
                        userSubmission={userWeeklySubmission}
                        time={weeklyTime}
                        type="weekly"
                        gradient="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
                    />
                )}
                
                {/* Badge Info */}
                <section className="mt-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-heading mb-4">🏅 {t('badges.title')}</h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            {t('badges.description')}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {CHALLENGE_BADGES.map((badge) => (
                            <div 
                                key={badge.id}
                                className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all"
                            >
                                <div className="text-4xl mb-3">{badge.emoji}</div>
                                <p className="font-bold text-sm mb-1">{badge.name}</p>
                                <p className="text-xs text-gray-500">{badge.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            
            {/* Upload Modal */}
            {showUploadModal && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closeUploadModal}
                >
                    <div 
                        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-6 ${
                            showUploadModal === 'daily' 
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600' 
                                : 'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">
                                        {showUploadModal === 'daily' ? dailyChallenge?.emoji : weeklyChallenge?.emoji}
                                    </span>
                                    <div>
                                        <p className="text-white/70 text-sm">
                                            {showUploadModal === 'daily' ? t('daily.badge') : t('weekly.badge')}
                                        </p>
                                        <h3 className="text-white text-xl font-bold">
                                            {showUploadModal === 'daily' ? dailyChallenge?.title : weeklyChallenge?.title}
                                        </h3>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={closeUploadModal}
                                    className="text-white/70 hover:text-white text-2xl"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                            {/* Image Upload */}
                            {previewImage ? (
                                <div className="relative mb-6">
                                    <img 
                                        src={previewImage} 
                                        alt="Preview"
                                        className="w-full aspect-square object-cover rounded-2xl"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewImage(null);
                                            setSelectedFile(null);
                                        }}
                                        className="absolute top-3 right-3 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <label className="block mb-6 cursor-pointer">
                                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors">
                                        <div className="text-5xl mb-4">📸</div>
                                        <p className="font-bold text-lg mb-1">{t('upload.selectImage')}</p>
                                        <p className="text-gray-500 text-sm">{t('upload.dragHint')}</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            
                            {/* Caption */}
                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder={t('upload.captionPlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                                    maxLength={200}
                                />
                            </div>
                            
                            {/* Error */}
                            {uploadError && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                                    {uploadError}
                                </div>
                            )}
                            
                            {/* Submit */}
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={!selectedFile || uploadingFor !== null}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                                    selectedFile && !uploadingFor
                                        ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {uploadingFor ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span> {t('upload.uploading')}
                                    </span>
                                ) : (
                                    `${t('upload.submit')} 🚀`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Expanded Submission Modal */}
            {expandedSubmission && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setExpandedSubmission(null)}
                >
                    <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <img 
                            src={expandedSubmission.imageUrl}
                            alt=""
                            className="w-full rounded-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="mt-4 text-white text-center">
                            <p className="font-bold text-lg">{expandedSubmission.artistUsername}</p>
                            {expandedSubmission.caption && (
                                <p className="text-white/70 mt-2">{expandedSubmission.caption}</p>
                            )}
                        </div>
                    </div>
                    <button 
                        type="button"
                        className="absolute top-6 right-6 text-white text-3xl hover:opacity-70"
                        onClick={() => setExpandedSubmission(null)}
                    >
                        ✕
                    </button>
                </div>
            )}
            
            {/* Comments Modal */}
            {selectedSubmission && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
                    onClick={() => setSelectedSubmission(null)}
                >
                    <div 
                        className="bg-white w-full md:max-w-lg md:rounded-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-lg">
                                💬 {t('comments.title')} ({selectedSubmission.commentsCount})
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setSelectedSubmission(null)}
                                className="text-2xl text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingComments ? (
                                <div className="text-center py-8 text-gray-500">...</div>
                            ) : comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        {comment.profilePicture ? (
                                            <img 
                                                src={comment.profilePicture}
                                                alt=""
                                                className="w-10 h-10 rounded-full flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {comment.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                                <p className="font-bold text-sm">{comment.username}</p>
                                                <p className="text-gray-700">{comment.text}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 ml-4">
                                                {new Date(comment.createdAt).toLocaleString('de-DE', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-3">💬</div>
                                    <p className="text-gray-500">{t('comments.empty')}</p>
                                    <p className="text-gray-400 text-sm">{t('comments.beFirst')}</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Add Comment */}
                        {user && selectedSubmission.artistId !== user.uid ? (
                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t('comments.placeholder')}
                                        className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:border-gray-400 focus:outline-none"
                                        maxLength={500}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className={`px-6 py-3 rounded-full font-bold transition-all ${
                                            newComment.trim()
                                                ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        ) : user ? (
                            <div className="p-4 border-t bg-gray-100 text-center">
                                <p className="text-gray-500 text-sm">
                                    {t('comments.ownSubmission')}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 border-t bg-gray-100 text-center">
                                <Link href="/auth/login" className="text-blue-500 font-medium hover:underline">
                                    {t('comments.loginToComment')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <Footer />
        </main>
    );
}
