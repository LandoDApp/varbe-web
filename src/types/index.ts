export type UserRole = 'buyer' | 'seller' | 'admin';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    username?: string; // Unique username like @username (without the @)
    role: UserRole;
    verificationStatus: VerificationStatus;
    profilePictureUrl?: string;
    createdAt: number;
    // Email verification
    emailVerified?: boolean;
    emailVerifiedAt?: number;
    // Stripe Connect
    stripeAccountId?: string;
    stripeAccountStatus?: 'not_connected' | 'pending' | 'active';
    
    // Profile Customization (Tumblr-Style)
    profileCustomization?: ProfileCustomization;
    
    // Bio & About
    bio?: string;
    pronouns?: string;
    location?: string;
    website?: string;
    
    // Stats (cached)
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    
    // Achievement System
    achievementData?: UserAchievementData;
    
    // Demo Account Flag
    isDemo?: boolean;
}

export interface ArtistProfile {
    uid: string; // Same as User uid
    artistName: string;
    artStyle: string;
    bio: string;
    portfolioImages: string[]; // URLs
    verificationSubmittedAt: number;
    
    // ========================================
    // ENHANCED VERIFICATION (KI-Free)
    // ========================================
    
    // Process images showing creation (for KI-free verification)
    verificationProcessImages?: string[]; // 3-5 images showing work in progress
    
    // Handwritten signature (for comparison and certificates)
    signatureImage?: string; // URL to signature image
    
    // Community voting results
    communityVotes?: {
        yes: number;
        no: number;
        voters: string[]; // User IDs who voted
    };
    
    // Verification method used
    verificationMethod?: 'admin' | 'community' | 'both';
    
    // ========================================
    // PROVENANCE / HERKUNFTSPROTOKOLL
    // ========================================
    
    education?: string; // Kunstschule, Uni, selbstlernen
    exhibitions?: string[]; // Liste von Ausstellungen
    socialMedia?: {
        instagram?: string;
        behance?: string;
        website?: string;
        twitter?: string;
    };
    
    // ========================================
    // BADGE SYSTEM
    // ========================================
    badges?: ArtistBadge[];
    
    // ========================================
    // GEO-LOCATION
    // ========================================
    
    // Artist studio/atelier location
    studioLocation?: {
        city: string;
        country: string;
        latitude?: number;
        longitude?: number;
        showOnMap?: boolean; // Privacy toggle
    };
    
    // Open for studio visits
    openForVisits?: boolean;
    visitBookingUrl?: string;
}

// ========================================
// BADGE/ACHIEVEMENT SYSTEM (Steam-Style)
// ========================================

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
export type BadgeCategory = 'artist' | 'buyer' | 'community' | 'special' | 'easter_egg';

export interface Badge {
    id: string;
    name: string;
    description: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    icon: string; // Emoji or icon identifier
    color: 'green' | 'pink' | 'gold' | 'white' | 'special'; // Neon color theme
    unlockCondition: {
        type: string;
        target?: number;
        event?: string;
    };
    points: number; // Achievement points
    hidden?: boolean; // Easter egg badges
}

export interface UserAchievement {
    badgeId: string;
    unlockedAt: number;
    progress: {
        current: number;
        target: number;
    };
    showcased?: boolean; // Display on profile
}

export interface UserAchievementData {
    id: string;
    oderId: string;
    achievements: UserAchievement[];
    stats: {
        totalBadges: number;
        totalPoints: number;
        currentStreak: number;
        longestStreak: number;
        lastActiveAt: number;
        rarityBreakdown: {
            common: number;
            uncommon: number;
            rare: number;
            very_rare: number;
            legendary: number;
        };
    };
    showcasedBadges: string[]; // Up to 5 badge IDs to display on profile
}

// Legacy badge type (backward compatible)
export type ArtistBadge = 
    | 'verified'        // ✅ Verifizierter Künstler
    | 'founding'        // 🌟 Gründungs-Künstler (early adopter)
    | 'top_seller'      // 🔥 Top Seller
    | 'ki_free'         // 🎨 100% KI-frei verifiziert
    | 'community_choice'// 💚 Community Choice
    | 'premium'         // 💎 Premium Künstler
    | 'local_hero';     // 📍 Lokaler Held

// ========================================
// PROFILE CUSTOMIZATION (Tumblr-Style)
// ========================================

export type ProfileBackgroundType = 'color' | 'gradient' | 'image' | 'pattern';
export type ProfileBlockType = 'bio' | 'links' | 'gallery' | 'badges' | 'stats' | 'quote' | 'spotify' | 'custom_html';

export interface ProfileBackground {
    type: ProfileBackgroundType;
    color?: string; // Hex color
    gradient?: {
        colors: string[]; // Array of hex colors
        direction: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-br' | 'to-bl';
    };
    imageUrl?: string;
    imagePosition?: string; // CSS background-position (e.g., 'center', 'top left')
    imageSize?: string; // CSS background-size (e.g., 'cover', 'contain', '100% auto')
    pattern?: 'dots' | 'grid' | 'stripes' | 'zigzag' | 'comic';
    opacity?: number; // 0-100
    blur?: number; // 0-20px
}

export interface ProfileBlock {
    id: string;
    type: ProfileBlockType;
    order: number;
    visible: boolean;
    title?: string;
    content?: string; // For quote, custom blocks
    data?: Record<string, any>; // Block-specific data
    style?: {
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        borderWidth?: number;
    };
}

export interface ProfileCustomization {
    // Background
    background: ProfileBackground;
    headerBackground?: ProfileBackground; // Separate header bg
    
    // Colors
    primaryColor: string; // Accent color
    textColor: string;
    linkColor: string;
    
    // Typography
    fontFamily?: 'default' | 'serif' | 'mono' | 'display';
    
    // Layout
    layout: 'classic' | 'centered' | 'sidebar' | 'full-width';
    showCoverImage: boolean;
    coverImageUrl?: string;
    coverImagePosition?: 'top' | 'center' | 'bottom';
    
    // Blocks
    blocks: ProfileBlock[];
    
    // Badges showcase
    showcasedBadges: string[]; // Up to 5 badge IDs
    badgeDisplayStyle: 'grid' | 'row' | 'hidden';
    
    // Section Visibility (wie bei Steam - einzelne Kacheln ein/ausblenden)
    sectionVisibility?: {
        events?: boolean;      // Events-Kachel anzeigen
        challenges?: boolean;  // Challenges-Kachel anzeigen
        badges?: boolean;      // Badges-Kachel anzeigen
        chatrooms?: boolean;   // Chatrooms-Kachel anzeigen
        boards?: boolean;      // Boards-Kachel anzeigen
        bio?: boolean;         // Bio anzeigen
        stats?: boolean;       // Stats (Follower etc.) anzeigen
        location?: boolean;    // Standort anzeigen
        website?: boolean;     // Website anzeigen
    };
    
    // Social links
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        tiktok?: string;
        youtube?: string;
        behance?: string;
        dribbble?: string;
        website?: string;
    };
    
    // Custom CSS (premium feature)
    customCss?: string;
    
    // Music/Spotify embed
    spotifyEmbed?: string;
    
    // Profile theme presets
    theme?: 'default' | 'dark' | 'neon' | 'minimal' | 'retro' | 'custom';
}

// ========================================
// BOARDS (Pinterest-Style Collections)
// ========================================

export interface Board {
    id: string;
    userId: string;
    title: string;
    description?: string;
    coverImageUrl?: string;
    isPrivate: boolean;
    isCollaborative: boolean; // Allow others to pin posts to this board
    postIds: string[]; // IDs of saved posts
    contributors?: string[]; // User IDs who have pinned to this board
    createdAt: number;
    updatedAt?: number;
}

// ========================================
// PROFILE COMMENTS (Guestbook-Style)
// ========================================

export interface ProfileComment {
    id: string;
    profileUserId: string; // The profile this comment is on
    authorId: string; // Who wrote the comment
    text: string;
    likesCount: number;
    createdAt: number;
    updatedAt?: number;
}

// ========================================
// JOBS (Art Job Listings)
// ========================================

export type JobType = 'fulltime' | 'parttime' | 'freelance' | 'internship' | 'project' | 'commission';
export type JobCategory = 'illustration' | 'graphic_design' | 'animation' | 'game_art' | 'concept_art' | 'ui_ux' | 'photography' | 'video' | '3d' | 'other';
export type JobStatus = 'active' | 'paused' | 'closed' | 'expired';

export interface Job {
    id: string;
    
    // Employer Info
    companyName: string;
    companyLogo?: string;
    companyWebsite?: string;
    contactEmail: string;
    
    // Job Details
    title: string;
    description: string;
    type: JobType;
    category: JobCategory;
    
    // Requirements
    skills: string[];
    experienceLevel: 'entry' | 'mid' | 'senior' | 'any';
    
    // Location & Compensation
    location: string;
    isRemote: boolean;
    salary?: {
        min?: number;
        max?: number;
        currency: string;
        period: 'hour' | 'month' | 'year' | 'project';
    };
    
    // Status
    status: JobStatus;
    featured: boolean;
    
    // Dates
    createdAt: number;
    updatedAt?: number;
    expiresAt?: number;
    
    // Stats
    viewCount: number;
    applicationCount: number;
}

export type ListingStatus = 'pending' | 'approved' | 'available' | 'sold' | 'auction' | 'ended' | 'rejected';
export type ListingType = 'buy_now' | 'auction' | 'both';
export type ArtCategory = 'painting' | 'sculpture' | 'digital' | 'photography' | 'mixed' | 'crafts' | 'other';
export type Condition = 'new' | 'like_new' | 'good' | 'used';
export type Technique = 'oil' | 'acrylic' | 'watercolor' | 'digital' | 'sculpture' | 'mixed' | 'other';

export interface Bid {
    id: string;
    listingId: string;
    userId: string;
    amount: number;
    createdAt: number;
}

export interface Artwork {
    id: string;
    artistId: string;
    title: string;
    description: string;
    images: string[];
    price: number; // Buy now price or starting bid
    currency: string;
    dimensions: string; // Format: "HxWxD" or "HxW"
    technique: Technique;
    category: ArtCategory;
    year?: number;
    condition: Condition;
    listingType: ListingType;
    status: ListingStatus;
    
    // ========================================
    // STORY & PROVENANCE FEATURES
    // ========================================
    
    // Artist Story - Why this artwork was created
    artistStory?: string; // Max 1000 chars - "Warum hast du dieses Werk geschaffen?"
    
    // Video documentation
    videoUrl?: string; // YouTube/Vimeo link
    videoFile?: string; // Firebase Storage path (optional direct upload)
    
    // Process documentation - Behind the scenes photos
    processImages?: string[]; // 3-5 images showing creation process
    
    // Artist signature for certificates
    artistSignature?: string; // Signature image URL
    
    // Certificate info
    certificateId?: string; // Unique certificate ID (e.g., VARBE-00123)
    certificateIssued?: number; // Timestamp when certificate was issued
    
    // KI-free verification
    kiFreeVerified?: boolean; // Whether artwork passed KI-free verification
    
    // ========================================
    // GEO-LOCATION & LOCAL ART
    // ========================================
    
    // Precise location for geo-search
    geoLocation?: {
        latitude: number;
        longitude: number;
        geohash?: string; // For efficient geo-queries
    };
    
    // Pickup availability
    pickupAvailable?: boolean;
    pickupDetails?: string; // e.g., "Atelier in Bremen Neustadt"
    
    // Studio visit
    studioVisitAvailable?: boolean;
    studioVisitBookingUrl?: string; // Calendly/Doodle link
    studioVisitDetails?: string; // "Termine nach Vereinbarung"
    
    // ========================================
    // ADMIN & APPROVAL
    // ========================================
    
    // Admin approval
    adminApprovalStatus: 'pending' | 'approved' | 'rejected';
    adminApprovedAt?: number;
    adminApprovedBy?: string; // Admin UID
    adminRejectionReason?: string;
    
    // Featured on homepage
    featured?: boolean;
    featuredAt?: number;
    
    // Statistics
    views?: number; // View count
    favorites?: number; // Favorite count (cached)
    
    // Auction fields
    auctionEndTime?: number; // Timestamp
    currentBid?: number;
    minBidIncrement?: number;
    buyNowPrice?: number; // Optional buy now during auction
    
    // Shipping (legacy - kept for backward compatibility)
    shippingCost?: number;
    shippingType: 'shipping' | 'pickup' | 'free';
    
    // Shipping zones (new system)
    shippingZones?: {
        germany?: {
            enabled: boolean;
            cost: number; // 0 for free shipping
            estimatedDays?: string; // e.g., "1-3"
        };
        eu?: {
            enabled: boolean;
            cost: number;
            estimatedDays?: string; // e.g., "3-7"
        };
        europe?: { // Non-EU Europe (UK, Switzerland, Norway, etc.)
            enabled: boolean;
            cost: number;
            estimatedDays?: string; // e.g., "5-10"
        };
        worldwide?: {
            enabled: boolean;
            cost: number;
            estimatedDays?: string; // e.g., "7-21"
        };
        pickup?: {
            enabled: boolean;
            location?: string; // e.g., "Bremen, Germany"
        };
    };
    
    // Quantity (for multiple identical items, buy_now only)
    quantity?: number; // Default: 1
    
    // Digital art (buy_now only, no shipping)
    isDigital?: boolean;
    
    // Listing location (for pickup)
    location?: string; // City name, e.g., "Bremen, Bremen"
    
    // Package dimensions and weight for shipping (required for physical items)
    packageDimensions?: {
        length: number; // in cm
        width: number;  // in cm
        height: number; // in cm
    };
    packageWeight?: number; // in kg
    
    createdAt: number;
    updatedAt?: number;
}

export interface Order {
    id: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
    amount: number; // Total amount paid by buyer (including shipping)
    shippingCost?: number;
    shippingAddress?: {
        name: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
    };
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    stripePaymentIntentId?: string;
    quantity?: number; // Quantity purchased (default: 1)
    
    // Fee breakdown
    salePrice: number; // Price of artwork (excluding shipping)
    varbeFee?: number; // Varbe platform fee (10%, max 10€)
    stripeFee?: number; // Stripe processing fee (1.5% + 0.25€)
    artistEarnings?: number; // Amount artist will receive
    
    // Shipping tracking
    shippingType?: 'shipping' | 'pickup'; // From artwork
    trackingNumber?: string;
    trackingStatus?: 'pending' | 'approved' | 'rejected'; // Admin approval status for tracking
    trackingSubmittedAt?: number; // When artist submitted tracking
    trackingApprovedAt?: number; // When admin approved tracking
    trackingApprovedBy?: string; // Admin UID who approved
    trackingRejectionReason?: string; // Reason if rejected
    shippingProvider?: string; // DHL, Hermes, DPD, etc.
    shippedAt?: number; // Timestamp when order was shipped (set when tracking is approved)
    
    
    // AfterShip integration (for tracking validation and updates)
    aftershipTrackingId?: string; // AfterShip tracking ID
    trackingTag?: string; // AfterShip status tag: InTransit, Delivered, Exception, etc.
    trackingSubtag?: string; // AfterShip subtag for more details
    expectedDelivery?: number; // Expected delivery timestamp
    trackingCheckpoints?: Array<{
        message: string;
        location?: string;
        city?: string;
        zip?: string;
        country_name?: string;
        checkpoint_time: string;
        coordinates?: [number, number]; // [lat, lng]
        tag?: string;
    }>; // Tracking history/checkpoints from AfterShip
    paidAt?: number; // Timestamp when payment was confirmed
    shippingDeadline?: number; // Timestamp: paidAt + 5 business days
    shippingReminderSent?: boolean; // Day 3 reminder sent
    shippingWarningSent?: boolean; // Day 5 warning sent
    autoCancelledAt?: number; // Timestamp when auto-cancelled (day 6)
    
    // Pickup (Selbstabholung)
    pickupScheduledAt?: number; // Scheduled pickup date/time
    pickupCompletedAt?: number; // When pickup was completed (triggers buyer protection)
    
    // Buyer protection (14 days from delivery)
    deliveredAt?: number; // Timestamp when order was marked as delivered
    buyerProtectionEndsAt?: number; // Timestamp when buyer protection expires (deliveredAt + 14 days)
    buyerProtectionStatus?: 'active' | 'expired' | 'disputed' | 'refunded';
    
    // Dispute
    disputeStatus?: 'none' | 'disputed' | 'resolved';
    refundAmount?: number;
    refundedAt?: number;
    
    // Earnings status
    earningsStatus?: 'pending' | 'available' | 'released' | 'paid_out'; // pending = in buyer protection, available = can be paid out, released = protection ended, paid_out = already paid to artist
    
    createdAt: number;
    updatedAt?: number;
}

export interface SellerBalance {
    userId: string;
    availableBalance: number; // Can be paid out (buyer protection expired)
    pendingBalance: number; // In buyer protection (14 days)
    totalEarnings: number; // Total lifetime earnings
    lastPayoutAt?: number; // Last payout date
    nextPayoutDate?: number; // Next scheduled payout (15th of month)
}

export interface Payout {
    id: string;
    sellerId: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    payoutDate: number; // Scheduled date (15th of month)
    completedAt?: number;
    orderIds: string[]; // Orders included in this payout
    stripePayoutId?: string; // Stripe Connect payout ID
    createdAt: number;
}

export interface Report {
    id: string;
    listingId: string;
    reportedBy: string; // User ID
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewedBy?: string; // Admin UID
    reviewedAt?: number;
    createdAt: number;
}

export interface ContentReport {
    id: string;
    contentType: 'feed_post' | 'comment' | 'user' | 'artwork' | 'message';
    contentId: string;
    reportedBy: string; // User ID
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewedBy?: string; // Admin UID
    reviewedAt?: number;
    createdAt: number;
}

export interface Dispute {
    id: string;
    orderId: string;
    buyerId: string;
    artistId: string;
    reason: string; // 'not_received' | 'damaged' | 'not_as_described' | 'other'
    description: string;
    images?: string[];
    status: 'open' | 'under_review' | 'resolved' | 'closed';
    artistResponse?: string;
    artistEvidenceImages?: string[];
    adminDecision?: 'buyer_wins' | 'artist_wins' | 'partial_refund';
    adminNote?: string;
    refundPercentage?: number;
    resolvedAt?: number;
    resolvedBy?: string; // Admin UID
    createdAt: number;
    updatedAt?: number;
}

export interface Notification {
    id: string;
    userId: string;
    type: 
        // Order notifications
        | 'purchase_success' | 'tracking_submitted' | 'tracking_approved' | 'order_shipped' | 'order_delivered' | 'new_order' 
        // Auction notifications
        | 'highest_bidder' | 'outbid' 
        // Review & Dispute
        | 'please_review' | 'dispute_opened' | 'dispute_response' | 'dispute_resolved' 
        // Messages
        | 'new_message'
        // Chatroom notifications
        | 'chatroom_message'
        // Feed notifications (Phase 2)
        | 'new_follower' | 'post_liked' | 'post_commented' | 'new_post'
        // Commission notifications (Phase 2)
        | 'commission_application' | 'commission_accepted' | 'commission_rejected' | 'commission_completed'
        // Subscription notifications (Phase 2)
        | 'new_subscriber' | 'subscription_cancelled' | 'subscription_renewed';
    title: string;
    message: string;
    read: boolean;
    orderId?: string;
    listingId?: string;
    postId?: string;
    commissionId?: string;
    subscriptionId?: string;
    chatroomId?: string;
    link?: string;
    createdAt: number;
}

export interface Conversation {
    id: string;
    participants: string[]; // User IDs
    listingId?: string | null; // Optional: conversation about a specific listing
    lastMessageAt: number;
    createdAt: number;
    unreadCount: {
        [userId: string]: number;
    };
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    images?: string[];
    read: boolean;
    createdAt: number;
}

export interface SavedAddress {
    id: string;
    userId: string;
    label: string; // e.g., "Home", "Work"
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
    createdAt: number;
}

export interface Review {
    id: string;
    artistId: string; // The artist being reviewed
    buyerId: string; // The buyer who wrote the review
    orderId: string; // The order that was delivered
    rating: number; // 1-5 stars
    comment?: string; // Optional text review
    createdAt: number;
    updatedAt?: number;
}

// ========================================
// PHASE 2: SOCIAL FEED
// ========================================

export type FeedPostType = 'artwork' | 'update' | 'sketch' | 'thought' | 'process' | 'announcement';

export interface FeedPost {
    id: string;
    artistId: string;
    type: FeedPostType;
    
    // Content
    text: string; // Caption/post text
    images?: string[]; // 1-5 images
    video?: string; // Optional video URL
    
    // Link to listing (if shoppable)
    linkedListingId?: string;
    linkedListing?: {
        id: string;
        title: string;
        price: number;
        image: string;
        status: ListingStatus;
    };
    
    // Interactions (cached counts for performance)
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    
    // Visibility
    featured?: boolean; // Admin can feature posts
    visibility: 'public' | 'followers' | 'subscribers';
    
    // Tags/Hashtags
    tags?: string[];
    
    // Moderation
    moderationStatus?: 'approved' | 'pending' | 'pending_review' | 'rejected';
    moderationScores?: {
        aiScore?: number;
        explicitScore?: number;
        violenceScore?: number;
        toxicityScore?: number;
        spamScore?: number;
    };
    moderationReasons?: string[]; // Reasons for flagging
    needsAdminReview?: boolean; // Flag for admin dashboard
    
    createdAt: number;
    updatedAt?: number;
}

export interface FeedLike {
    id: string;
    postId: string;
    userId: string;
    createdAt: number;
}

export interface FeedComment {
    id: string;
    postId: string;
    userId: string;
    text: string;
    parentCommentId?: string; // For replies
    likesCount?: number;
    createdAt: number;
    updatedAt?: number;
}

export interface Follow {
    id: string;
    followerId: string; // User who is following
    followingId: string; // Artist being followed
    notifyOnPost?: boolean; // Get notifications for new posts
    createdAt: number;
}

// Repost (like Twitter's retweet)
export interface FeedRepost {
    id: string;
    originalPostId: string;
    userId: string; // User who reposted
    comment?: string; // Quote repost comment
    createdAt: number;
    
    // Populated fields (for display)
    originalPost?: FeedPost;
    user?: UserProfile;
}

// Combined feed item (can be a post or a repost)
export interface FeedItem {
    id: string;
    type: 'post' | 'repost';
    createdAt: number;
    
    // For regular posts
    post?: FeedPost;
    
    // For reposts
    repost?: FeedRepost;
}

// ========================================
// PHASE 2: KOMMISSIONSBÖRSE (Commission Market)
// ========================================

export type CommissionStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface Commission {
    id: string;
    buyerId: string; // User who posted the request
    
    // Request details
    title: string;
    description: string;
    category: ArtCategory;
    technique?: Technique; // Preferred technique (optional)
    dimensions?: {
        width: number;
        height: number;
        unit: 'cm' | 'inch';
    };
    
    // Budget
    budget: {
        min: number;
        max: number;
        currency: string;
    };
    
    // Timeline
    deadline?: string; // e.g., "4 Wochen", "flexibel", "bis Ende Januar"
    deadlineDate?: number; // Specific deadline timestamp
    
    // Reference images
    referenceImages?: string[];
    
    // Status
    status: CommissionStatus;
    
    // Applications
    applicationsCount: number;
    maxApplications?: number; // Default 10
    
    // Selected artist
    selectedArtistId?: string;
    selectedApplicationId?: string;
    
    // Final details (after artist selected)
    agreedPrice?: number;
    agreedDeadline?: number;
    
    // Timestamps
    createdAt: number;
    updatedAt?: number;
    expiresAt?: number; // Auto-close after 30 days
}

export interface CommissionApplication {
    id: string;
    commissionId: string;
    artistId: string;
    
    // Proposal
    proposedPrice: number;
    proposedTimeline: string; // e.g., "3 Wochen"
    message: string; // Personal message to buyer
    portfolioLinks?: string[]; // Links to similar works
    
    // Status
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    
    // Response from buyer
    buyerResponse?: string;
    
    createdAt: number;
    updatedAt?: number;
}

// ========================================
// PHASE 2: ABO-MODELLE (Subscriptions)
// ========================================

export type SubscriptionTier = 'fan' | 'supporter' | 'patron';

export interface ArtistSubscriptionTier {
    id: string;
    artistId: string;
    
    tier: SubscriptionTier;
    name: string; // Custom name, e.g., "Super Fan"
    price: number; // Monthly price in EUR
    
    // Benefits
    benefits: string[];
    
    // Digital rewards
    monthlyDrops?: boolean; // Monthly digital art drops
    earlyAccess?: boolean; // Early access to new works
    discountPercent?: number; // Discount on purchases
    exclusiveContent?: boolean; // Access to subscriber-only posts
    
    // Personal perks
    monthlyPrint?: boolean; // Physical print shipped monthly (Patron tier)
    videoCall?: boolean; // Quarterly video call (Patron tier)
    
    // Status
    isActive: boolean;
    subscriberCount?: number; // Cached count
    
    // Stripe
    stripePriceId?: string;
    stripeProductId?: string;
    
    createdAt: number;
    updatedAt?: number;
}

export interface Subscription {
    id: string;
    
    // Parties
    subscriberId: string; // Fan/supporter
    artistId: string;
    tierId: string;
    
    // Subscription details
    tier: SubscriptionTier;
    price: number;
    
    // Status
    status: 'active' | 'cancelled' | 'past_due' | 'paused';
    
    // Billing
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd?: boolean;
    
    // Stripe
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    
    // History
    subscribedAt: number;
    cancelledAt?: number;
    
    createdAt: number;
    updatedAt?: number;
}

export interface SubscriptionPayment {
    id: string;
    subscriptionId: string;
    subscriberId: string;
    artistId: string;
    
    amount: number;
    varbeFee: number; // 8% platform fee
    artistEarnings: number; // Amount artist receives
    
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    
    stripePaymentIntentId?: string;
    
    createdAt: number;
}

// ========================================
// BLOG SYSTEM
// ========================================

export type BlogCategory = 'tutorial' | 'news' | 'artist_spotlight' | 'community' | 'tips' | 'announcement';
export type BlogLanguage = 'de' | 'en';

export interface BlogPost {
    id: string;
    authorId: string; // Artist/Admin UID
    
    // Content
    title: string;
    slug: string; // URL-friendly slug
    excerpt: string; // Short description for cards
    content: string; // Markdown content
    coverImage?: string; // Cover image URL
    language: BlogLanguage; // de or en
    
    // Metadata
    category: BlogCategory;
    tags?: string[];
    readTimeMinutes: number; // Estimated read time
    
    // Status
    status: 'draft' | 'published' | 'archived';
    publishedAt?: number;
    
    // Stats
    views?: number;
    likesCount?: number;
    
    // SEO
    metaTitle?: string;
    metaDescription?: string;
    
    createdAt: number;
    updatedAt?: number;
}

// ========================================
// LOCAL / ART RADAR
// ========================================

export type ArtistMedium = 'digital' | 'traditional' | 'photography' | 'illustration' | 'sculpture' | 'mixed';

export interface LocalArtist {
    id: string;
    userId: string; // Reference to user document
    displayName: string;
    artistName?: string;
    bio?: string;
    medium: ArtistMedium;
    profilePictureUrl?: string;
    
    // Location
    location: {
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    
    // Availability
    openForCommissions: boolean;
    openStudio: boolean;
    openForCollabs: boolean;
    studioHours?: string; // e.g., "Fridays 2-6pm"
    
    // Stats
    followersCount: number;
    artworksCount: number;
    
    // Status
    availableForMeetup?: boolean;
    meetupMessage?: string; // e.g., "Available for coffee this week"
    
    // Preview artworks
    featuredArtworks?: string[]; // Up to 6 artwork URLs
    
    createdAt: number;
    updatedAt?: number;
}

export type EventCategory = 'art_walk' | 'exhibition' | 'open_studio' | 'workshop' | 'meetup' | 'market';

export interface LocalEvent {
    id: string;
    hostId: string; // User ID of host
    hostName: string;
    hostProfilePicture?: string; // Host profile picture URL
    
    // Event details
    title: string;
    description: string;
    category: EventCategory;
    imageUrl?: string;
    
    // Date & Time
    date: number; // Timestamp
    startTime: string; // "18:00"
    endTime: string; // "22:00"
    
    // Location
    location: {
        name: string; // e.g., "Kunstquartier Bremen"
        address: string;
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    
    // Details
    freeEntry: boolean;
    price?: number;
    featured: boolean;
    
    // Registrations (Anmeldungen)
    attendeesCount: number;
    attendees: string[]; // User IDs
    maxAttendees?: number;
    
    // Participating artists
    artistsCount: number;
    participatingArtists: string[]; // User IDs
    
    // Timeline posts from organizer
    postsCount?: number;
    
    createdAt: number;
    updatedAt?: number;
}

// Event Timeline Post (from organizer)
export interface EventPost {
    id: string;
    eventId: string;
    authorId: string; // Should be the event host
    
    // Content
    text: string;
    images?: string[];
    
    // Interactions
    likesCount: number;
    commentsCount: number;
    
    // Pinned post (important announcement)
    isPinned?: boolean;
    
    createdAt: number;
    updatedAt?: number;
}

// Comment on Event Post (only from registered attendees)
export interface EventComment {
    id: string;
    postId: string;
    eventId: string;
    userId: string;
    
    text: string;
    likesCount?: number;
    
    // Reply to another comment
    parentCommentId?: string;
    
    createdAt: number;
    updatedAt?: number;
}

// ========================================
// CHALLENGES / ART JAMS
// ========================================

export type ChallengeType = 'daily' | 'weekly';
export type ChallengeStatus = 'active' | 'ended';

export interface Challenge {
    id: string;
    
    // Basic info
    title: string;
    prompt: string;
    type: ChallengeType;
    emoji: string; // Emoji for the challenge
    
    // Rotation index (0-6 for daily, 0-3 for weekly)
    rotationIndex: number;
    
    // Dates
    startDate: number;
    endDate: number;
    
    // Status
    status: ChallengeStatus;
    
    // Stats
    submissionsCount: number;
    participantsCount: number;
    
    // Winner (after ended)
    winnerId?: string;
    winnerSubmissionId?: string;
    winnerUsername?: string;
    
    createdAt: number;
    updatedAt?: number;
}

export interface ChallengeSubmission {
    id: string;
    challengeId: string;
    challengeType: ChallengeType;
    artistId: string;
    artistUsername?: string;
    artistProfilePicture?: string;
    
    // Submission content
    imageUrl: string;
    caption?: string;
    
    // Voting (Likes)
    likesCount: number;
    likedBy: string[]; // User IDs who liked
    
    // Comments count (cached)
    commentsCount: number;
    
    // Rank (calculated)
    rank?: number;
    
    // Status
    isWinner?: boolean;
    
    createdAt: number;
    updatedAt?: number;
}

// Comment on a submission
export interface SubmissionComment {
    id: string;
    submissionId: string;
    challengeId: string;
    userId: string;
    username?: string;
    profilePicture?: string;
    
    text: string;
    
    createdAt: number;
    updatedAt?: number;
}

export interface ChallengeParticipant {
    id: string;
    challengeId: string;
    userId: string;

    // Status
    submitted: boolean;
    submissionId?: string;
    
    createdAt: number;
}

// Challenge Badge Types
export type ChallengeBadgeId = 
    // Participation badges
    | 'participant_10'      // 🎯 10 Challenges teilgenommen
    | 'participant_20'      // 🎯 20 Challenges teilgenommen
    | 'participant_50'      // 🎯 50 Challenges teilgenommen
    | 'participant_100'     // 🎯 100 Challenges teilgenommen
    // Winner badges
    | 'winner_1'            // 🏆 Erste Challenge gewonnen
    | 'winner_10'           // 🏆 10 Challenges gewonnen
    | 'winner_20'           // 🏆 20 Challenges gewonnen
    | 'winner_50'           // 🏆 50 Challenges gewonnen
    | 'winner_100'          // 🏆 100 Challenges gewonnen
    // Special badges
    | 'daily_streak_7'      // 🔥 7 Tage in Folge
    | 'weekly_streak_4';    // 💪 4 Wochen in Folge

export interface ChallengeBadge {
    id: ChallengeBadgeId;
    name: string;
    emoji: string;
    description: string;
    requirement: number;
    type: 'participation' | 'winner' | 'streak';
}

// All available challenge badges
export const CHALLENGE_BADGES: ChallengeBadge[] = [
    // Participation
    { id: 'participant_10', name: 'Starter', emoji: '🎯', description: '10 Challenges teilgenommen', requirement: 10, type: 'participation' },
    { id: 'participant_20', name: 'Regular', emoji: '🎯', description: '20 Challenges teilgenommen', requirement: 20, type: 'participation' },
    { id: 'participant_50', name: 'Dedicated', emoji: '🎯', description: '50 Challenges teilgenommen', requirement: 50, type: 'participation' },
    { id: 'participant_100', name: 'Veteran', emoji: '🎯', description: '100 Challenges teilgenommen', requirement: 100, type: 'participation' },
    // Winner
    { id: 'winner_1', name: 'First Win', emoji: '🏆', description: 'Erste Challenge gewonnen', requirement: 1, type: 'winner' },
    { id: 'winner_10', name: 'Champion', emoji: '🏆', description: '10 Challenges gewonnen', requirement: 10, type: 'winner' },
    { id: 'winner_20', name: 'Master', emoji: '🏆', description: '20 Challenges gewonnen', requirement: 20, type: 'winner' },
    { id: 'winner_50', name: 'Legend', emoji: '🏆', description: '50 Challenges gewonnen', requirement: 50, type: 'winner' },
    { id: 'winner_100', name: 'God Mode', emoji: '👑', description: '100 Challenges gewonnen', requirement: 100, type: 'winner' },
    // Streak
    { id: 'daily_streak_7', name: '7-Day Streak', emoji: '🔥', description: '7 Tage in Folge teilgenommen', requirement: 7, type: 'streak' },
    { id: 'weekly_streak_4', name: 'Month Warrior', emoji: '💪', description: '4 Wochen in Folge teilgenommen', requirement: 4, type: 'streak' },
];

export interface UserChallengeStats {
    id: string;
    userId: string;
    
    // Stats
    totalParticipations: number;
    totalWins: number;
    totalLikesReceived: number;
    
    // Streaks
    currentDailyStreak: number;
    longestDailyStreak: number;
    currentWeeklyStreak: number;
    longestWeeklyStreak: number;
    lastDailyParticipation?: number; // timestamp
    lastWeeklyParticipation?: number; // timestamp
    
    // Badges earned
    badges: ChallengeBadgeId[];
    
    // Recent participations (for profile display)
    recentChallenges: {
        challengeId: string;
        challengeTitle: string;
        challengeType: ChallengeType;
        submissionId: string;
        imageUrl: string;
        isWinner: boolean;
        likesCount: number;
        createdAt: number;
    }[];
    
    createdAt: number;
    updatedAt?: number;
}

// Predefined Daily Challenges (rotate every day)
export const DAILY_CHALLENGES = [
    { title: "Quick Sketch", prompt: "Zeichne in 30 Minuten etwas aus deiner Umgebung", emoji: "✏️", rotationIndex: 0 },
    { title: "Character Design", prompt: "Erstelle einen Charakter basierend auf einem Tier deiner Wahl", emoji: "🐾", rotationIndex: 1 },
    { title: "Color Study", prompt: "Male ein Bild nur mit 3 Farben deiner Wahl", emoji: "🎨", rotationIndex: 2 },
    { title: "Emotion", prompt: "Zeige eine Emotion ohne ein Gesicht zu zeichnen", emoji: "💫", rotationIndex: 3 },
    { title: "Food Art", prompt: "Zeichne dein Lieblingsessen so lecker wie möglich", emoji: "🍕", rotationIndex: 4 },
    { title: "Nature Sketch", prompt: "Skizziere etwas aus der Natur - Pflanze, Tier oder Landschaft", emoji: "🌿", rotationIndex: 5 },
    { title: "Object Study", prompt: "Wähle einen Alltagsgegenstand und zeichne ihn detailliert", emoji: "🔍", rotationIndex: 6 },
];

// Predefined Weekly Challenges (rotate every week)
export const WEEKLY_CHALLENGES = [
    { title: "Mythical Creature", prompt: "Erschaffe ein eigenes mythisches Wesen - kombiniere Elemente aus verschiedenen Kulturen oder erfinde etwas völlig Neues", emoji: "🐉", rotationIndex: 0 },
    { title: "Alternate Universe", prompt: "Stelle einen bekannten Ort (deine Stadt, ein berühmtes Gebäude) in einem alternativen Universum dar - Steampunk, Cyberpunk, Fantasy...", emoji: "🌌", rotationIndex: 1 },
    { title: "Story in One Image", prompt: "Erzähle eine komplette Geschichte in einem einzigen Bild - mit Anfang, Mitte und Ende", emoji: "📖", rotationIndex: 2 },
    { title: "Portrait Challenge", prompt: "Erstelle ein ausdrucksstarkes Portrait - Selbstportrait, Fantasy-Charakter oder eine reale Person", emoji: "🖼️", rotationIndex: 3 },
];

// ========================================
// CHATROOMS (Knuddels-Style Chat)
// ========================================

export type ChatroomCategory = 
    | 'general'         // Allgemeiner Chat
    | 'illustration'    // Illustration & Drawing
    | 'digital_art'     // Digital Art & Design
    | 'traditional'     // Traditional Art
    | 'photography'     // Fotografie
    | 'animation'       // Animation & Motion
    | 'concept_art'     // Concept Art & Game Art
    | 'subculture'      // Subkultur & Szene
    | 'business'        // Business & Freelance
    | 'critique'        // Feedback & Kritik
    | 'collab';         // Kollaborationen

export type ChatroomRegion = 
    | 'global'          // 🌍 International (English)
    | 'de'              // 🇩🇪 Deutschland
    | 'at'              // 🇦🇹 Österreich
    | 'ch'              // 🇨🇭 Schweiz
    | 'us'              // 🇺🇸 USA
    | 'uk'              // 🇬🇧 UK
    | 'fr'              // 🇫🇷 Frankreich
    | 'es'              // 🇪🇸 Spanien
    | 'it'              // 🇮🇹 Italien
    | 'nl'              // 🇳🇱 Niederlande
    | 'pl';             // 🇵🇱 Polen

export interface Chatroom {
    id: string;
    name: string;
    description: string;
    category: ChatroomCategory;
    region: ChatroomRegion;
    
    // Room settings
    emoji: string;           // Room icon emoji
    color: string;           // Theme color (hex)
    isActive: boolean;
    isPinned?: boolean;      // Featured/pinned rooms
    isModerated?: boolean;   // Has active moderation
    
    // Stats
    membersCount: number;    // Total members
    onlineCount: number;     // Currently online
    messagesCount: number;   // Total messages
    
    // Timestamps
    lastMessageAt?: number;
    createdAt: number;
    updatedAt?: number;
    
    // Creator (for user-created rooms)
    createdBy?: string;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    userId: string;
    
    // Content
    text: string;
    
    // Message type
    type: 'text' | 'image' | 'system' | 'emote';
    imageUrl?: string;
    
    // Reactions (emoji counts)
    reactions?: Record<string, string[]>; // emoji -> array of user IDs
    
    // Metadata
    isEdited?: boolean;
    replyTo?: string;        // Message ID being replied to
    
    // Timestamps
    createdAt: number;
    updatedAt?: number;
}

export interface ChatroomMember {
    id: string;
    roomId: string;
    userId: string;
    
    // Status
    isOnline: boolean;
    lastSeenAt: number;
    joinedAt: number;
    
    // Role in this room
    role: 'member' | 'moderator' | 'owner';
    
    // Preferences
    isMuted?: boolean;       // User muted the room
    notificationsEnabled?: boolean;
}

// ========================================
// CONTENT MODERATION SYSTEM
// ========================================

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'auto_blocked';
export type ModerationContentType = 'image' | 'text' | 'profile_picture' | 'banner' | 'artwork' | 'feed_post' | 'comment' | 'chat_message' | 'dm';
export type ModerationReason = 
    | 'ai_generated'           // AI-generated content detected
    | 'explicit_content'       // Adult/explicit content
    | 'violence'               // Violent content
    | 'hate_speech'            // Hate speech or discrimination
    | 'harassment'             // Harassment or bullying
    | 'spam'                   // Spam or repetitive content
    | 'copyright'              // Potential copyright violation
    | 'impersonation'          // Impersonation
    | 'misinformation'         // False information
    | 'self_harm'              // Self-harm content (OpenAI category)
    | 'illicit'                // Instructions for illegal acts (OpenAI category)
    | 'other';                 // Other violation

export interface ModerationResult {
    passed: boolean;
    status: ModerationStatus;
    reasons: ModerationReason[];
    scores: {
        aiScore?: number;          // 0-1, AI-generated probability
        explicitScore?: number;    // 0-1, explicit content probability
        violenceScore?: number;    // 0-1, violence probability
        toxicityScore?: number;    // 0-1, text toxicity
        spamScore?: number;        // 0-1, spam probability
    };
    details?: string;
    requiresReview?: boolean;
    reviewPriority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ModerationQueueItem {
    id: string;
    contentType: ModerationContentType;
    contentId: string;              // ID of the content (postId, commentId, etc.)
    contentPreview?: string;        // Text preview or image URL
    userId: string;                 // User who created the content
    
    // Moderation details
    status: ModerationStatus;
    reasons: ModerationReason[];
    scores: ModerationResult['scores'];
    
    // Auto-detection flags
    aiDetectionScore?: number;
    explicitContentScore?: number;
    toxicityScore?: number;
    
    // Review info
    reviewedBy?: string;            // Admin UID
    reviewedAt?: number;
    reviewNotes?: string;
    decision?: 'approve' | 'reject' | 'escalate';
    
    // User reports (if any)
    reportCount?: number;
    reportReasons?: ModerationReason[];
    reporters?: string[];           // User IDs who reported
    
    // Appeal info
    appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
    appealReason?: string;
    appealedAt?: number;
    appealReviewedBy?: string;
    appealReviewedAt?: number;
    
    // Timestamps
    createdAt: number;
    updatedAt?: number;
}

export interface ContentReport {
    id: string;
    contentType: ModerationContentType;
    contentId: string;
    reportedBy: string;             // User ID who reported
    reason: ModerationReason;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewedBy?: string;
    reviewedAt?: number;
    action?: 'none' | 'warning' | 'content_removed' | 'user_banned';
    createdAt: number;
}

export interface UserModerationHistory {
    id: string;
    userId: string;
    
    // Strike system
    strikes: number;                // Current strike count
    lastStrikeAt?: number;
    strikeHistory: Array<{
        reason: ModerationReason;
        contentId: string;
        contentType: ModerationContentType;
        issuedAt: number;
        issuedBy: string;           // Admin UID
        expiresAt?: number;         // Strikes can expire
    }>;
    
    // Ban info
    isBanned: boolean;
    banType?: 'temporary' | 'permanent';
    banReason?: string;
    bannedAt?: number;
    bannedBy?: string;
    banExpiresAt?: number;
    
    // Warnings
    warningCount: number;
    lastWarningAt?: number;
    
    // Stats
    totalContentRemoved: number;
    totalReportsAgainst: number;
    totalFalseReports: number;      // Reports made by this user that were false
    
    createdAt: number;
    updatedAt?: number;
}

export interface ModerationSettings {
    // AI Detection thresholds
    aiThreshold: number;            // 0-1, block if above (default: 0.7)
    aiWarningThreshold: number;     // 0-1, flag for review if above (default: 0.5)
    
    // Explicit content thresholds
    explicitThreshold: number;      // Block threshold (default: 0.8)
    explicitWarningThreshold: number; // Review threshold (default: 0.6)
    
    // Violence thresholds
    violenceThreshold: number;
    violenceWarningThreshold: number;
    
    // Toxicity thresholds
    toxicityThreshold: number;      // Block threshold (default: 0.8)
    toxicityWarningThreshold: number; // Review threshold (default: 0.6)
    
    // Spam settings
    maxCommentsPerMinute: number;   // Rate limit (default: 10)
    maxPostsPerHour: number;        // Rate limit (default: 5)
    duplicateThreshold: number;     // How similar texts are considered spam
    
    // Strike system
    strikesBeforeWarning: number;   // (default: 1)
    strikesBeforeTempBan: number;   // (default: 2)
    strikesBeforePermaBan: number;  // (default: 3)
    tempBanDurationDays: number;    // (default: 7)
    strikeExpirationDays: number;   // (default: 90)
    
    // Auto-moderation
    autoBlockEnabled: boolean;
    autoApproveVerifiedArtists: boolean;
    requireApprovalForNewUsers: boolean;
    newUserThresholdDays: number;   // How many days until user is not "new"
}

// Default moderation settings
export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
    aiThreshold: 0.7,
    aiWarningThreshold: 0.5,
    explicitThreshold: 0.8,
    explicitWarningThreshold: 0.6,
    violenceThreshold: 0.8,
    violenceWarningThreshold: 0.6,
    toxicityThreshold: 0.8,
    toxicityWarningThreshold: 0.6,
    maxCommentsPerMinute: 10,
    maxPostsPerHour: 5,
    duplicateThreshold: 0.9,
    strikesBeforeWarning: 1,
    strikesBeforeTempBan: 2,
    strikesBeforePermaBan: 3,
    tempBanDurationDays: 7,
    strikeExpirationDays: 90,
    autoBlockEnabled: true,
    autoApproveVerifiedArtists: true,
    requireApprovalForNewUsers: false,
    newUserThresholdDays: 7,
};
