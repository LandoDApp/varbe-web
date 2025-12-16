"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { DEFAULT_PROFILE_CUSTOMIZATION, PROFILE_THEMES } from "@/components/ui/ProfileEditor";
import { BadgeShowcase, BadgePage } from "@/components/ui/BadgeDisplay";
import { useAuth } from "@/context/AuthContext";
import { useRouter, Link } from "@/i18n/routing";
import { doc, updateDoc, getDoc, collection, query, where, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { ProfileCustomization, UserAchievementData, ProfileBackground, FeedPost } from "@/types";
import { BADGES, getBadgeById } from "@/lib/badges";
import { compressImage } from "@/lib/image-compression";
import { checkUsernameAvailability, setUsername, validateUsername } from "@/lib/db";
import { CoverImagePositioner } from "@/components/ui/CoverImagePositioner";
import { useTranslations } from 'next-intl';

export default function ProfileSettingsPage() {
    const { user, profile, refreshProfile } = useAuth();
    const router = useRouter();
    const t = useTranslations('profile.settingsPage');
    const tBadges = useTranslations('badgeNames');
    const coverInputRef = useRef<HTMLInputElement>(null);
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'design' | 'badges' | 'visibility' | 'posts'>('profile');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Cover image positioner
    const [showCoverPositioner, setShowCoverPositioner] = useState(false);
    const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
    
    // Profile fields
    const [displayName, setDisplayName] = useState('');
    const [username, setUsernameValue] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [savingUsername, setSavingUsername] = useState(false);
    const [bio, setBio] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    
    // Location detection
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState('');
    
    // Location coordinates
    const [locationCoords, setLocationCoords] = useState<{
        latitude: number;
        longitude: number;
        city: string;
        country: string;
    } | null>(null);
    
    // Customization
    const [customization, setCustomization] = useState<ProfileCustomization>(DEFAULT_PROFILE_CUSTOMIZATION);
    const [uploadingCover, setUploadingCover] = useState(false);
    
    // Achievements
    const [achievementData, setAchievementData] = useState<UserAchievementData | null>(null);
    
    // Design panel state
    const [showColorPicker, setShowColorPicker] = useState(false);
    
    // Posts management
    const [userPosts, setUserPosts] = useState<FeedPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [deletingPost, setDeletingPost] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<string | null>(null);
    const [editPostText, setEditPostText] = useState('');
    
    useEffect(() => {
        if (!user) {
            router.push('/auth/login');
            return;
        }
        
        if (profile) {
            setDisplayName(profile.displayName || '');
            setUsernameValue(profile.username || '');
            setUsernameInput(profile.username || '');
            setBio(profile.bio || '');
            setPronouns(profile.pronouns || '');
            setLocation(profile.location || '');
            setWebsite(profile.website || '');
            setProfilePicturePreview(profile.profilePictureUrl || '');
            
            if (profile.profileCustomization) {
                setCustomization(profile.profileCustomization);
            }
            
            if (profile.achievementData) {
                setAchievementData(profile.achievementData);
            }
        }
        
        // Load existing studioLocation from artistProfile
        const loadStudioLocation = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const studioLoc = data?.artistProfile?.studioLocation;
                    if (studioLoc?.latitude && studioLoc?.longitude) {
                        setLocationCoords({
                            latitude: studioLoc.latitude,
                            longitude: studioLoc.longitude,
                            city: studioLoc.city || '',
                            country: studioLoc.country || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading studio location:", error);
            }
        };
        loadStudioLocation();
    }, [user, profile, router]);
    
    // Fetch user posts
    const fetchUserPosts = async () => {
        if (!user) return;
        setLoadingPosts(true);
        try {
            const postsQuery = query(
                collection(db, "feed_posts"),
                where("artistId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(postsQuery);
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
            setUserPosts(posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoadingPosts(false);
        }
    };
    
    // Delete post
    const handleDeletePost = async (postId: string) => {
        if (!user || !confirm(t('confirmDelete'))) return;
        
        setDeletingPost(postId);
        try {
            // Find the post to get image URLs
            const post = userPosts.find(p => p.id === postId);
            
            // Delete images from storage if they exist
            if (post?.images && post.images.length > 0) {
                for (const imageUrl of post.images) {
                    try {
                        // Extract the path from the URL
                        const urlParts = imageUrl.split('/o/');
                        if (urlParts[1]) {
                            const path = decodeURIComponent(urlParts[1].split('?')[0]);
                            const imageRef = ref(storage, path);
                            await deleteObject(imageRef);
                        }
                    } catch (imgError) {
                        console.error("Error deleting image:", imgError);
                    }
                }
            }
            
            // Delete the post document
            await deleteDoc(doc(db, "feed_posts", postId));
            
            // Update local state
            setUserPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error("Error deleting post:", error);
            alert(t('deleteError'));
        } finally {
            setDeletingPost(null);
        }
    };
    
    // Edit post text
    const handleEditPost = async (postId: string) => {
        if (!user || !editPostText.trim()) return;
        
        try {
            await updateDoc(doc(db, "feed_posts", postId), {
                text: editPostText.trim(),
                updatedAt: Date.now()
            });
            
            // Update local state
            setUserPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, text: editPostText.trim() } : p
            ));
            
            setEditingPost(null);
            setEditPostText('');
            setSuccessMessage(t('postEdited'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error editing post:", error);
            alert(t('editError'));
        }
    };
    
    // Load posts when tab is selected
    useEffect(() => {
        if (activeTab === 'posts' && userPosts.length === 0) {
            fetchUserPosts();
        }
    }, [activeTab]);
    
    // Username handling
    const handleUsernameInputChange = async (value: string) => {
        const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsernameInput(normalized);
        setUsernameError(null);
        setUsernameAvailable(null);
        
        if (!normalized || normalized === username) return;
        
        const validation = validateUsername(normalized);
        if (!validation.isValid && normalized.length > 0) {
            setUsernameError(validation.error || null);
            return;
        }
        
        if (normalized.length >= 3) {
            setCheckingUsername(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            const available = await checkUsernameAvailability(normalized);
            setUsernameAvailable(available);
            setCheckingUsername(false);
        }
    };
    
    const handleSaveUsername = async () => {
        if (!user || !usernameInput || usernameInput === username || !usernameAvailable) return;
        
        setSavingUsername(true);
        const result = await setUsername(user.uid, usernameInput);
        
        if (result.success) {
            setUsernameValue(usernameInput);
            await refreshProfile();
            setSuccessMessage(t('usernameChanged'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } else {
            setUsernameError(result.error || 'unknown_error');
        }
        setSavingUsername(false);
    };
    
    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const compressed = await compressImage(file, {
                maxWidth: 500,
                maxHeight: 500,
                quality: 0.8,
            });
            setProfilePicture(compressed.file);
            setProfilePicturePreview(URL.createObjectURL(compressed.file));
        } catch (error) {
            console.error('Error compressing image:', error);
        }
    };
    
    // Cover image upload
    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        
        setUploadingCover(true);
        try {
            const compressed = await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1200,
                quality: 0.85,
            });
            
            const storageRef = ref(storage, `cover-images/${user.uid}/${Date.now()}_cover.jpg`);
            await uploadBytes(storageRef, compressed.file);
            const url = await getDownloadURL(storageRef);
            
            // Open positioner modal
            setPendingCoverUrl(url);
            setShowCoverPositioner(true);
        } catch (error) {
            console.error('Error uploading cover:', error);
        } finally {
            setUploadingCover(false);
        }
    };
    
    // Handle cover position save
    const handleCoverPositionSave = (position: { x: number; y: number }) => {
        if (!pendingCoverUrl) return;
        
        // Map y position to allowed values
        const positionValue: 'top' | 'center' | 'bottom' = 
            position.y < 33 ? 'top' : position.y > 66 ? 'bottom' : 'center';
        
        setCustomization(prev => ({
            ...prev,
            coverImageUrl: pendingCoverUrl,
            showCoverImage: true,
            coverImagePosition: positionValue
        }));
        
        setShowCoverPositioner(false);
        setPendingCoverUrl(null);
        setSuccessMessage(t('coverPositioned'));
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    
    // Handle cover position cancel
    const handleCoverPositionCancel = () => {
        setShowCoverPositioner(false);
        setPendingCoverUrl(null);
    };
    
    // Auto-detect location
    const handleDetectLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError(t('geolocationNotSupported'));
            return;
        }
        
        setDetectingLocation(true);
        setLocationError('');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=de`
                    );
                    
                    if (!response.ok) throw new Error(t('geocodingFailed'));
                    
                    const data = await response.json();
                    let locationString = '';
                    let city = '';
                    let country = data.countryName || '';
                    
                    if (data.city) {
                        city = data.city;
                        locationString = data.city;
                        if (data.principalSubdivision) {
                            locationString += `, ${data.principalSubdivision}`;
                        }
                    } else if (data.locality) {
                        city = data.locality;
                        locationString = data.locality;
                    } else if (data.principalSubdivision) {
                        city = data.principalSubdivision;
                        locationString = data.principalSubdivision;
                    }
                    
                    if (locationString) {
                        setLocation(locationString);
                        setLocationCoords({ latitude, longitude, city, country });
                    } else {
                        setLocationError(t('locationNotDetermined'));
                    }
                } catch (error) {
                    setLocationError(t('locationNameError'));
                } finally {
                    setDetectingLocation(false);
                }
            },
            () => {
                setDetectingLocation(false);
                setLocationError(t('locationDenied'));
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    };
    
    const handleSaveAll = async () => {
        if (!user) return;
        
        setSaving(true);
        setSuccessMessage('');
        
        try {
            let profilePictureUrl = profile?.profilePictureUrl;
            
            if (profilePicture) {
                const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}_${profilePicture.name}`);
                await uploadBytes(storageRef, profilePicture);
                profilePictureUrl = await getDownloadURL(storageRef);
                setProfilePicturePreview(profilePictureUrl);
                setProfilePicture(null);
            }
            
            const userRef = doc(db, "users", user.uid);
            const updateData: Record<string, any> = {
                displayName,
                bio: bio || '',
                pronouns: pronouns || '',
                location: location || '',
                website: website || '',
                profileCustomization: customization,
                updatedAt: Date.now(),
            };
            
            if (profilePictureUrl) {
                updateData.profilePictureUrl = profilePictureUrl;
            }
            
            if (locationCoords) {
                updateData['artistProfile.studioLocation'] = {
                    city: locationCoords.city,
                    country: locationCoords.country,
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    showOnMap: true
                };
            }
            
            await updateDoc(userRef, updateData);
            await refreshProfile();
            
            setSuccessMessage(t('profileSaved'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert(t('saveError'));
        } finally {
            setSaving(false);
        }
    };
    
    const applyTheme = (themeKey: string) => {
        const theme = PROFILE_THEMES[themeKey as keyof typeof PROFILE_THEMES];
        if (theme) {
            setCustomization(prev => ({
                ...prev,
                ...theme.customization,
                theme: themeKey as ProfileCustomization['theme']
            }));
        }
    };
    
    if (!user) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-xl">{t('loading')}</p>
                </div>
                <Footer />
            </div>
        );
    }
    
    const accentColor = customization?.primaryColor || '#CCFF00';
    const userBadges = achievementData?.achievements || [];
    const showcasedBadgeIds = achievementData?.showcasedBadges || [];
    
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            {/* Success Message */}
            {successMessage && (
                <div 
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 border-4 border-black shadow-comic"
                    style={{ backgroundColor: accentColor }}
                >
                    ✅ {successMessage}
                </div>
            )}
            
            {/* LIVE PREVIEW - Looks like the real profile */}
            <div className="relative">
                {/* Banner / Cover Image - EDITABLE */}
                <div className="relative group">
                    {customization?.showCoverImage && customization?.coverImageUrl ? (
                        <div className="h-56 md:h-72 lg:h-80 bg-gray-900 relative overflow-hidden">
                            <img 
                                src={customization.coverImageUrl} 
                                alt="Cover" 
                                className="w-full h-full object-cover"
                                style={{ objectPosition: customization.coverImagePosition || 'center' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                    ) : (
                        <div 
                            className="h-40 md:h-56 lg:h-64"
                            style={{ 
                                background: customization?.background?.gradient 
                                    ? `linear-gradient(${customization.background.gradient.direction}, ${customization.background.gradient.colors.join(', ')})`
                                    : `linear-gradient(to right, #000, ${accentColor}, #000)`
                            }}
                        />
                    )}
                    
                    {/* Cover Edit Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                            onClick={() => coverInputRef.current?.click()}
                            className="px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-100"
                            disabled={uploadingCover}
                        >
                            {uploadingCover ? `⏳ ${t('uploading')}` : `📷 ${t('changeCover')}`}
                        </button>
                        {customization?.coverImageUrl && (
                            <>
                                <button 
                                    onClick={() => {
                                        setPendingCoverUrl(customization.coverImageUrl!);
                                        setShowCoverPositioner(true);
                                    }}
                                    className="px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-100"
                                >
                                    ↕️ {t('reposition')}
                                </button>
                                <button 
                                    onClick={() => setCustomization(prev => ({ ...prev, coverImageUrl: undefined, showCoverImage: false }))}
                                    className="px-4 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-red-600"
                                >
                                    🗑️ {t('remove')}
                                </button>
                            </>
                        )}
                    </div>
                    <input 
                        ref={coverInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleCoverImageUpload}
                        className="hidden"
                    />
                </div>
                
                {/* Profile Header */}
                <div className="bg-black/70 backdrop-blur-md text-white -mt-6 relative z-10">
                    <div className="container mx-auto max-w-6xl px-4 py-3">
                        <div className="flex items-center gap-4">
                            {/* Profile Picture - EDITABLE */}
                            <div className="relative group flex-shrink-0">
                                <div 
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-3 border-white/30 overflow-hidden bg-gray-800 cursor-pointer shadow-lg"
                                    onClick={() => profilePicInputRef.current?.click()}
                                >
                                    {profilePicturePreview ? (
                                        <img src={profilePicturePreview} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="flex items-center justify-center h-full text-3xl">👤</span>
                                    )}
                                </div>
                                <div 
                                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    onClick={() => profilePicInputRef.current?.click()}
                                >
                                    <span className="text-white text-xs">📷</span>
                                </div>
                                <input 
                                    ref={profilePicInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleProfilePictureChange}
                                    className="hidden"
                                />
                            </div>
                            
                            {/* Profile Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl md:text-2xl font-heading truncate">{displayName || 'Dein Name'}</h1>
                                    {profile?.verificationStatus === 'verified' && (
                                        <span className="px-1.5 py-0.5 text-xs border border-white/50" style={{ backgroundColor: accentColor, color: '#000' }}>
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-300 text-sm flex-wrap">
                                    {username && <span>@{username}</span>}
                                    {pronouns && <span className="text-gray-400">• {pronouns}</span>}
                                    {location && <span className="text-gray-400">• 📍 {location}</span>}
                                </div>
                                {/* Stats inline */}
                                <div className="flex gap-4 mt-1 text-sm">
                                    <span><strong>0</strong> <span className="text-gray-400">Posts</span></span>
                                    <span><strong>0</strong> <span className="text-gray-400">Followers</span></span>
                                    <span><strong>0</strong> <span className="text-gray-400">Following</span></span>
                                </div>
                            </div>
                            
                            {/* Action Buttons - rechts */}
                            <div className="flex gap-2 flex-shrink-0">
                                <Link href="/profile">
                                    <Button variant="primary" className="text-xs px-3 py-1.5" style={{ backgroundColor: accentColor, color: '#000' }}>
                                        👁️ {t('viewProfile')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content - Editor + Preview Side by Side */}
            <div className="container mx-auto max-w-6xl px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'profile', label: `👤 ${t('basicInfo')}` },
                        { id: 'design', label: `🎨 ${t('colors')}` },
                        { id: 'posts', label: `📝 ${t('yourPosts')}` },
                        { id: 'badges', label: `🏆 ${t('yourBadges')}` },
                        { id: 'visibility', label: `👁️ ${t('visibility')}` },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 font-heading border-4 border-black transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'text-black' 
                                    : 'bg-white hover:bg-gray-100'
                            }`}
                            style={{ 
                                backgroundColor: activeTab === tab.id ? accentColor : undefined,
                                boxShadow: activeTab === tab.id ? 'none' : '4px 4px 0px #000' 
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                    {/* LEFT - Editor Forms */}
                    <div className="space-y-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <>
                                {/* Username */}
                                <div 
                                    className="bg-white border-4 border-black p-6 shadow-comic"
                                    style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                >
                                    <h3 className="font-heading text-xl mb-4">@ {t('username')}</h3>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                            <input
                                                type="text"
                                                value={usernameInput}
                                                onChange={(e) => handleUsernameInputChange(e.target.value)}
                                                className={`w-full p-3 pl-8 border-2 ${
                                                    usernameError ? 'border-red-500' : 
                                                    usernameAvailable === true ? 'border-green-500' :
                                                    usernameAvailable === false ? 'border-red-500' : 'border-black'
                                                }`}
                                                placeholder="dein_username"
                                                maxLength={20}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSaveUsername}
                                            disabled={savingUsername || checkingUsername || !usernameAvailable || !!usernameError || usernameInput === username}
                                            className="px-4 border-2 border-black font-heading disabled:bg-gray-200 disabled:text-gray-400"
                                            style={{ backgroundColor: (!savingUsername && usernameAvailable && !usernameError && usernameInput !== username) ? accentColor : undefined }}
                                        >
                                            {savingUsername ? '...' : '✓'}
                                        </button>
                                    </div>
                                    {checkingUsername && <p className="text-gray-500 text-sm mt-2">⏳ {t('checking')}</p>}
                                    {!checkingUsername && usernameAvailable === true && usernameInput !== username && (
                                        <p className="text-green-600 text-sm mt-2 font-bold">✅ {t('available')}</p>
                                    )}
                                    {!checkingUsername && usernameAvailable === false && (
                                        <p className="text-red-500 text-sm mt-2">❌ {t('alreadyTaken')}</p>
                                    )}
                                </div>
                                
                                {/* Basic Info */}
                                <div 
                                    className="bg-white border-4 border-black p-6 shadow-comic"
                                    style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                >
                                    <h3 className="font-heading text-xl mb-4">📝 {t('basicInfo')}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold mb-1">{t('displayName')} *</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full p-3 border-2 border-black"
                                                placeholder={t('yourName')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-1">{t('bioLabel')}</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="w-full p-3 border-2 border-black h-24"
                                                placeholder={t('tellUs')}
                                                maxLength={500}
                                            />
                                            <p className="text-xs text-gray-500 text-right">{bio.length}/500</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-bold mb-1">{t('pronouns')}</label>
                                                <input
                                                    type="text"
                                                    value={pronouns}
                                                    onChange={(e) => setPronouns(e.target.value)}
                                                    className="w-full p-3 border-2 border-black"
                                                    placeholder={t('pronounsExample')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold mb-1">{t('locationLabel')}</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        className="flex-1 p-3 border-2 border-black"
                                                        placeholder={t('locationExample')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleDetectLocation}
                                                        disabled={detectingLocation}
                                                        className="px-3 border-2 border-black hover:bg-gray-100"
                                                    >
                                                        {detectingLocation ? '⏳' : '📍'}
                                                    </button>
                                                </div>
                                                {locationCoords && (
                                                    <p className="text-green-600 text-xs mt-1">✅ {t('visibleOnMap')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-1">{t('websiteLabel')}</label>
                                            <input
                                                type="url"
                                                value={website}
                                                onChange={(e) => setWebsite(e.target.value)}
                                                className="w-full p-3 border-2 border-black"
                                                placeholder={t('websiteExample')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {/* Design Tab */}
                        {activeTab === 'design' && (
                            <>
                                {/* Themes */}
                                <div 
                                    className="bg-white border-4 border-black p-6 shadow-comic"
                                    style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                >
                                    <h3 className="font-heading text-xl mb-4">🎭 THEMES</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {Object.entries(PROFILE_THEMES).map(([key, theme]) => (
                                            <button
                                                key={key}
                                                onClick={() => applyTheme(key)}
                                                className={`p-4 border-2 transition-all ${
                                                    customization.theme === key 
                                                        ? 'border-black scale-105' 
                                                        : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                                style={{
                                                    backgroundColor: (theme.customization.background as any).color || '#fff'
                                                }}
                                            >
                                                <span className="text-2xl">{theme.preview}</span>
                                                <p className="text-xs mt-1" style={{ color: theme.customization.textColor }}>{theme.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Colors */}
                                <div 
                                    className="bg-white border-4 border-black p-6 shadow-comic"
                                    style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                >
                                    <h3 className="font-heading text-xl mb-4">🎨 {t('colors')}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold mb-2">{t('backgroundColor')}</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['#ffffff', '#f5f5f5', '#1a1a1a', '#000000', '#FFF8E1', '#E3F2FD', '#FCE4EC', '#E8F5E9'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setCustomization(prev => ({ 
                                                            ...prev, 
                                                            background: { ...prev.background, type: 'color', color } 
                                                        }))}
                                                        className={`w-10 h-10 border-2 ${
                                                            customization.background?.type === 'color' && customization.background?.color === color 
                                                                ? 'border-black scale-110' 
                                                                : 'border-gray-300'
                                                        }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={customization.background?.color || '#ffffff'}
                                                    onChange={(e) => setCustomization(prev => ({ 
                                                        ...prev, 
                                                        background: { ...prev.background, type: 'color', color: e.target.value } 
                                                    }))}
                                                    className="w-10 h-10 border-2 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block font-bold mb-2">{t('accentColor')}</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['#CCFF00', '#FF10F0', '#00D4FF', '#FF6B35', '#9B59B6', '#E74C3C', '#2ECC71', '#F39C12'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setCustomization(prev => ({ ...prev, primaryColor: color }))}
                                                        className={`w-10 h-10 border-2 ${customization.primaryColor === color ? 'border-black scale-110' : 'border-gray-300'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={customization.primaryColor || '#CCFF00'}
                                                    onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                    className="w-10 h-10 border-2 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block font-bold mb-2">{t('textColor')}</label>
                                            <div className="flex gap-2">
                                                {['#000000', '#333333', '#666666', '#ffffff'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setCustomization(prev => ({ ...prev, textColor: color }))}
                                                        className={`w-10 h-10 border-2 ${customization.textColor === color ? 'border-black scale-110' : 'border-gray-300'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block font-bold mb-2">{t('linkColor')}</label>
                                            <div className="flex gap-2">
                                                {['#FF10F0', '#0066FF', '#00AA00', '#FF6600'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setCustomization(prev => ({ ...prev, linkColor: color }))}
                                                        className={`w-10 h-10 border-2 ${customization.linkColor === color ? 'border-black scale-110' : 'border-gray-300'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Cover Position */}
                                {customization.coverImageUrl && (
                                    <div 
                                        className="bg-white border-4 border-black p-6 shadow-comic"
                                        style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                    >
                                        <h3 className="font-heading text-xl mb-4">📷 {t('coverPosition')}</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['top', 'center', 'bottom'] as const).map(pos => (
                                                <button
                                                    key={pos}
                                                    onClick={() => setCustomization(prev => ({ ...prev, coverImagePosition: pos }))}
                                                    className={`p-3 border-2 text-sm ${
                                                        customization.coverImagePosition === pos 
                                                            ? 'border-black font-bold' 
                                                            : 'border-gray-200'
                                                    }`}
                                                    style={{ backgroundColor: customization.coverImagePosition === pos ? accentColor : undefined }}
                                                >
                                                    {pos === 'top' ? `⬆️ ${t('top')}` : pos === 'center' ? `⏺️ ${t('center')}` : `⬇️ ${t('bottom')}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Posts Tab */}
                        {activeTab === 'posts' && (
                            <div className="space-y-4">
                                <div 
                                    className="bg-white border-4 border-black p-6 shadow-comic"
                                    style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-heading text-xl">📝 {t('yourPosts')}</h3>
                                        <button
                                            onClick={fetchUserPosts}
                                            className="px-3 py-1 text-sm border-2 border-black hover:bg-gray-100"
                                        >
                                            🔄 {t('refresh')}
                                        </button>
                                    </div>
                                    
                                    {loadingPosts ? (
                                        <div className="text-center py-12">
                                            <p className="text-lg">⏳ Lade Posts...</p>
                                        </div>
                                    ) : userPosts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500 text-lg mb-4">{t('noPostsYet')}</p>
                                            <Link href="/feed">
                                                <Button variant="primary" style={{ backgroundColor: accentColor, color: '#000' }}>
                                                    ➕ {t('createFirstPost')}
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Du hast <strong>{userPosts.length}</strong> Posts. Hier kannst du sie bearbeiten oder löschen.
                                            </p>
                                            
                                            {userPosts.map((post) => (
                                                <div 
                                                    key={post.id} 
                                                    className="border-2 border-gray-200 p-4 hover:border-gray-400 transition-colors"
                                                >
                                                    <div className="flex gap-4">
                                                        {/* Post Image Thumbnail */}
                                                        {post.images && post.images.length > 0 && (
                                                            <div className="flex-shrink-0">
                                                                <img 
                                                                    src={post.images[0]} 
                                                                    alt="" 
                                                                    className="w-20 h-20 object-cover border-2 border-black"
                                                                />
                                                                {post.images.length > 1 && (
                                                                    <p className="text-xs text-gray-500 text-center mt-1">
                                                                        +{post.images.length - 1} mehr
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Post Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {editingPost === post.id ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={editPostText}
                                                                        onChange={(e) => setEditPostText(e.target.value)}
                                                                        className="w-full p-2 border-2 border-black text-sm h-20"
                                                                        placeholder="Post-Text..."
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleEditPost(post.id)}
                                                                            className="px-3 py-1 text-sm font-bold border-2 border-black"
                                                                            style={{ backgroundColor: accentColor }}
                                                                        >
                                                                            ✓ Speichern
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingPost(null);
                                                                                setEditPostText('');
                                                                            }}
                                                                            className="px-3 py-1 text-sm border-2 border-black hover:bg-gray-100"
                                                                        >
                                                                            ✕ Abbrechen
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm line-clamp-2 mb-2">
                                                                        {post.text || <span className="text-gray-400 italic">Kein Text</span>}
                                                                    </p>
                                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                        <span>📅 {new Date(post.createdAt).toLocaleDateString('de-DE')}</span>
                                                                        <span>❤️ {post.likesCount || 0}</span>
                                                                        <span>💬 {post.commentsCount || 0}</span>
                                                                        {post.visibility === 'followers' && <span className="text-orange-500">🔒 Nur Follower</span>}
                                                                        {post.visibility === 'subscribers' && <span className="text-red-500">🔐 Nur Abonnenten</span>}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Actions */}
                                                        {editingPost !== post.id && (
                                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                                <Link href={`/feed/${post.id}`}>
                                                                    <button className="px-3 py-1 text-xs border-2 border-black hover:bg-gray-100 w-full">
                                                                        👁️ Ansehen
                                                                    </button>
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingPost(post.id);
                                                                        setEditPostText(post.text || '');
                                                                    }}
                                                                    className="px-3 py-1 text-xs border-2 border-black hover:bg-gray-100"
                                                                >
                                                                    ✏️ Bearbeiten
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePost(post.id)}
                                                                    disabled={deletingPost === post.id}
                                                                    className="px-3 py-1 text-xs border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                                >
                                                                    {deletingPost === post.id ? '⏳...' : '🗑️ Löschen'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Quick Stats */}
                                {userPosts.length > 0 && (
                                    <div 
                                        className="bg-white border-4 border-black p-4 shadow-comic"
                                        style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                                    >
                                        <h4 className="font-heading text-sm mb-3">📊 POST-STATISTIKEN</h4>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="p-3 bg-gray-50 border border-gray-200">
                                                <p className="font-heading text-2xl">{userPosts.length}</p>
                                                <p className="text-xs text-gray-500">Posts</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 border border-gray-200">
                                                <p className="font-heading text-2xl">
                                                    {userPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0)}
                                                </p>
                                                <p className="text-xs text-gray-500">Likes</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 border border-gray-200">
                                                <p className="font-heading text-2xl">
                                                    {userPosts.reduce((sum, p) => sum + (p.commentsCount || 0), 0)}
                                                </p>
                                                <p className="text-xs text-gray-500">Kommentare</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Badges Tab */}
                        {activeTab === 'badges' && (
                            <div 
                                className="bg-white border-4 border-black p-6 shadow-comic"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <h3 className="font-heading text-xl mb-4">🏆 {t('yourBadges')}</h3>
                                {userBadges.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                        {t('noBadgesYet')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {userBadges.map(achievement => {
                                            const badge = getBadgeById(achievement.badgeId);
                                            if (!badge) return null;
                                            // Get translated badge name/description
                                            let badgeName = badge.name;
                                            let badgeDesc = badge.description;
                                            try {
                                                const translatedName = tBadges(`${badge.id}.name`);
                                                const translatedDesc = tBadges(`${badge.id}.description`);
                                                if (translatedName && !translatedName.includes(badge.id)) badgeName = translatedName;
                                                if (translatedDesc && !translatedDesc.includes(badge.id)) badgeDesc = translatedDesc;
                                            } catch {
                                                // Keep original text
                                            }
                                            return (
                                                <div 
                                                    key={achievement.badgeId}
                                                    className="flex items-center gap-3 p-3 border-2 border-gray-200"
                                                >
                                                    <span className="text-3xl">{badge.icon}</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold">{badgeName}</p>
                                                        <p className="text-sm text-gray-500">{badgeDesc}</p>
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color: accentColor }}>
                                                        +{badge.points}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Visibility Tab */}
                        {activeTab === 'visibility' && (
                            <div 
                                className="bg-white border-4 border-black p-6 shadow-comic"
                                style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                            >
                                <h3 className="font-heading text-xl mb-2">👁️ PROFIL-SICHTBARKEIT</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Wähle aus, welche Bereiche auf deinem Profil angezeigt werden sollen. 
                                    Ausgeblendete Bereiche werden komplett versteckt.
                                </p>
                                
                                <div className="space-y-4">
                                    {/* Bio & Info Section */}
                                    <div className="border-2 border-gray-200 p-4">
                                        <h4 className="font-heading text-sm mb-3">📝 {t('profileHeader')}</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📖</span>
                                                    <div>
                                                        <span className="font-bold">{t('bioSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('bioDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.bio !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            bio: prev.sectionVisibility?.bio === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.bio !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📍</span>
                                                    <div>
                                                        <span className="font-bold">{t('locationSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('locationDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.location !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            location: prev.sectionVisibility?.location === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.location !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📊</span>
                                                    <div>
                                                        <span className="font-bold">{t('statsSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('statsDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.stats !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            stats: prev.sectionVisibility?.stats === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.stats !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">🔗</span>
                                                    <div>
                                                        <span className="font-bold">{t('websiteSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('websiteDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.website !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            website: prev.sectionVisibility?.website === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.website !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* Sidebar Sections */}
                                    <div className="border-2 border-gray-200 p-4">
                                        <h4 className="font-heading text-sm mb-3">📦 {t('sidebarTiles')}</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📅</span>
                                                    <div>
                                                        <span className="font-bold">{t('eventsSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('eventsDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.events !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            events: prev.sectionVisibility?.events === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.events !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">🎯</span>
                                                    <div>
                                                        <span className="font-bold">{t('challengesSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('challengesDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.challenges !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            challenges: prev.sectionVisibility?.challenges === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.challenges !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">🏆</span>
                                                    <div>
                                                        <span className="font-bold">{t('badgesSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('badgesDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.badges !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            badges: prev.sectionVisibility?.badges === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.badges !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">💬</span>
                                                    <div>
                                                        <span className="font-bold">{t('chatroomsSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('chatroomsDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.chatrooms !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            chatrooms: prev.sectionVisibility?.chatrooms === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.chatrooms !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                            
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📌</span>
                                                    <div>
                                                        <span className="font-bold">{t('boardsSection')}</span>
                                                        <p className="text-xs text-gray-500">{t('boardsDesc')}</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        customization.sectionVisibility?.boards !== false ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}
                                                    onClick={() => setCustomization(prev => ({
                                                        ...prev,
                                                        sectionVisibility: {
                                                            ...prev.sectionVisibility,
                                                            boards: prev.sectionVisibility?.boards === false ? true : false
                                                        }
                                                    }))}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                                        customization.sectionVisibility?.boards !== false ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                                    }`} />
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-gray-400 text-center mt-4">
                                        {t('visibilityTip')}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Save Button */}
                        <Button
                            onClick={handleSaveAll}
                            variant="primary"
                            className="w-full text-lg py-4"
                            disabled={saving}
                            style={{ backgroundColor: accentColor, color: '#000' }}
                        >
                            {saving ? `⏳ ${t('saving')}` : `💾 ${t('saveAll')}`}
                        </Button>
                    </div>
                    
                    {/* RIGHT - Mini Preview Cards */}
                    <div className="space-y-4">
                        {/* Color Preview */}
                        <div 
                            className="bg-white border-4 border-black p-4"
                            style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                        >
                            <h4 className="font-heading text-sm mb-3">{t('colorPreview')}</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 border border-black" style={{ backgroundColor: accentColor }} />
                                    <span className="text-sm">{t('accent')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 border border-black" style={{ backgroundColor: customization.textColor }} />
                                    <span className="text-sm">{t('text')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 border border-black" style={{ backgroundColor: customization.linkColor }} />
                                    <span className="text-sm">{t('links')}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Badges Preview */}
                        <div 
                            className="bg-white border-4 border-black p-4"
                            style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                        >
                            <h4 className="font-heading text-sm mb-3">🏆 BADGES ({userBadges.length})</h4>
                            {userBadges.length === 0 ? (
                                <p className="text-xs text-gray-500">{t('noBadgesYet')}</p>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {userBadges.slice(0, 6).map(a => {
                                        const badge = getBadgeById(a.badgeId);
                                        return badge ? (
                                            <span key={a.badgeId} className="text-xl" title={badge.name}>{badge.icon}</span>
                                        ) : null;
                                    })}
                                    {userBadges.length > 6 && (
                                        <span className="text-xs text-gray-500">+{userBadges.length - 6}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Stats Preview */}
                        <div 
                            className="bg-white border-4 border-black p-4"
                            style={{ borderTopWidth: '6px', borderTopColor: accentColor }}
                        >
                            <h4 className="font-heading text-sm mb-3">📊 STATS</h4>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="p-2 bg-gray-50 border border-gray-200">
                                    <p className="font-heading text-lg">{userBadges.length}</p>
                                    <p className="text-xs text-gray-500">Badges</p>
                                </div>
                                <div className="p-2 bg-gray-50 border border-gray-200">
                                    <p className="font-heading text-lg">{achievementData?.stats?.totalPoints || 0}</p>
                                    <p className="text-xs text-gray-500">{t('pointsLabel')}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Tips */}
                        <div className="bg-yellow-50 border-2 border-yellow-300 p-4 text-sm">
                            <p className="font-bold mb-2">💡 {t('tips')}</p>
                            <ul className="space-y-1 text-xs text-gray-600">
                                <li>• {t('tip1')}</li>
                                <li>• {t('tip2')}</li>
                                <li>• {t('tip3')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Cover Image Positioner Modal */}
            {showCoverPositioner && pendingCoverUrl && (
                <CoverImagePositioner
                    imageUrl={pendingCoverUrl}
                    onSave={handleCoverPositionSave}
                    onCancel={handleCoverPositionCancel}
                    initialPosition={{ 
                        x: customization.coverImagePosition 
                            ? parseInt(customization.coverImagePosition.split('%')[0]) 
                            : 50,
                        y: customization.coverImagePosition 
                            ? parseInt(customization.coverImagePosition.split('%')[1]?.replace(' ', '') || '50')
                            : 50
                    }}
                    accentColor={accentColor}
                />
            )}
            
            <Footer />
        </div>
    );
}
