"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { getAllListingsForAdmin, setFeaturedListing, getFeaturedListings, getPendingListings } from "@/lib/listings";
import { getReports, updateReportStatus, getContentReports, updateContentReportStatus } from "@/lib/reports";
import { getPendingVerifications, approveArtistVerification, rejectArtistVerification } from "@/lib/db";
import { getPendingTrackingOrders, approveTracking, rejectTracking } from "@/lib/shipping";
import { Artwork, Report, ContentReport, ArtistProfile, Order, FeedPost, Chatroom, ChatroomCategory, ChatroomRegion } from "@/types";
import { Link } from "@/i18n/routing";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTranslations } from 'next-intl';
import { auth } from "@/lib/firebase";
import { 
    getAllChatroomsForAdmin, 
    createChatroom, 
    deleteChatroom, 
    toggleChatroomActive,
    CHATROOM_CATEGORIES,
    CHATROOM_REGIONS 
} from "@/lib/chatrooms";
import { getModerationQueue, reviewModerationItem } from "@/lib/moderation";
import { ModerationQueueItem } from "@/types";

type Tab = 'overview' | 'pending' | 'featured' | 'reports' | 'verifications' | 'statistics' | 'tracking' | 'moderation' | 'chatrooms';

export default function AdminDashboardPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('admin.dashboard');
    const tCommon = useTranslations('common');
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    
    // Data states
    const [allListings, setAllListings] = useState<Artwork[]>([]);
    const [pendingListings, setPendingListings] = useState<Artwork[]>([]);
    const [featuredListings, setFeaturedListings] = useState<Artwork[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [contentReports, setContentReports] = useState<ContentReport[]>([]);
    const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
    const [pendingTrackingOrders, setPendingTrackingOrders] = useState<Order[]>([]);
    const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
    const [listingRejectReason, setListingRejectReason] = useState<{ [key: string]: string }>({});
    const [trackingRejectReason, setTrackingRejectReason] = useState<{ [key: string]: string }>({});
    
    // Badge selection state for verification approvals
    const [badgeSelections, setBadgeSelections] = useState<{ 
        [userId: string]: { 
            kiFreeVerified: boolean; 
            pioneerBadge: boolean; 
            founderBadge: boolean; 
        } 
    }>({});
    const [deletingOrders, setDeletingOrders] = useState(false);
    const [deletingRevenue, setDeletingRevenue] = useState(false);
    const [deletingNotifications, setDeletingNotifications] = useState(false);
    const [pendingModerationPosts, setPendingModerationPosts] = useState<(FeedPost & { userName?: string })[]>([]);
    const [moderationQueue, setModerationQueue] = useState<(ModerationQueueItem & { userName?: string })[]>([]);
    
    // Chatroom states
    const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
    const [showCreateChatroom, setShowCreateChatroom] = useState(false);
    const [newChatroom, setNewChatroom] = useState({
        name: '',
        description: '',
        category: 'general' as ChatroomCategory,
        region: 'de' as ChatroomRegion,
        emoji: '💬',
        color: '#3498DB',
        isPinned: false,
        isModerated: true,
    });
    const [creatingChatroom, setCreatingChatroom] = useState(false);
    
    const [moderationStatus, setModerationStatus] = useState<{
        openaiTextModeration: { configured: boolean; description: string; icon: string };
        googleCloudVision: { configured: boolean; description: string; icon: string };
        hiveAiDetection: { configured: boolean; description: string; icon: string };
        perspectiveApi: { configured: boolean; description: string; icon: string };
    } | null>(null);
    const [stats, setStats] = useState({
        totalListings: 0,
        approvedListings: 0,
        pendingListings: 0,
        soldListings: 0,
        totalUsers: 0,
        verifiedArtists: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingReports: 0,
        pendingVerifications: 0,
        pendingTracking: 0,
        pendingModeration: 0,
        totalChatrooms: 0,
        activeChatrooms: 0,
    });

    useEffect(() => {
        if (authLoading) return;
        
        if (!user || profile?.role !== 'admin') {
            router.push("/");
            return;
        }
        
        fetchAllData();
    }, [user, profile, authLoading, router]);

    const fetchAllData = async () => {
        if (!user || profile?.role !== 'admin') return;
        
        setLoading(true);
        try {
            // Fetch all listings
            const listings = await getAllListingsForAdmin();
            setAllListings(listings);
            // Get pending listings (includes pending, undefined, none, or any non-approved)
            const pendingData = await getPendingListings();
            setPendingListings(pendingData);
            console.log(`📊 Dashboard: Found ${pendingData.length} pending/non-approved listings`);
            
            // Fetch featured listings
            const featured = await getFeaturedListings();
            setFeaturedListings(featured);
            
            // Fetch reports (old artwork reports)
            const allReports = await getReports();
            setReports(allReports);
            
            // Fetch content reports (new system for feed posts, comments, etc.)
            const allContentReports = await getContentReports();
            setContentReports(allContentReports);
            
            // Fetch pending verifications
            const verifications = await getPendingVerifications();
            setPendingVerifications(verifications);
            
            // Auto-suggest badges based on submitted data
            const autoSuggestions: { [userId: string]: { kiFreeVerified: boolean; pioneerBadge: boolean; founderBadge: boolean } } = {};
            const verifiedCount = (await getDocs(query(collection(db, "users"), where("verificationStatus", "==", "verified")))).size;
            
            verifications.forEach((v: any) => {
                const artistProfile = v.artistProfile;
                const hasProcessImages = artistProfile?.verificationProcessImages && artistProfile.verificationProcessImages.length >= 2;
                const hasSignature = !!artistProfile?.signatureImage;
                
                autoSuggestions[v.id] = {
                    // Auto-check KI-frei if user provided at least 2 process images
                    kiFreeVerified: hasProcessImages,
                    // Auto-check Pionier if less than 50 verified artists
                    pioneerBadge: verifiedCount < 50,
                    // Auto-check Gründer if less than 100 verified artists
                    founderBadge: verifiedCount < 100,
                };
            });
            
            setBadgeSelections(autoSuggestions);
            
            // Fetch pending tracking orders
            const pendingTracking = await getPendingTrackingOrders();
            setPendingTrackingOrders(pendingTracking);
            
            // Fetch statistics
            // Note: We need to use queries instead of getDocs on entire collections
            // For users, we'll fetch them via the verifications query and add others
            const allUsersQuery = query(collection(db, "users"));
            const usersSnapshot = await getDocs(allUsersQuery);
            const ordersQuery = query(collection(db, "orders"));
            const ordersSnapshot = await getDocs(ordersQuery);
            
            const users = usersSnapshot.docs.map(d => d.data());
            const orders = ordersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

            console.log(`📊 All orders:`, orders.map((o: any) => ({ id: o.id, status: o.status, amount: o.amount })));

            const paidOrders = orders.filter((o: any) => o.status === 'paid' || o.status === 'delivered');
            console.log(`💰 Paid orders:`, paidOrders.map((o: any) => ({ id: o.id, status: o.status, amount: o.amount })));
            
            const revenue = paidOrders.reduce((sum, o) => {
                const amount = Number(o.amount) || 0;
                console.log(`💰 Adding order ${o.id}: €${amount} (Total so far: €${sum + amount})`);
                return sum + amount;
            }, 0);
            
            console.log(`💰 Revenue calculation: ${paidOrders.length} paid orders, Total: €${revenue}`);
            
            // Fetch posts needing moderation review
            const moderationPostsQuery = query(
                collection(db, "feed_posts"),
                where("needsAdminReview", "==", true)
            );
            const moderationPostsSnapshot = await getDocs(moderationPostsQuery);
            const moderationPosts = moderationPostsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeedPost));
            
            // Also fetch posts with pending_review status (fallback)
            const pendingReviewQuery = query(
                collection(db, "feed_posts"),
                where("moderationStatus", "==", "pending_review")
            );
            const pendingReviewSnapshot = await getDocs(pendingReviewQuery);
            const pendingReviewPosts = pendingReviewSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeedPost));
            
            // Combine and dedupe
            const allModerationPosts = [...moderationPosts];
            pendingReviewPosts.forEach(p => {
                if (!allModerationPosts.find(m => m.id === p.id)) {
                    allModerationPosts.push(p);
                }
            });
            
            // Fetch usernames for moderation posts
            const postsWithUsernames = await Promise.all(
                allModerationPosts.map(async (post) => {
                    const userDoc = users.find(u => (u as any).uid === post.artistId);
                    return {
                        ...post,
                        userName: (userDoc as any)?.displayName || (userDoc as any)?.email || 'Unbekannt'
                    };
                })
            );
            
            setPendingModerationPosts(postsWithUsernames);
            
            // Fetch moderation queue (DMs, chat messages, etc.)
            const queueItems = await getModerationQueue();
            const pendingQueueItems = queueItems.filter(item => 
                item.status === 'pending' || item.status === 'flagged' || item.status === 'auto_blocked'
            );
            
            // Fetch usernames for queue items
            const queueWithUsernames = await Promise.all(
                pendingQueueItems.map(async (item) => {
                    const userDoc = users.find(u => (u as any).uid === item.userId);
                    return {
                        ...item,
                        userName: (userDoc as any)?.displayName || (userDoc as any)?.email || 'Unbekannt'
                    };
                })
            );
            setModerationQueue(queueWithUsernames);
            
            // Fetch chatrooms for admin
            const allChatrooms = await getAllChatroomsForAdmin();
            setChatrooms(allChatrooms);
            
            setStats({
                totalListings: listings.length,
                approvedListings: listings.filter(l => l.adminApprovalStatus === 'approved').length,
                pendingListings: listings.filter(l => l.adminApprovalStatus === 'pending').length,
                pendingTracking: pendingTrackingOrders.length,
                soldListings: listings.filter(l => l.status === 'sold').length,
                totalUsers: users.length,
                verifiedArtists: users.filter(u => u.verificationStatus === 'verified').length,
                totalOrders: orders.length,
                totalRevenue: revenue,
                pendingReports: allReports.filter(r => r.status === 'pending').length + allContentReports.filter(r => r.status === 'pending').length,
                pendingVerifications: verifications.length,
                pendingModeration: allModerationPosts.length + pendingQueueItems.length,
                totalChatrooms: allChatrooms.length,
                activeChatrooms: allChatrooms.filter(c => c.isActive).length,
            });

            // Fetch moderation API status
            try {
                const moderationRes = await fetch('/api/admin/moderation-status');
                if (moderationRes.ok) {
                    const moderationData = await moderationRes.json();
                    setModerationStatus(moderationData.status);
                }
            } catch (modError) {
                console.error("Error fetching moderation status:", modError);
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeatured = async (listingId: string, currentlyFeatured: boolean) => {
        if (!user) return;
        try {
            await setFeaturedListing(listingId, !currentlyFeatured, user.uid);
            await fetchAllData();
        } catch (error) {
            console.error("Error toggling featured:", error);
            alert("Failed to update featured status");
        }
    };

    const handleReportStatus = async (reportId: string, status: Report['status']) => {
        if (!user) return;
        try {
            await updateReportStatus(reportId, status, user.uid);
            await fetchAllData();
        } catch (error) {
            console.error("Error updating report:", error);
            alert("Failed to update report status");
        }
    };

    const handleContentReportStatus = async (reportId: string, status: ContentReport['status']) => {
        if (!user) return;
        try {
            await updateContentReportStatus(reportId, status, user.uid);
            await fetchAllData();
        } catch (error) {
            console.error("Error updating content report:", error);
            alert("Failed to update content report status");
        }
    };

    const handleDeleteReportedContent = async (contentType: string, contentId: string, reportId: string) => {
        if (!user) return;
        
        const confirmMsg = contentType === 'feed_post' 
            ? 'Diesen Post wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
            : contentType === 'comment'
            ? 'Diesen Kommentar wirklich löschen?'
            : contentType === 'artwork'
            ? 'Dieses Artwork wirklich löschen? Der Künstler wird benachrichtigt.'
            : 'Diesen Inhalt wirklich löschen?';
            
        if (!confirm(confirmMsg)) return;
        
        try {
            const { deleteDoc, doc } = await import("firebase/firestore");
            
            // Delete the content based on type
            if (contentType === 'feed_post') {
                await deleteDoc(doc(db, "feed_posts", contentId));
                // Also delete associated likes and comments
                const { getDocs, query, where, collection } = await import("firebase/firestore");
                
                // Delete likes
                const likesQuery = query(collection(db, "feed_likes"), where("postId", "==", contentId));
                const likesSnapshot = await getDocs(likesQuery);
                for (const likeDoc of likesSnapshot.docs) {
                    await deleteDoc(likeDoc.ref);
                }
                
                // Delete comments
                const commentsQuery = query(collection(db, "feed_comments"), where("postId", "==", contentId));
                const commentsSnapshot = await getDocs(commentsQuery);
                for (const commentDoc of commentsSnapshot.docs) {
                    await deleteDoc(commentDoc.ref);
                }
            } else if (contentType === 'comment') {
                await deleteDoc(doc(db, "feed_comments", contentId));
            } else if (contentType === 'artwork') {
                await deleteDoc(doc(db, "artworks", contentId));
            } else if (contentType === 'chat_message') {
                await deleteDoc(doc(db, "chat_messages", contentId));
            } else if (contentType === 'message') {
                await deleteDoc(doc(db, "messages", contentId));
            }
            
            // Mark the report as resolved
            await updateContentReportStatus(reportId, 'resolved', user.uid);
            
            alert('✅ Inhalt wurde gelöscht und Report als gelöst markiert.');
            await fetchAllData();
        } catch (error) {
            console.error("Error deleting reported content:", error);
            alert("Fehler beim Löschen des Inhalts: " + (error as Error).message);
        }
    };

    const handleApproveVerification = async (userId: string) => {
        if (!user) return;
        try {
            const badges = badgeSelections[userId] || { kiFreeVerified: false, pioneerBadge: false, founderBadge: false };
            const result = await approveArtistVerification(userId, user.uid, badges);
            await fetchAllData();
            
            if (result.badgesAwarded && result.badgesAwarded.length > 0) {
                const badgeNames = result.badgesAwarded.map((id: string) => {
                    if (id === 'ki_free_verified') return '🎨 KI-Frei';
                    if (id === 'first_artist') return '🚀 Pionier';
                    if (id === 'founder') return '⭐ Gründer';
                    return id;
                });
                alert(`✅ Künstler verifiziert!\n\nVerliehene Badges:\n${badgeNames.join('\n')}`);
            } else {
                alert("✅ Künstler verifiziert! (Keine zusätzlichen Badges vergeben)");
            }
            
            // Clear badge selections for this user
            setBadgeSelections(prev => {
                const newSelections = { ...prev };
                delete newSelections[userId];
                return newSelections;
            });
        } catch (error) {
            console.error("Error approving verification:", error);
            alert("Failed to approve verification");
        }
    };

    const handleRejectVerification = async (userId: string) => {
        if (!user) return;
        const reason = rejectReason[userId] || "Does not meet our quality standards";
        try {
            await rejectArtistVerification(userId, user.uid, reason);
            await fetchAllData();
            alert("Verification rejected");
        } catch (error) {
            console.error("Error rejecting verification:", error);
            alert("Failed to reject verification");
        }
    };

    const handleApproveListing = async (listingId: string) => {
        if (!user) return;
        try {
            const { approveListing } = await import("@/lib/listings");
            await approveListing(listingId, user.uid);
            await fetchAllData();
            alert("✅ Listing approved! It will now appear in the marketplace.");
        } catch (error) {
            console.error("Error approving listing:", error);
            alert("Failed to approve listing");
        }
    };

    const handleRejectListing = async (listingId: string) => {
        if (!user) return;
        const reason = listingRejectReason[listingId] || "Does not meet quality standards";
        try {
            const { rejectListing } = await import("@/lib/listings");
            await rejectListing(listingId, user.uid, reason);
            await fetchAllData();
            alert("Listing rejected");
        } catch (error) {
            console.error("Error rejecting listing:", error);
            alert("Failed to reject listing");
        }
    };

    if (authLoading || !profile) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto p-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">{tCommon('loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user || profile.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="container mx-auto p-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-5xl font-heading mb-2">{t('title')}</h1>
                        <p className="font-body text-xl text-gray-600">{t('subtitle')}</p>
                    </div>
                    <button
                        onClick={() => fetchAllData()}
                        disabled={loading}
                        className="bg-accent text-black px-6 py-3 font-heading border-2 border-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('refreshing') : t('refresh')}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b-4 border-black overflow-x-auto">
                    {(['overview', 'pending', 'featured', 'reports', 'verifications', 'tracking', 'moderation', 'chatrooms', 'statistics'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-heading text-lg border-b-4 transition-all ${
                                activeTab === tab
                                    ? 'border-accent bg-accent/10'
                                    : 'border-transparent hover:bg-gray-100'
                            }`}
                        >
                            {t(`tabs.${tab}`)}
                            {tab === 'pending' && pendingListings.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    {pendingListings.length}
                                </span>
                            )}
                            {tab === 'reports' && stats.pendingReports > 0 && (
                                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    {stats.pendingReports}
                                </span>
                            )}
                            {tab === 'verifications' && stats.pendingVerifications > 0 && (
                                <span className="ml-2 bg-yellow-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    {stats.pendingVerifications}
                                </span>
                            )}
                            {tab === 'tracking' && stats.pendingTracking > 0 && (
                                <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    {stats.pendingTracking}
                                </span>
                            )}
                            {tab === 'moderation' && stats.pendingModeration > 0 && (
                                <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    {stats.pendingModeration}
                                </span>
                            )}
                            {tab === 'chatrooms' && stats.totalChatrooms > 0 && (
                                <span className="ml-2 bg-purple-500 text-white px-2 py-0.5 text-xs rounded-full">
                                    {stats.activeChatrooms}/{stats.totalChatrooms}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-2xl">{tCommon('loading')}</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Moderation Alert */}
                                {stats.pendingModeration > 0 && (
                                    <div className="card-comic bg-orange-100 p-6 border-4 border-orange-500 animate-pulse">
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl">⚠️</span>
                                            <div className="flex-1">
                                                <h3 className="font-heading text-xl text-orange-800">
                                                    {stats.pendingModeration} Post{stats.pendingModeration !== 1 ? 's' : ''} zur Überprüfung!
                                                </h3>
                                                <p className="text-orange-700">
                                                    Es gibt geflaggte Posts, die eine manuelle Überprüfung benötigen.
                                                </p>
                                            </div>
                                            <Button 
                                                onClick={() => setActiveTab('moderation')} 
                                                variant="accent"
                                                className="whitespace-nowrap"
                                            >
                                                🛡️ Jetzt prüfen
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-3xl font-heading mb-2">{stats.pendingListings}</p>
                                        <p className="font-body text-gray-600">{t('stats.pendingListings')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-3xl font-heading mb-2">{stats.pendingReports}</p>
                                        <p className="font-body text-gray-600">{t('stats.pendingReports')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-3xl font-heading mb-2">{stats.pendingVerifications}</p>
                                        <p className="font-body text-gray-600">{t('stats.pendingVerifications')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-3xl font-heading mb-2">{stats.pendingTracking}</p>
                                        <p className="font-body text-gray-600">{t('stats.pendingTracking')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-3xl font-heading mb-2">{stats.totalUsers}</p>
                                        <p className="font-body text-gray-600">{t('stats.totalUsers')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-3xl font-heading mb-2">€{stats.totalRevenue.toLocaleString()}</p>
                                        <p className="font-body text-gray-600">{t('stats.totalRevenue')}</p>
                                    </div>
                                </div>

                                {/* Moderation API Status - Compact View */}
                                {moderationStatus && (
                                    <div className="card-comic bg-white p-4 border-4 border-black">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <h3 className="font-heading text-lg">🛡️ Moderation APIs</h3>
                                            <div className="flex gap-3 flex-wrap">
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${moderationStatus.openaiTextModeration.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    <span>💬</span>
                                                    <span className="font-medium">OpenAI Text</span>
                                                    <span>{moderationStatus.openaiTextModeration.configured ? '✓' : '✗'}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${moderationStatus.googleCloudVision.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    <span>🖼️</span>
                                                    <span className="font-medium">Google Cloud Bild</span>
                                                    <span>{moderationStatus.googleCloudVision.configured ? '✓' : '✗'}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${moderationStatus.hiveAiDetection.configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    <span>🤖</span>
                                                    <span className="font-medium">Hive KI</span>
                                                    <span>{moderationStatus.hiveAiDetection.configured ? '✓' : '⚠'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="card-comic bg-white p-6 border-4 border-black">
                                    <h2 className="text-2xl font-heading mb-4">{t('quickActions.title')}</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Button onClick={() => setActiveTab('pending')} variant="accent" className="w-full">
                                        {t('quickActions.reviewListings')} ({stats.pendingListings})
                                    </Button>
                                    <Button onClick={() => setActiveTab('verifications')} variant="accent" className="w-full">
                                        {t('quickActions.reviewArtists')} ({stats.pendingVerifications})
                                    </Button>
                                    <Button onClick={() => setActiveTab('reports')} variant="secondary" className="w-full">
                                        {t('quickActions.reviewReports')} ({stats.pendingReports})
                                    </Button>
                                    <Button onClick={() => setActiveTab('featured')} variant="primary" className="w-full">
                                        {t('quickActions.manageFeatured')}
                                    </Button>
                                </div>
                                <div className="mt-4 pt-4 border-t-2 border-black space-y-4">
                                    <div>
                                        <Link href="/admin/fix-listings">
                                            <button className="bg-yellow-500 text-black px-6 py-3 font-heading border-2 border-black hover:translate-x-1 hover:translate-y-1 transition-all w-full">
                                                {t('quickActions.fixListings')}
                                            </button>
                                        </Link>
                                        <p className="text-sm font-body text-gray-600 mt-2">
                                            {t('quickActions.fixListingsDesc')}
                                        </p>
                                    </div>
                                    <div>
                                        <Link href="/admin/stripe-webhook">
                                            <button className="bg-green-500 text-black px-6 py-3 font-heading border-2 border-black hover:translate-x-1 hover:translate-y-1 transition-all w-full">
                                                {t('quickActions.stripeWebhook')}
                                            </button>
                                        </Link>
                                        <p className="text-sm font-body text-gray-600 mt-2">
                                            {t('quickActions.stripeWebhookDesc')}
                                        </p>
                                    </div>
                                    <div>
                                        <Link href="/admin/webhook-status">
                                            <button className="bg-blue-500 text-black px-6 py-3 font-heading border-2 border-black hover:translate-x-1 hover:translate-y-1 transition-all w-full">
                                                {t('quickActions.checkWebhook')}
                                            </button>
                                        </Link>
                                        <p className="text-sm font-body text-gray-600 mt-2">
                                            {t('quickActions.checkWebhookDesc')}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-6 border-t-4 border-red-500">
                                        <h3 className="text-xl font-heading text-red-600 mb-4">⚠️ {t('quickActions.dangerZone')}</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(t('quickActions.confirmDeleteOrders'))) return;
                                                        if (!user) return;
                                                        setDeletingOrders(true);
                                                        try {
                                                            // Get auth token
                                                            const token = await user.getIdToken();
                                                            const response = await fetch('/api/admin/delete-all-orders', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`,
                                                                },
                                                                body: JSON.stringify({
                                                                    type: 'orders',
                                                                    userId: user.uid,
                                                                }),
                                                            });
                                                            const data = await response.json();
                                                            if (!response.ok) {
                                                                throw new Error(data.error || 'Failed to delete orders');
                                                            }
                                                            alert(`${t('quickActions.ordersDeleted')}: ${data.deleted}`);
                                                            fetchAllData();
                                                        } catch (error: any) {
                                                            alert(`${t('quickActions.deleteError')}: ${error.message}`);
                                                        } finally {
                                                            setDeletingOrders(false);
                                                        }
                                                    }}
                                                    disabled={deletingOrders}
                                                    className="bg-red-600 text-white px-6 py-3 font-heading border-2 border-black hover:bg-red-700 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingOrders ? t('quickActions.deleting') : t('quickActions.deleteAllOrders')}
                                                </button>
                                                <p className="text-sm font-body text-red-600 mt-2">
                                                    {t('quickActions.deleteOrdersDesc')}
                                                </p>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(t('quickActions.confirmDeleteRevenue'))) return;
                                                        if (!user) return;
                                                        setDeletingRevenue(true);
                                                        try {
                                                            // Get auth token
                                                            const token = await user.getIdToken();
                                                            const response = await fetch('/api/admin/delete-all-orders', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`,
                                                                },
                                                                body: JSON.stringify({
                                                                    type: 'revenue',
                                                                    userId: user.uid,
                                                                }),
                                                            });
                                                            const data = await response.json();
                                                            if (!response.ok) {
                                                                throw new Error(data.error || 'Failed to delete revenue');
                                                            }
                                                            alert(`${t('quickActions.revenueDeleted')}: ${data.deleted}`);
                                                            fetchAllData();
                                                        } catch (error: any) {
                                                            alert(`${t('quickActions.deleteError')}: ${error.message}`);
                                                        } finally {
                                                            setDeletingRevenue(false);
                                                        }
                                                    }}
                                                    disabled={deletingRevenue}
                                                    className="bg-red-600 text-white px-6 py-3 font-heading border-2 border-black hover:bg-red-700 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingRevenue ? t('quickActions.deleting') : t('quickActions.deleteAllRevenue')}
                                                </button>
                                                <p className="text-sm font-body text-red-600 mt-2">
                                                    {t('quickActions.deleteRevenueDesc')}
                                                </p>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(t('quickActions.confirmDeleteNotifications'))) return;
                                                        if (!user) return;
                                                        setDeletingNotifications(true);
                                                        try {
                                                            // Get auth token
                                                            const token = await user.getIdToken();
                                                            const response = await fetch('/api/admin/delete-all-orders', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`,
                                                                },
                                                                body: JSON.stringify({
                                                                    type: 'notifications',
                                                                    userId: user.uid,
                                                                }),
                                                            });
                                                            const data = await response.json();
                                                            if (!response.ok) {
                                                                throw new Error(data.error || 'Failed to delete notifications');
                                                            }
                                                            alert(`${t('quickActions.notificationsDeleted')}: ${data.deleted}`);
                                                            fetchAllData();
                                                        } catch (error: any) {
                                                            alert(`${t('quickActions.deleteError')}: ${error.message}`);
                                                        } finally {
                                                            setDeletingNotifications(false);
                                                        }
                                                    }}
                                                    disabled={deletingNotifications}
                                                    className="bg-red-600 text-white px-6 py-3 font-heading border-2 border-black hover:bg-red-700 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingNotifications ? t('quickActions.deleting') : t('quickActions.deleteAllNotifications')}
                                                </button>
                                                <p className="text-sm font-body text-red-600 mt-2">
                                                    {t('quickActions.deleteNotificationsDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        )}

                        {/* Rest of the tabs - keeping original content for now, can be translated later */}
                        {/* Pending Listings Tab */}
                        {activeTab === 'pending' && (
                            <div className="space-y-4">
                                <div className="card-comic bg-white p-4 border-4 border-black">
                                    <h2 className="text-2xl font-heading mb-4">{t('pending.title')}</h2>
                                    <p className="font-body text-gray-600 mb-4">
                                        {t('pending.description')}
                                    </p>
                                    <Link href="/admin/listings">
                                        <Button variant="accent">{t('pending.goToDetailed')}</Button>
                                    </Link>
                                </div>

                                {pendingListings.length === 0 ? (
                                    <div className="card-comic bg-white p-12 text-center">
                                        <p className="text-2xl font-heading mb-4">{t('pending.noPending')}</p>
                                        <p className="font-body text-gray-600">{t('pending.allReviewed')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {pendingListings.map((listing) => (
                                            <div key={listing.id} className="card-comic bg-white p-6 border-4 border-black">
                                                <div className="grid md:grid-cols-3 gap-6">
                                                    {/* Image */}
                                                    <div className="aspect-square border-2 border-black">
                                                        {listing.images[0] ? (
                                                            <img
                                                                src={listing.images[0]}
                                                                alt={listing.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                {t('pending.noImage')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Details */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h2 className="text-3xl font-heading">{listing.title}</h2>
                                                            <p className="font-body text-gray-600">{t('pending.byArtist')}: {listing.artistId}</p>
                                                        </div>
                                                        
                                                        <div className="space-y-1 text-sm">
                                                            <p><span className="font-bold">{t('pending.category')}:</span> {listing.category}</p>
                                                            <p><span className="font-bold">{t('pending.technique')}:</span> {listing.technique}</p>
                                                            <p><span className="font-bold">{t('pending.price')}:</span> €{listing.price.toLocaleString()}</p>
                                                            <p><span className="font-bold">{t('pending.dimensions')}:</span> {listing.dimensions}</p>
                                                            <p><span className="font-bold">{t('pending.type')}:</span> {listing.listingType}</p>
                                                            <p><span className="font-bold">{t('pending.status')}:</span> {listing.status}</p>
                                                            <p><span className="font-bold">{t('pending.approval')}:</span> {listing.adminApprovalStatus}</p>
                                                        </div>

                                                        <div className="border-t-2 border-black pt-3">
                                                            <p className="font-bold mb-1">{t('pending.description')}:</p>
                                                            <p className="font-body text-sm">{listing.description}</p>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block font-bold mb-2 text-sm">{t('pending.rejectionReason')}</label>
                                                            <textarea
                                                                className="input-comic h-24 text-sm"
                                                                placeholder={t('pending.rejectionPlaceholder')}
                                                                value={listingRejectReason[listing.id] || ""}
                                                                onChange={(e) => setListingRejectReason({ ...listingRejectReason, [listing.id]: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <Button
                                                                onClick={() => handleApproveListing(listing.id)}
                                                                variant="accent"
                                                                className="flex-1"
                                                            >
                                                                ✅ {t('pending.approve')}
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleRejectListing(listing.id)}
                                                                variant="secondary"
                                                                className="flex-1"
                                                            >
                                                                ❌ {t('pending.reject')}
                                                            </Button>
                                                        </div>

                                                        <Link href={`/marketplace/${listing.id}`} className="block">
                                                            <Button variant="primary" className="w-full">
                                                                {t('pending.viewDetails')}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Featured Listings Tab */}
                        {activeTab === 'featured' && (
                            <div className="space-y-4">
                                <div className="card-comic bg-white p-4 border-4 border-black">
                                    <h2 className="text-2xl font-heading mb-4">{t('featured.title')}</h2>
                                    <p className="font-body text-gray-600 mb-4">
                                        {t('featured.description')}
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allListings
                                        .filter(l => l.adminApprovalStatus === 'approved')
                                        .slice(0, 20)
                                        .map((listing) => {
                                            const isFeatured = featuredListings.some(f => f.id === listing.id);
                                            return (
                                                <div key={listing.id} className={`card-comic bg-white p-4 border-4 ${isFeatured ? 'border-accent bg-accent/5' : 'border-black'}`}>
                                                    <div className="aspect-square border-2 border-black mb-3">
                                                        {listing.images[0] ? (
                                                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">{t('featured.noImage')}</div>
                                                        )}
                                                    </div>
                                                    <h3 className="font-heading text-lg mb-1">{listing.title}</h3>
                                                    <p className="font-body text-sm text-gray-600 mb-3">€{listing.price.toLocaleString()}</p>
                                                    <Button
                                                        onClick={() => handleToggleFeatured(listing.id, isFeatured)}
                                                        variant={isFeatured ? "secondary" : "accent"}
                                                        className="w-full"
                                                    >
                                                        {isFeatured ? t('featured.removeFeatured') : t('featured.addFeatured')}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Verifications Tab */}
                        {activeTab === 'verifications' && (
                            <div className="space-y-4">
                                {/* Verification Stats Info Box */}
                                <div className="card-comic bg-blue-50 p-4 border-4 border-blue-500">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h3 className="font-heading text-lg text-blue-800">📊 Verifizierungs-Statistik</h3>
                                            <p className="text-blue-700 text-sm">
                                                <strong>{stats.verifiedArtists}</strong> Künstler bereits verifiziert
                                            </p>
                                        </div>
                                        <div className="flex gap-4 text-sm">
                                            <div className="bg-lime-100 px-3 py-1 rounded border border-lime-400">
                                                <span className="font-bold">🎨 KI-Frei:</span> Nur bei überzeugenden Prozess-Bildern
                                            </div>
                                            <div className="bg-gold-100 px-3 py-1 rounded border border-yellow-400">
                                                <span className="font-bold">🚀 Pionier:</span> {stats.verifiedArtists < 50 ? `Noch ${50 - stats.verifiedArtists} Plätze!` : 'Vergeben'}
                                            </div>
                                            <div className="bg-gold-100 px-3 py-1 rounded border border-yellow-400">
                                                <span className="font-bold">⭐ Gründer:</span> {stats.verifiedArtists < 100 ? `Noch ${100 - stats.verifiedArtists} Plätze!` : 'Vergeben'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {pendingVerifications.length === 0 ? (
                                    <div className="card-comic bg-white p-12 text-center">
                                        <p className="text-2xl font-heading">{t('verifications.noPending')}</p>
                                        <p className="font-body text-gray-600">{t('verifications.allReviewed')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {pendingVerifications.map((verification) => {
                                            const artistProfile = verification.artistProfile as ArtistProfile | undefined;
                                            return (
                                                <div key={verification.id} className="card-comic bg-white p-6 border-4 border-black">
                                                    <div className="grid md:grid-cols-3 gap-6">
                                                        {/* Portfolio Images */}
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h3 className="font-heading text-lg mb-2">{t('verifications.portfolioImages')}</h3>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {artistProfile?.portfolioImages && artistProfile.portfolioImages.length > 0 ? (
                                                                        artistProfile.portfolioImages.map((img, idx) => (
                                                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="aspect-square border-2 border-black block hover:opacity-80 transition-opacity">
                                                                                <img src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                                                                            </a>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-gray-500 col-span-2">{t('verifications.noImages')}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Process Images (KI-Free Verification) */}
                                                            {artistProfile?.verificationProcessImages && artistProfile.verificationProcessImages.length > 0 && (
                                                                <div className="bg-lime-50 border-2 border-lime-500 p-3 rounded">
                                                                    <h3 className="font-heading text-base mb-2 text-lime-800">🎨 KI-frei Prozess-Bilder</h3>
                                                                    <p className="text-xs text-lime-700 mb-2">Skizzen, Zwischenschritte, Werkstatt-Fotos</p>
                                                                    <div className="grid grid-cols-3 gap-1">
                                                                        {artistProfile.verificationProcessImages.map((img, idx) => (
                                                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="aspect-square border-2 border-lime-600 block hover:opacity-80 transition-opacity">
                                                                                <img src={img} alt={`Prozess ${idx + 1}`} className="w-full h-full object-cover" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Artist Details */}
                                                        <div className="space-y-3">
                                                            <div>
                                                                <h2 className="text-3xl font-heading">{artistProfile?.artistName || verification.displayName || t('verifications.unknownArtist')}</h2>
                                                                <p className="font-body text-gray-600">{t('verifications.email')}: {verification.email}</p>
                                                                <p className="font-body text-sm text-gray-500">{t('verifications.userId')}: {verification.id.slice(0, 8)}...</p>
                                                            </div>
                                                            
                                                            <div className="space-y-1 text-sm">
                                                                <p><span className="font-bold">{t('verifications.artStyle')}:</span> {artistProfile?.artStyle || t('verifications.notSpecified')}</p>
                                                                <p><span className="font-bold">{t('verifications.submitted')}:</span> {new Date(artistProfile?.verificationSubmittedAt || verification.createdAt).toLocaleDateString()}</p>
                                                                
                                                                {/* Education */}
                                                                {artistProfile?.education && (
                                                                    <p><span className="font-bold">📚 Ausbildung:</span> {artistProfile.education}</p>
                                                                )}
                                                                
                                                                {/* Exhibitions */}
                                                                {artistProfile?.exhibitions && artistProfile.exhibitions.length > 0 && (
                                                                    <p><span className="font-bold">🎨 Ausstellungen:</span> {Array.isArray(artistProfile.exhibitions) ? artistProfile.exhibitions.join(', ') : artistProfile.exhibitions}</p>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Social Media Links */}
                                                            {artistProfile?.socialMedia && (
                                                                <div className="flex flex-wrap gap-2 text-sm">
                                                                    {artistProfile.socialMedia.instagram && (
                                                                        <a href={artistProfile.socialMedia.instagram.startsWith('http') ? artistProfile.socialMedia.instagram : `https://instagram.com/${artistProfile.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="bg-pink-100 text-pink-800 px-2 py-1 rounded hover:bg-pink-200">
                                                                            📷 {artistProfile.socialMedia.instagram}
                                                                        </a>
                                                                    )}
                                                                    {artistProfile.socialMedia.behance && (
                                                                        <a href={artistProfile.socialMedia.behance.startsWith('http') ? artistProfile.socialMedia.behance : `https://behance.net/${artistProfile.socialMedia.behance}`} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                                                                            🎨 Behance
                                                                        </a>
                                                                    )}
                                                                    {artistProfile.socialMedia.website && (
                                                                        <a href={artistProfile.socialMedia.website.startsWith('http') ? artistProfile.socialMedia.website : `https://${artistProfile.socialMedia.website}`} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200">
                                                                            🌐 Website
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="border-t-2 border-black pt-3">
                                                                <p className="font-bold mb-1">{t('verifications.bio')}:</p>
                                                                <p className="font-body text-sm">{artistProfile?.bio || t('verifications.noBio')}</p>
                                                            </div>
                                                            
                                                            {/* Signature Image */}
                                                            {artistProfile?.signatureImage && (
                                                                <div className="border-t-2 border-black pt-3">
                                                                    <p className="font-bold mb-1">✍️ Künstler-Signatur:</p>
                                                                    <div className="bg-white p-2 border-2 border-black inline-block">
                                                                        <img src={artistProfile.signatureImage} alt="Signatur" className="max-h-16" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="space-y-4">
                                                            {/* Badge Selection */}
                                                            <div className="bg-yellow-50 border-2 border-yellow-500 p-3 rounded">
                                                                <p className="font-bold text-sm mb-2">🏆 Badges vergeben:</p>
                                                                <div className="space-y-2">
                                                                    {/* KI-Frei Badge */}
                                                                    <label className={`flex items-start gap-2 cursor-pointer p-2 rounded transition-colors ${
                                                                        artistProfile?.verificationProcessImages && artistProfile.verificationProcessImages.length > 0 
                                                                            ? 'bg-lime-100 border border-lime-400' 
                                                                            : 'bg-gray-100'
                                                                    }`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={badgeSelections[verification.id]?.kiFreeVerified || false}
                                                                            onChange={(e) => setBadgeSelections(prev => ({
                                                                                ...prev,
                                                                                [verification.id]: {
                                                                                    ...prev[verification.id],
                                                                                    kiFreeVerified: e.target.checked,
                                                                                    pioneerBadge: prev[verification.id]?.pioneerBadge || false,
                                                                                    founderBadge: prev[verification.id]?.founderBadge || false,
                                                                                }
                                                                            }))}
                                                                            className="mt-1"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <span className="font-bold text-sm">🎨 KI-Frei Badge</span>
                                                                            <p className="text-xs text-gray-600">100% menschengemachte Kunst verifiziert</p>
                                                                            {artistProfile?.verificationProcessImages && artistProfile.verificationProcessImages.length > 0 ? (
                                                                                <p className="text-xs text-lime-700 font-bold mt-1">
                                                                                    ✅ {artistProfile.verificationProcessImages.length} Prozess-Bilder vorhanden
                                                                                </p>
                                                                            ) : (
                                                                                <p className="text-xs text-red-600 mt-1">
                                                                                    ⚠️ Keine Prozess-Bilder hochgeladen
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                    
                                                                    {/* Pionier Badge */}
                                                                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-gray-100">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={badgeSelections[verification.id]?.pioneerBadge || false}
                                                                            onChange={(e) => setBadgeSelections(prev => ({
                                                                                ...prev,
                                                                                [verification.id]: {
                                                                                    ...prev[verification.id],
                                                                                    kiFreeVerified: prev[verification.id]?.kiFreeVerified || false,
                                                                                    pioneerBadge: e.target.checked,
                                                                                    founderBadge: prev[verification.id]?.founderBadge || false,
                                                                                }
                                                                            }))}
                                                                            className="mt-1"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <span className="font-bold text-sm">🚀 Pionier Badge</span>
                                                                            <p className="text-xs text-gray-600">Einer der ersten 50 verifizierten Künstler</p>
                                                                        </div>
                                                                    </label>
                                                                    
                                                                    {/* Gründer Badge */}
                                                                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-gray-100">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={badgeSelections[verification.id]?.founderBadge || false}
                                                                            onChange={(e) => setBadgeSelections(prev => ({
                                                                                ...prev,
                                                                                [verification.id]: {
                                                                                    ...prev[verification.id],
                                                                                    kiFreeVerified: prev[verification.id]?.kiFreeVerified || false,
                                                                                    pioneerBadge: prev[verification.id]?.pioneerBadge || false,
                                                                                    founderBadge: e.target.checked,
                                                                                }
                                                                            }))}
                                                                            className="mt-1"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <span className="font-bold text-sm">⭐ Gründer Badge</span>
                                                                            <p className="text-xs text-gray-600">Einer der ersten 100 Künstler auf Varbe</p>
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block font-bold mb-2 text-sm">{t('verifications.rejectionReason')}</label>
                                                                <textarea
                                                                    className="input-comic h-24 text-sm"
                                                                    placeholder={t('verifications.rejectionPlaceholder')}
                                                                    value={rejectReason[verification.id] || ""}
                                                                    onChange={(e) => setRejectReason({ ...rejectReason, [verification.id]: e.target.value })}
                                                                />
                                                            </div>

                                                            <div className="flex gap-3">
                                                                <Button
                                                                    onClick={() => handleApproveVerification(verification.id)}
                                                                    variant="accent"
                                                                    className="flex-1"
                                                                >
                                                                    ✅ {t('verifications.approve')}
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleRejectVerification(verification.id)}
                                                                    variant="secondary"
                                                                    className="flex-1"
                                                                >
                                                                    ❌ {t('verifications.reject')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reports Tab */}
                        {activeTab === 'reports' && (
                            <div className="space-y-6">
                                {/* Content Reports Section (Feed Posts, Comments, etc.) */}
                                <div>
                                    <h2 className="text-2xl font-heading mb-4 flex items-center gap-2">
                                        📢 Content Reports
                                        {contentReports.filter(r => r.status === 'pending').length > 0 && (
                                            <span className="bg-red-500 text-white px-2 py-0.5 text-sm rounded-full">
                                                {contentReports.filter(r => r.status === 'pending').length}
                                            </span>
                                        )}
                                    </h2>
                                    {contentReports.length === 0 ? (
                                        <div className="card-comic bg-white p-8 text-center border-4 border-black">
                                            <p className="text-lg font-body text-gray-600">Keine Content-Meldungen vorhanden</p>
                                        </div>
                                    ) : (
                            <div className="space-y-4">
                                            {contentReports.map((report) => (
                                                <div key={report.id} className="card-comic bg-white p-6 border-4 border-black">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-heading mb-2">
                                                                Meldung #{report.id.slice(0, 8)}
                                                            </h3>
                                                            <p className="font-body text-sm text-gray-600">
                                                                <span className="font-bold">Typ:</span>{' '}
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                    report.contentType === 'feed_post' ? 'bg-blue-100 text-blue-800' :
                                                                    report.contentType === 'comment' ? 'bg-purple-100 text-purple-800' :
                                                                    report.contentType === 'user' ? 'bg-orange-100 text-orange-800' :
                                                                    report.contentType === 'message' ? 'bg-pink-100 text-pink-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {report.contentType === 'feed_post' ? '📝 Feed Post' :
                                                                     report.contentType === 'comment' ? '💬 Kommentar' :
                                                                     report.contentType === 'user' ? '👤 Benutzer' :
                                                                     report.contentType === 'message' ? '✉️ Nachricht' :
                                                                     report.contentType === 'artwork' ? '🎨 Artwork' :
                                                                     report.contentType}
                                                                </span>
                                                            </p>
                                                            <p className="font-body text-sm text-gray-600 mt-1">
                                                                <span className="font-bold">Content ID:</span> {report.contentId.slice(0, 12)}...
                                                            </p>
                                                            <p className="font-body text-sm text-gray-600">
                                                                <span className="font-bold">Gemeldet von:</span> {report.reportedBy.slice(0, 12)}...
                                                            </p>
                                                            <p className="font-body text-xs text-gray-400 mt-1">
                                                                {new Date(report.createdAt).toLocaleString('de-DE')}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1 text-xs font-bold border-2 border-black ${
                                                            report.status === 'pending' ? 'bg-yellow-500 text-white' :
                                                            report.status === 'resolved' ? 'bg-green-500 text-white' :
                                                            report.status === 'dismissed' ? 'bg-gray-400 text-white' :
                                                            'bg-gray-200'
                                                        }`}>
                                                            {report.status === 'pending' ? '⏳ Ausstehend' :
                                                             report.status === 'resolved' ? '✅ Gelöst' :
                                                             report.status === 'dismissed' ? '❌ Abgelehnt' :
                                                             report.status}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mb-4">
                                                        <p className="font-bold mb-1">Grund:</p>
                                                        <p className="font-body">{report.reason}</p>
                                                    </div>
                                                    
                                                    {report.description && (
                                                        <div className="mb-4">
                                                            <p className="font-bold mb-1">Beschreibung:</p>
                                                            <p className="font-body text-sm">{report.description}</p>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex gap-2 flex-wrap">
                                                        {report.contentType === 'feed_post' && (
                                                            <Link href={`/feed/${report.contentId}`}>
                                                                <Button variant="primary">📝 Post ansehen</Button>
                                                            </Link>
                                                        )}
                                                        {report.contentType === 'user' && (
                                                            <Link href={`/profile/${report.contentId}`}>
                                                                <Button variant="primary">👤 Profil ansehen</Button>
                                                            </Link>
                                                        )}
                                                        {report.contentType === 'artwork' && (
                                                            <Link href={`/marketplace/${report.contentId}`}>
                                                                <Button variant="primary">🎨 Artwork ansehen</Button>
                                                            </Link>
                                                        )}
                                                        {report.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    onClick={() => handleContentReportStatus(report.id, 'resolved')}
                                                                    variant="accent"
                                                                >
                                                                    ✅ Gelöst
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleContentReportStatus(report.id, 'dismissed')}
                                                                    variant="secondary"
                                                                >
                                                                    ❌ Ablehnen
                                                                </Button>
                                                                {(report.contentType === 'feed_post' || report.contentType === 'comment' || report.contentType === 'artwork' || report.contentType === 'message') && (
                                                                    <button
                                                                        onClick={() => handleDeleteReportedContent(report.contentType, report.contentId, report.id)}
                                                                        className="bg-red-600 text-white border-2 border-black px-4 py-2 font-heading hover:bg-red-700 transition-colors"
                                                                    >
                                                                        🗑️ Content löschen
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <hr className="border-2 border-black my-8" />

                                {/* Legacy Reports Section (Artwork Reports) */}
                                <div>
                                    <h2 className="text-2xl font-heading mb-4 flex items-center gap-2">
                                        🎨 Artwork Reports (Legacy)
                                        {reports.filter(r => r.status === 'pending').length > 0 && (
                                            <span className="bg-red-500 text-white px-2 py-0.5 text-sm rounded-full">
                                                {reports.filter(r => r.status === 'pending').length}
                                            </span>
                                        )}
                                    </h2>
                                {reports.length === 0 ? (
                                        <div className="card-comic bg-white p-8 text-center border-4 border-black">
                                            <p className="text-lg font-body text-gray-600">{t('reports.noReports')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reports.map((report) => (
                                            <div key={report.id} className="card-comic bg-white p-6 border-4 border-black">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-heading mb-2">{t('reports.reportNumber', { id: report.id.slice(0, 8) })}</h3>
                                                        <p className="font-body text-sm text-gray-600">
                                                            {t('reports.listingId')}: {report.listingId.slice(0, 8)}...
                                                        </p>
                                                        <p className="font-body text-sm text-gray-600">
                                                            {t('reports.reportedBy')}: {report.reportedBy.slice(0, 8)}...
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 text-xs font-bold border-2 border-black ${
                                                        report.status === 'pending' ? 'bg-yellow-500 text-white' :
                                                        report.status === 'resolved' ? 'bg-green-500 text-white' :
                                                        'bg-gray-200'
                                                    }`}>
                                                        {report.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-4">
                                                    <p className="font-bold mb-1">{t('reports.reason')}:</p>
                                                    <p className="font-body">{report.reason}</p>
                                                </div>
                                                
                                                {report.description && (
                                                    <div className="mb-4">
                                                        <p className="font-bold mb-1">{t('reports.description')}:</p>
                                                        <p className="font-body text-sm">{report.description}</p>
                                                    </div>
                                                )}
                                                
                                                <div className="flex gap-2">
                                                    <Link href={`/marketplace/${report.listingId}`}>
                                                        <Button variant="primary" className="flex-1">{t('reports.viewListing')}</Button>
                                                    </Link>
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                onClick={() => handleReportStatus(report.id, 'resolved')}
                                                                variant="accent"
                                                                className="flex-1"
                                                            >
                                                                ✅ {t('reports.resolve')}
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleReportStatus(report.id, 'dismissed')}
                                                                variant="secondary"
                                                                className="flex-1"
                                                            >
                                                                ❌ {t('reports.dismiss')}
                                                            </Button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm('Dieses Artwork wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
                                                                        try {
                                                                            const { deleteDoc, doc: firestoreDoc } = await import("firebase/firestore");
                                                                            await deleteDoc(firestoreDoc(db, "artworks", report.listingId));
                                                                            await handleReportStatus(report.id, 'resolved');
                                                                            alert('✅ Artwork wurde gelöscht.');
                                                                        } catch (error) {
                                                                            console.error("Error deleting artwork:", error);
                                                                            alert('Fehler beim Löschen des Artworks');
                                                                        }
                                                                    }}
                                                                    className="bg-red-600 text-white border-2 border-black px-4 py-2 font-heading hover:bg-red-700 transition-colors"
                                                                >
                                                                    🗑️ Artwork löschen
                                                                </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </div>
                            </div>
                        )}

                        {/* Tracking Tab */}
                        {activeTab === 'tracking' && (
                            <div className="space-y-4">
                                <h2 className="text-3xl font-heading mb-4">{t('tracking.title')}</h2>
                                
                                {pendingTrackingOrders.length === 0 ? (
                                    <div className="card-comic bg-white p-8 text-center border-4 border-black">
                                        <p className="text-xl font-body text-gray-600">{t('tracking.noPending')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingTrackingOrders.map((order) => (
                                            <div key={order.id} className="card-comic bg-white p-6 border-4 border-black">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-heading mb-2">
                                                            {t('tracking.orderNumber', { id: order.id.slice(0, 8) })}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            <strong>{t('tracking.trackingNumber')}:</strong> {order.trackingNumber}
                                                        </p>
                                                        {order.shippingProvider && (
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                <strong>{t('tracking.shippingProvider')}:</strong> {order.shippingProvider}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            {t('tracking.submitted')}: {order.trackingSubmittedAt ? new Date(order.trackingSubmittedAt).toLocaleString('de-DE') : t('tracking.unknown')}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            <strong>{t('tracking.salePrice')}:</strong> €{(order.salePrice || order.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        {order.shippingDeadline && (
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                {t('tracking.deadline')}: {new Date(order.shippingDeadline).toLocaleDateString('de-DE')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Link
                                                        href={`/orders/${order.id}`}
                                                        className="text-black underline decoration-accent decoration-2 underline-offset-2 ml-4"
                                                    >
                                                        {t('tracking.orderDetails')} →
                                                    </Link>
                                                </div>
                                                
                                                <div className="flex gap-4 mt-4">
                                                    <button
                                                        onClick={async () => {
                                                            if (!user) return;
                                                            if (confirm(t('tracking.approveConfirm', { number: order.trackingNumber || '' }))) {
                                                                try {
                                                                    await approveTracking(order.id, user.uid);
                                                                    alert(t('tracking.approveSuccess'));
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    const err = error as Error;
                                                                    alert(`${t('tracking.error')}: ${err.message}`);
                                                                }
                                                            }
                                                        }}
                                                        className="card-comic bg-green-500 text-white border-2 border-black px-6 py-2 hover:bg-green-600 transition-colors"
                                                    >
                                                        ✅ {t('tracking.approve')}
                                                    </button>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder={t('tracking.rejectionPlaceholder')}
                                                            value={trackingRejectReason[order.id] || ''}
                                                            onChange={(e) => setTrackingRejectReason({ ...trackingRejectReason, [order.id]: e.target.value })}
                                                            className="w-full px-3 py-2 border-2 border-black"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!user) return;
                                                            const reason = trackingRejectReason[order.id] || t('tracking.noReason');
                                                            if (confirm(t('tracking.rejectConfirm', { number: order.trackingNumber || '' }))) {
                                                                try {
                                                                    await rejectTracking(order.id, user.uid, reason);
                                                                    alert(t('tracking.rejectSuccess'));
                                                                    setTrackingRejectReason({ ...trackingRejectReason, [order.id]: '' });
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    const err = error as Error;
                                                                    alert(`${t('tracking.error')}: ${err.message}`);
                                                                }
                                                            }
                                                        }}
                                                        className="card-comic bg-red-500 text-white border-2 border-black px-6 py-2 hover:bg-red-600 transition-colors"
                                                    >
                                                        ❌ {t('tracking.reject')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Moderation Tab */}
                        {activeTab === 'moderation' && (
                            <div className="space-y-6">
                                {/* Scan All Posts Button */}
                                <div className="card-comic bg-blue-50 p-6 border-4 border-blue-500">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h3 className="font-heading text-xl text-blue-800">🔍 Alle Posts scannen</h3>
                                            <p className="text-blue-600 text-sm">
                                                Scanne alle bestehenden Posts mit OpenAI Moderation auf problematische Inhalte.
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Alle Posts scannen? Dies kann einige Minuten dauern.')) return;
                                                try {
                                                    const response = await fetch('/api/admin/scan-all-posts', {
                                                        method: 'POST',
                                                    });
                                                    const data = await response.json();
                                                    if (data.success) {
                                                        alert(`✅ ${data.message}\n\nGeflagte Posts:\n${data.results.flaggedPosts.map((p: any) => `- ${p.text.substring(0, 50)}... (${p.reasons.join(', ')})`).join('\n') || 'Keine'}`);
                                                        fetchAllData();
                                                    } else {
                                                        alert(`❌ Fehler: ${data.error}`);
                                                    }
                                                } catch (error: any) {
                                                    alert(`❌ Fehler: ${error.message}`);
                                                }
                                            }}
                                            className="bg-blue-500 text-white border-2 border-black px-6 py-3 font-heading hover:bg-blue-600 transition-colors"
                                        >
                                            🔍 Jetzt scannen
                                        </button>
                                    </div>
                                </div>

                                <div className="card-comic bg-white p-6 border-4 border-black">
                                    <h2 className="text-2xl font-heading mb-4">🛡️ Posts zur Überprüfung</h2>
                                    <p className="text-gray-600 mb-4">
                                        Diese Posts wurden von der automatischen Moderation geflaggt und benötigen eine manuelle Überprüfung.
                                    </p>
                                    
                                    {pendingModerationPosts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="text-6xl mb-4 block">✅</span>
                                            <p className="font-heading text-xl">Keine Posts zur Überprüfung</p>
                                            <p className="text-gray-500">Alle Posts wurden bereits geprüft oder es gibt keine geflaggten Posts.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingModerationPosts.map((post) => (
                                                <div key={post.id} className="border-4 border-black p-4 bg-orange-50">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="font-heading text-lg">{post.userName}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(post.createdAt).toLocaleDateString('de-DE', { 
                                                                    day: '2-digit', month: '2-digit', year: 'numeric', 
                                                                    hour: '2-digit', minute: '2-digit' 
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {post.moderationReasons?.map((reason, i) => (
                                                                <span key={i} className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded">
                                                                    {reason === 'ai_generated' && '🤖 KI-generiert'}
                                                                    {reason === 'explicit_content' && '🔞 Explizit'}
                                                                    {reason === 'violence' && '⚠️ Gewalt'}
                                                                    {reason === 'harassment' && '💬 Belästigung'}
                                                                    {reason === 'hate_speech' && '🛑 Hassrede'}
                                                                    {reason === 'self_harm' && '💙 Selbstverletzung'}
                                                                    {reason === 'illicit' && '⚠️ Illegal'}
                                                                    {!['ai_generated', 'explicit_content', 'violence', 'harassment', 'hate_speech', 'self_harm', 'illicit'].includes(reason) && reason}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Post Content */}
                                                    <div className="bg-white p-3 border-2 border-black mb-3">
                                                        <p className="whitespace-pre-wrap">{post.text}</p>
                                                    </div>
                                                    
                                                    {/* Images */}
                                                    {post.images && post.images.length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                                            {post.images.map((img, i) => (
                                                                <img 
                                                                    key={i} 
                                                                    src={img} 
                                                                    alt={`Bild ${i + 1}`} 
                                                                    className="w-full h-32 object-cover border-2 border-black"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Moderation Scores */}
                                                    {post.moderationScores && (
                                                        <div className="bg-gray-100 p-2 text-xs mb-3 rounded">
                                                            <span className="font-bold">Scores: </span>
                                                            {post.moderationScores.toxicityScore !== undefined && (
                                                                <span className="mr-2">Toxizität: {Math.round((post.moderationScores.toxicityScore || 0) * 100)}%</span>
                                                            )}
                                                            {post.moderationScores.explicitScore !== undefined && (
                                                                <span className="mr-2">Explizit: {Math.round((post.moderationScores.explicitScore || 0) * 100)}%</span>
                                                            )}
                                                            {post.moderationScores.violenceScore !== undefined && (
                                                                <span className="mr-2">Gewalt: {Math.round((post.moderationScores.violenceScore || 0) * 100)}%</span>
                                                            )}
                                                            {post.moderationScores.aiScore !== undefined && (
                                                                <span>KI: {Math.round((post.moderationScores.aiScore || 0) * 100)}%</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await updateDoc(doc(db, "feed_posts", post.id), {
                                                                        moderationStatus: 'approved',
                                                                        needsAdminReview: false,
                                                                        moderationReviewedBy: user?.uid,
                                                                        moderationReviewedAt: Date.now(),
                                                                    });
                                                                    alert('Post wurde freigegeben!');
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    console.error("Error approving post:", error);
                                                                    alert('Fehler beim Freigeben des Posts');
                                                                }
                                                            }}
                                                            className="bg-green-500 text-white border-2 border-black px-6 py-2 font-heading hover:bg-green-600 transition-colors"
                                                        >
                                                            ✅ Freigeben
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const reason = prompt('Grund für die Ablehnung:');
                                                                if (reason === null) return;
                                                                try {
                                                                    await updateDoc(doc(db, "feed_posts", post.id), {
                                                                        moderationStatus: 'rejected',
                                                                        needsAdminReview: false,
                                                                        moderationReviewedBy: user?.uid,
                                                                        moderationReviewedAt: Date.now(),
                                                                        moderationRejectionReason: reason,
                                                                        visibility: 'hidden',
                                                                    });
                                                                    alert('Post wurde abgelehnt und versteckt.');
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    console.error("Error rejecting post:", error);
                                                                    alert('Fehler beim Ablehnen des Posts');
                                                                }
                                                            }}
                                                            className="bg-red-500 text-white border-2 border-black px-6 py-2 font-heading hover:bg-red-600 transition-colors"
                                                        >
                                                            ❌ Ablehnen
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Post dauerhaft löschen?')) return;
                                                                try {
                                                                    const { deleteDoc } = await import("firebase/firestore");
                                                                    await deleteDoc(doc(db, "feed_posts", post.id));
                                                                    alert('Post wurde gelöscht.');
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    console.error("Error deleting post:", error);
                                                                    alert('Fehler beim Löschen des Posts');
                                                                }
                                                            }}
                                                            className="bg-gray-800 text-white border-2 border-black px-6 py-2 font-heading hover:bg-black transition-colors"
                                                        >
                                                            🗑️ Löschen
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* DM & Chat Messages Moderation Queue */}
                                <div className="card-comic bg-white p-6 border-4 border-black">
                                    <h2 className="text-2xl font-heading mb-4">✉️ DMs & Chat-Nachrichten zur Überprüfung</h2>
                                    <p className="text-gray-600 mb-4">
                                        Diese Direktnachrichten und Chat-Nachrichten wurden von der automatischen Moderation geflaggt.
                                    </p>
                                    
                                    {moderationQueue.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="text-6xl mb-4 block">✅</span>
                                            <p className="font-heading text-xl">Keine Nachrichten zur Überprüfung</p>
                                            <p className="text-gray-500">Alle Nachrichten wurden bereits geprüft oder es gibt keine geflaggten Nachrichten.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {moderationQueue.map((item) => (
                                                <div key={item.id} className="border-4 border-black p-4 bg-purple-50">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                                    item.contentType === 'dm' ? 'bg-pink-200 text-pink-800' :
                                                                    item.contentType === 'chat_message' ? 'bg-blue-200 text-blue-800' :
                                                                    item.contentType === 'comment' ? 'bg-purple-200 text-purple-800' :
                                                                    'bg-gray-200 text-gray-800'
                                                                }`}>
                                                                    {item.contentType === 'dm' && '✉️ DM'}
                                                                    {item.contentType === 'chat_message' && '💬 Chat'}
                                                                    {item.contentType === 'comment' && '💭 Kommentar'}
                                                                    {!['dm', 'chat_message', 'comment'].includes(item.contentType) && item.contentType}
                                                                </span>
                                                                <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                                    item.status === 'flagged' ? 'bg-red-200 text-red-800' :
                                                                    item.status === 'auto_blocked' ? 'bg-red-500 text-white' :
                                                                    item.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                                                    'bg-gray-200'
                                                                }`}>
                                                                    {item.status === 'flagged' && '⚠️ Geflaggt'}
                                                                    {item.status === 'auto_blocked' && '🚫 Blockiert'}
                                                                    {item.status === 'pending' && '⏳ Ausstehend'}
                                                                </span>
                                                            </div>
                                                            <p className="font-heading text-lg">{item.userName}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(item.createdAt).toLocaleDateString('de-DE', { 
                                                                    day: '2-digit', month: '2-digit', year: 'numeric', 
                                                                    hour: '2-digit', minute: '2-digit' 
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {item.reasons?.map((reason, i) => (
                                                                <span key={i} className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded">
                                                                    {reason === 'harassment' && '💬 Belästigung'}
                                                                    {reason === 'hate_speech' && '🛑 Hassrede'}
                                                                    {reason === 'spam' && '📵 Spam'}
                                                                    {reason === 'explicit_content' && '🔞 Explizit'}
                                                                    {reason === 'violence' && '⚠️ Gewalt'}
                                                                    {reason === 'self_harm' && '💙 Selbstverletzung'}
                                                                    {reason === 'illicit' && '⚠️ Illegal'}
                                                                    {!['harassment', 'hate_speech', 'spam', 'explicit_content', 'violence', 'self_harm', 'illicit'].includes(reason) && reason}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Message Content */}
                                                    <div className="bg-white p-3 border-2 border-black mb-3">
                                                        <p className="whitespace-pre-wrap">{item.contentPreview || '(Kein Textinhalt)'}</p>
                                                    </div>
                                                    
                                                    {/* Moderation Scores */}
                                                    {item.scores && (
                                                        <div className="bg-gray-100 p-2 text-xs mb-3 rounded">
                                                            <span className="font-bold">Scores: </span>
                                                            {item.scores.toxicityScore !== undefined && `Toxizität: ${(item.scores.toxicityScore * 100).toFixed(0)}% `}
                                                            {item.scores.spamScore !== undefined && `Spam: ${(item.scores.spamScore * 100).toFixed(0)}% `}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await reviewModerationItem(item.id, 'approve', user?.uid || '');
                                                                    alert('✅ Nachricht wurde freigegeben.');
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    console.error("Error approving:", error);
                                                                    alert('Fehler beim Freigeben');
                                                                }
                                                            }}
                                                            className="bg-green-500 text-white border-2 border-black px-6 py-2 font-heading hover:bg-green-600 transition-colors"
                                                        >
                                                            ✅ Freigeben
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await reviewModerationItem(item.id, 'reject', user?.uid || '');
                                                                    alert('❌ Nachricht wurde abgelehnt.');
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    console.error("Error rejecting:", error);
                                                                    alert('Fehler beim Ablehnen');
                                                                }
                                                            }}
                                                            className="bg-red-500 text-white border-2 border-black px-6 py-2 font-heading hover:bg-red-600 transition-colors"
                                                        >
                                                            ❌ Ablehnen
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Nachricht wirklich löschen?')) return;
                                                                try {
                                                                    const { deleteDoc } = await import("firebase/firestore");
                                                                    // Delete the original content based on type
                                                                    if (item.contentType === 'dm') {
                                                                        await deleteDoc(doc(db, "messages", item.contentId));
                                                                    } else if (item.contentType === 'chat_message') {
                                                                        await deleteDoc(doc(db, "chat_messages", item.contentId));
                                                                    } else if (item.contentType === 'comment') {
                                                                        await deleteDoc(doc(db, "feed_comments", item.contentId));
                                                                    }
                                                                    // Also delete the queue item
                                                                    await deleteDoc(doc(db, "moderation_queue", item.id));
                                                                    alert('🗑️ Nachricht wurde gelöscht.');
                                                                    fetchAllData();
                                                                } catch (error) {
                                                                    console.error("Error deleting:", error);
                                                                    alert('Fehler beim Löschen');
                                                                }
                                                            }}
                                                            className="bg-gray-800 text-white border-2 border-black px-6 py-2 font-heading hover:bg-black transition-colors"
                                                        >
                                                            🗑️ Löschen
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chatrooms Tab */}
                        {activeTab === 'chatrooms' && (
                            <div className="space-y-6">
                                {/* Create Chatroom Section */}
                                <div className="card-comic bg-white p-6 border-4 border-black">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-heading">💬 Chatroom erstellen</h2>
                                        <Button 
                                            onClick={() => setShowCreateChatroom(!showCreateChatroom)} 
                                            variant={showCreateChatroom ? "secondary" : "accent"}
                                        >
                                            {showCreateChatroom ? '✕ Abbrechen' : '+ Neuer Chatroom'}
                                        </Button>
                                    </div>
                                    
                                    {showCreateChatroom && (
                                        <div className="space-y-4 border-t-2 border-gray-200 pt-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-heading mb-1">Name *</label>
                                                    <input
                                                        type="text"
                                                        value={newChatroom.name}
                                                        onChange={(e) => setNewChatroom({...newChatroom, name: e.target.value})}
                                                        placeholder="z.B. Digital Art Lounge"
                                                        className="w-full p-3 border-2 border-black font-body"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-heading mb-1">Emoji</label>
                                                    <input
                                                        type="text"
                                                        value={newChatroom.emoji}
                                                        onChange={(e) => setNewChatroom({...newChatroom, emoji: e.target.value})}
                                                        placeholder="💬"
                                                        className="w-full p-3 border-2 border-black font-body text-2xl"
                                                        maxLength={4}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block font-heading mb-1">Beschreibung *</label>
                                                <textarea
                                                    value={newChatroom.description}
                                                    onChange={(e) => setNewChatroom({...newChatroom, description: e.target.value})}
                                                    placeholder="Beschreibe den Chatroom..."
                                                    className="w-full p-3 border-2 border-black font-body"
                                                    rows={2}
                                                />
                                            </div>
                                            
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block font-heading mb-1">Kategorie *</label>
                                                    <select
                                                        value={newChatroom.category}
                                                        onChange={(e) => setNewChatroom({...newChatroom, category: e.target.value as ChatroomCategory})}
                                                        className="w-full p-3 border-2 border-black font-body"
                                                    >
                                                        {Object.entries(CHATROOM_CATEGORIES).map(([key, cat]) => (
                                                            <option key={key} value={key}>
                                                                {cat.emoji} {cat.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block font-heading mb-1">Region *</label>
                                                    <select
                                                        value={newChatroom.region}
                                                        onChange={(e) => setNewChatroom({...newChatroom, region: e.target.value as ChatroomRegion})}
                                                        className="w-full p-3 border-2 border-black font-body"
                                                    >
                                                        {Object.entries(CHATROOM_REGIONS).map(([key, reg]) => (
                                                            <option key={key} value={key}>
                                                                {reg.flag} {reg.label} ({reg.language})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block font-heading mb-1">Farbe</label>
                                                    <input
                                                        type="color"
                                                        value={newChatroom.color}
                                                        onChange={(e) => setNewChatroom({...newChatroom, color: e.target.value})}
                                                        className="w-full h-12 border-2 border-black cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newChatroom.isPinned}
                                                        onChange={(e) => setNewChatroom({...newChatroom, isPinned: e.target.checked})}
                                                        className="w-5 h-5"
                                                    />
                                                    <span className="font-body">📌 Anpinnen (Featured)</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newChatroom.isModerated}
                                                        onChange={(e) => setNewChatroom({...newChatroom, isModerated: e.target.checked})}
                                                        className="w-5 h-5"
                                                    />
                                                    <span className="font-body">🛡️ Moderiert</span>
                                                </label>
                                            </div>
                                            
                                            <div className="flex justify-end pt-4 border-t-2 border-gray-200">
                                                <Button
                                                    onClick={async () => {
                                                        if (!newChatroom.name.trim() || !newChatroom.description.trim()) {
                                                            alert('Bitte Name und Beschreibung ausfüllen!');
                                                            return;
                                                        }
                                                        
                                                        setCreatingChatroom(true);
                                                        try {
                                                            await createChatroom({
                                                                name: newChatroom.name.trim(),
                                                                description: newChatroom.description.trim(),
                                                                category: newChatroom.category,
                                                                region: newChatroom.region,
                                                                emoji: newChatroom.emoji || '💬',
                                                                color: newChatroom.color,
                                                                isPinned: newChatroom.isPinned,
                                                                isModerated: newChatroom.isModerated,
                                                            }, user?.uid);
                                                            
                                                            alert('✅ Chatroom wurde erstellt!');
                                                            setShowCreateChatroom(false);
                                                            setNewChatroom({
                                                                name: '',
                                                                description: '',
                                                                category: 'general',
                                                                region: 'de',
                                                                emoji: '💬',
                                                                color: '#3498DB',
                                                                isPinned: false,
                                                                isModerated: true,
                                                            });
                                                            fetchAllData();
                                                        } catch (error: any) {
                                                            alert(`❌ Fehler: ${error.message}`);
                                                        } finally {
                                                            setCreatingChatroom(false);
                                                        }
                                                    }}
                                                    variant="accent"
                                                    disabled={creatingChatroom}
                                                >
                                                    {creatingChatroom ? '⏳ Wird erstellt...' : '✅ Chatroom erstellen'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Chatroom List */}
                                <div className="card-comic bg-white p-6 border-4 border-black">
                                    <h2 className="text-2xl font-heading mb-4">📋 Alle Chatrooms ({chatrooms.length})</h2>
                                    
                                    {chatrooms.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="text-6xl mb-4 block">💬</span>
                                            <p className="font-heading text-xl">Keine Chatrooms vorhanden</p>
                                            <p className="text-gray-500">Erstelle deinen ersten Chatroom mit dem Button oben.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {chatrooms.map((room) => (
                                                <div 
                                                    key={room.id} 
                                                    className={`p-4 border-2 rounded-lg flex items-center justify-between ${
                                                        room.isActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-100 opacity-60'
                                                    }`}
                                                    style={{ borderLeftColor: room.color, borderLeftWidth: '6px' }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-3xl">{room.emoji}</span>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-heading text-lg">{room.name}</h3>
                                                                {room.isPinned && <span className="text-yellow-500">📌</span>}
                                                                {room.isModerated && <span className="text-blue-500">🛡️</span>}
                                                                {!room.isActive && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">INAKTIV</span>}
                                                            </div>
                                                            <p className="text-gray-600 text-sm">{room.description}</p>
                                                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                                <span>{CHATROOM_REGIONS[room.region]?.flag} {CHATROOM_REGIONS[room.region]?.label}</span>
                                                                <span>•</span>
                                                                <span>{CHATROOM_CATEGORIES[room.category]?.emoji} {CHATROOM_CATEGORIES[room.category]?.label}</span>
                                                                <span>•</span>
                                                                <span>👥 {room.membersCount || 0} Mitglieder</span>
                                                                <span>•</span>
                                                                <span>💬 {room.messagesCount || 0} Nachrichten</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const newStatus = await toggleChatroomActive(room.id);
                                                                    alert(`✅ Chatroom ist jetzt ${newStatus ? 'aktiv' : 'inaktiv'}`);
                                                                    fetchAllData();
                                                                } catch (error: any) {
                                                                    alert(`❌ Fehler: ${error.message}`);
                                                                }
                                                            }}
                                                            className={`px-3 py-1 border-2 border-black font-heading text-sm ${
                                                                room.isActive ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-green-400 hover:bg-green-500'
                                                            }`}
                                                        >
                                                            {room.isActive ? '⏸️ Deaktivieren' : '▶️ Aktivieren'}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Chatroom "${room.name}" wirklich löschen? Alle Nachrichten und Mitglieder werden entfernt!`)) return;
                                                                try {
                                                                    await deleteChatroom(room.id);
                                                                    alert('✅ Chatroom wurde gelöscht');
                                                                    fetchAllData();
                                                                } catch (error: any) {
                                                                    alert(`❌ Fehler: ${error.message}`);
                                                                }
                                                            }}
                                                            className="px-3 py-1 border-2 border-black bg-red-500 text-white font-heading text-sm hover:bg-red-600"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === 'statistics' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-4xl font-heading mb-2">{stats.totalListings}</p>
                                        <p className="font-body text-gray-600">{t('statistics.totalListings')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-4xl font-heading mb-2">{stats.approvedListings}</p>
                                        <p className="font-body text-gray-600">{t('statistics.approved')}</p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-4xl font-heading mb-2">{stats.soldListings}</p>
                                        <p className="font-body text-gray-600">{t('statistics.sold')}</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-4xl font-heading mb-2">{stats.totalUsers}</p>
                                        <p className="font-body text-gray-600">{t('statistics.totalUsers')}</p>
                                        <p className="font-body text-sm text-gray-500 mt-2">
                                            {stats.verifiedArtists} {t('statistics.verifiedArtists')}
                                        </p>
                                    </div>
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <p className="text-4xl font-heading mb-2">{stats.totalOrders}</p>
                                        <p className="font-body text-gray-600">{t('statistics.totalOrders')}</p>
                                        <p className="font-body text-sm text-gray-500 mt-2">
                                            €{stats.totalRevenue.toLocaleString()} {t('statistics.revenue')}
                                        </p>
                                    </div>
                                </div>

                                {/* Moderation API Status */}
                                {moderationStatus && (
                                    <div className="card-comic bg-white p-6 border-4 border-black">
                                        <h3 className="text-2xl font-heading mb-4">🛡️ Content Moderation APIs</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {/* OpenAI Text Moderation */}
                                            <div className={`p-4 border-2 rounded-lg ${moderationStatus.openaiTextModeration.configured ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{moderationStatus.openaiTextModeration.icon}</span>
                                                    <span className="font-heading text-lg">OpenAI Text</span>
                                                    <span className={`ml-auto px-2 py-1 text-xs font-bold rounded ${moderationStatus.openaiTextModeration.configured ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                        {moderationStatus.openaiTextModeration.configured ? '✓ AKTIV' : '✗ NICHT KONFIGURIERT'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{moderationStatus.openaiTextModeration.description}</p>
                                            </div>

                                            {/* Google Cloud Vision */}
                                            <div className={`p-4 border-2 rounded-lg ${moderationStatus.googleCloudVision.configured ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{moderationStatus.googleCloudVision.icon}</span>
                                                    <span className="font-heading text-lg">Google Cloud Bild</span>
                                                    <span className={`ml-auto px-2 py-1 text-xs font-bold rounded ${moderationStatus.googleCloudVision.configured ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                        {moderationStatus.googleCloudVision.configured ? '✓ AKTIV' : '✗ NICHT KONFIGURIERT'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{moderationStatus.googleCloudVision.description}</p>
                                            </div>

                                            {/* Hive AI Detection */}
                                            <div className={`p-4 border-2 rounded-lg ${moderationStatus.hiveAiDetection.configured ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{moderationStatus.hiveAiDetection.icon}</span>
                                                    <span className="font-heading text-lg">Hive KI-Erkennung</span>
                                                    <span className={`ml-auto px-2 py-1 text-xs font-bold rounded ${moderationStatus.hiveAiDetection.configured ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                                        {moderationStatus.hiveAiDetection.configured ? '✓ AKTIV' : '⚠ OPTIONAL'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{moderationStatus.hiveAiDetection.description}</p>
                                            </div>

                                            {/* Perspective API */}
                                            <div className={`p-4 border-2 rounded-lg ${moderationStatus.perspectiveApi.configured ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{moderationStatus.perspectiveApi.icon}</span>
                                                    <span className="font-heading text-lg">Perspective API</span>
                                                    <span className={`ml-auto px-2 py-1 text-xs font-bold rounded ${moderationStatus.perspectiveApi.configured ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                                        {moderationStatus.perspectiveApi.configured ? '✓ AKTIV' : '⚠ OPTIONAL'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{moderationStatus.perspectiveApi.description}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4">
                                            💡 OpenAI Text und Google Cloud Vision sind die Haupt-APIs für Content-Moderation.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

