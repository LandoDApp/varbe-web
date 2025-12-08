/**
 * VARBE Content Moderation System
 * 
 * Comprehensive moderation for:
 * - AI-generated art detection (critical for Varbe's anti-AI stance)
 * - Explicit/inappropriate content detection
 * - Toxicity detection in text
 * - Spam prevention
 * - Community reporting
 */

import { db, storage } from "./firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp
} from "firebase/firestore";
import { ref, getDownloadURL, deleteObject } from "firebase/storage";
import {
    ModerationResult,
    ModerationQueueItem,
    ContentReport,
    UserModerationHistory,
    ModerationSettings,
    ModerationStatus,
    ModerationContentType,
    ModerationReason,
    DEFAULT_MODERATION_SETTINGS
} from "@/types";

// ========================================
// CONFIGURATION
// ========================================

// API Keys should be stored in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const HIVE_API_KEY = process.env.HIVE_API_KEY || '';
const GOOGLE_CLOUD_VISION_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY || '';

// Cache for rate limiting
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const textHashCache = new Map<string, { hash: string; count: number; lastSeen: number }>();

// ========================================
// AI DETECTION (Hive API)
// ========================================

/**
 * Check if an image is AI-generated using Hive AI Detection
 * Returns a score from 0-1 where higher means more likely AI-generated
 */
export async function checkAIContent(imageUrl: string): Promise<number> {
    if (!HIVE_API_KEY) {
        // API key not available on client side (expected) - AI detection will be skipped
        if (typeof window === 'undefined') {
            console.warn('[Moderation] Hive API key not configured, skipping AI detection');
        }
        return 0;
    }

    try {
        const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${HIVE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: imageUrl,
            }),
        });

        if (!response.ok) {
            console.error('[Moderation] Hive API error:', response.status);
            return 0;
        }

        const data = await response.json();
        
        // Hive returns an array of outputs, look for AI detection
        const aiOutput = data.status?.[0]?.response?.output;
        if (aiOutput) {
            // Find the AI-generated class score
            for (const output of aiOutput) {
                if (output.class === 'ai_generated') {
                    return output.score || 0;
                }
            }
        }

        return 0;
    } catch (error) {
        console.error('[Moderation] AI detection error:', error);
        return 0;
    }
}

/**
 * Alternative: Check with Illuminarty API
 */
export async function checkAIContentIlluminarty(imageUrl: string): Promise<number> {
    // Illuminarty API implementation
    // This is a backup/alternative to Hive
    try {
        const response = await fetch('https://api.illuminarty.ai/v1/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.ILLUMINARTY_API_KEY || '',
            },
            body: JSON.stringify({ image_url: imageUrl }),
        });

        if (!response.ok) return 0;

        const data = await response.json();
        return data.ai_probability || 0;
    } catch (error) {
        console.error('[Moderation] Illuminarty error:', error);
        return 0;
    }
}

// ========================================
// EXPLICIT CONTENT DETECTION (Google Cloud Vision)
// ========================================

interface SafeSearchResult {
    adult: number;
    violence: number;
    racy: number;
    medical: number;
    spoof: number;
}

/**
 * Check image for explicit content using Google Cloud Vision OR OpenAI (fallback)
 * OpenAI's omni-moderation-latest model can also analyze images!
 */
export async function checkExplicitContent(imageUrl: string): Promise<SafeSearchResult> {
    // Try Google Cloud Vision first if available
    if (GOOGLE_CLOUD_VISION_KEY) {
        try {
            const response = await fetch(
                `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [{
                            image: { source: { imageUri: imageUrl } },
                            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
                        }],
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                const safeSearch = data.responses?.[0]?.safeSearchAnnotation;

                if (safeSearch) {
                    // Convert likelihood strings to scores
                    const likelihoodToScore = (likelihood: string): number => {
                        const scores: Record<string, number> = {
                            'VERY_UNLIKELY': 0.0,
                            'UNLIKELY': 0.2,
                            'POSSIBLE': 0.5,
                            'LIKELY': 0.8,
                            'VERY_LIKELY': 1.0,
                        };
                        return scores[likelihood] || 0;
                    };

                    return {
                        adult: likelihoodToScore(safeSearch.adult),
                        violence: likelihoodToScore(safeSearch.violence),
                        racy: likelihoodToScore(safeSearch.racy),
                        medical: likelihoodToScore(safeSearch.medical),
                        spoof: likelihoodToScore(safeSearch.spoof),
                    };
                }
            } else {
                console.error('[Moderation] Cloud Vision error:', response.status);
            }
        } catch (error) {
            console.error('[Moderation] Cloud Vision check error:', error);
        }
    }

    // Fallback to OpenAI if Cloud Vision not available or failed
    if (OPENAI_API_KEY) {
        console.log('[Moderation] Using OpenAI for image moderation (Cloud Vision not available)');
        try {
            const response = await fetch('https://api.openai.com/v1/moderations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'omni-moderation-latest',
                    input: [{ type: 'image_url', image_url: { url: imageUrl } }],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const result = data.results?.[0];

                if (result) {
                    const scores = result.category_scores;
                    console.log('[Moderation] OpenAI image scores:', {
                        sexual: scores.sexual,
                        violence: scores.violence,
                        'violence/graphic': scores['violence/graphic'],
                    });

                    return {
                        adult: scores.sexual || 0,
                        violence: scores.violence || 0,
                        racy: Math.max(scores.sexual || 0, scores['sexual/minors'] || 0),
                        medical: scores['violence/graphic'] || 0,
                        spoof: 0,
                    };
                }
            } else {
                const errorText = await response.text();
                console.error('[Moderation] OpenAI image check error:', response.status, errorText);
            }
        } catch (error) {
            console.error('[Moderation] OpenAI image check error:', error);
        }
    }

    console.warn('[Moderation] No image moderation API configured! Images will not be checked.');
    return { adult: 0, violence: 0, racy: 0, medical: 0, spoof: 0 };
}

// ========================================
// TOXICITY DETECTION (OpenAI Moderation API - FREE!)
// ========================================

interface ToxicityResult {
    toxicity: number;          // General harassment/hate combined score
    severeToxicity: number;    // Threatening content
    identityAttack: number;    // Hate speech
    insult: number;            // Harassment
    profanity: number;         // Not directly supported, use harassment
    threat: number;            // Violence score
    // Additional OpenAI categories
    sexual: number;
    selfHarm: number;
    illicit: number;
}

/**
 * OpenAI Moderation API Response types
 */
interface OpenAIModerationResult {
    id: string;
    model: string;
    results: Array<{
        flagged: boolean;
        categories: {
            sexual: boolean;
            'sexual/minors': boolean;
            harassment: boolean;
            'harassment/threatening': boolean;
            hate: boolean;
            'hate/threatening': boolean;
            illicit: boolean;
            'illicit/violent': boolean;
            'self-harm': boolean;
            'self-harm/intent': boolean;
            'self-harm/instructions': boolean;
            violence: boolean;
            'violence/graphic': boolean;
        };
        category_scores: {
            sexual: number;
            'sexual/minors': number;
            harassment: number;
            'harassment/threatening': number;
            hate: number;
            'hate/threatening': number;
            illicit: number;
            'illicit/violent': number;
            'self-harm': number;
            'self-harm/intent': number;
            'self-harm/instructions': number;
            violence: number;
            'violence/graphic': number;
        };
    }>;
}

// Simple keyword-based fallback filter (works without OpenAI API)
const TOXIC_KEYWORDS = [
    // German slurs and insults
    'hurensohn', 'wichser', 'arschloch', 'scheiße', 'fick dich', 'ficker',
    'spast', 'behindert', 'missgeburt', 'schwuchtel', 'schwul', 'fotze',
    'hure', 'nutte', 'penner', 'vollidiot', 'drecksau', 'bastard',
    // English slurs and insults  
    'fuck you', 'fucking', 'bitch', 'asshole', 'shit', 'cunt', 'whore',
    'faggot', 'nigger', 'retard', 'kill yourself', 'kys', 'die',
    // Threats
    'ich bring dich um', 'ich werde dich', 'stirb', 'du sollst sterben',
    'i will kill', 'threat', 'bomb',
    // Hate speech markers
    'nazi', 'heil hitler', 'sieg heil', 'white power', 'ausländer raus',
];

const SPAM_PATTERNS = [
    /(.)\1{5,}/i,           // Repeated characters (aaaaaaa)
    /https?:\/\/[^\s]{50,}/i,  // Very long URLs (potential spam)
    /buy now|click here|free money|casino|lottery/i,  // Spam keywords
];

function keywordBasedModeration(text: string): ToxicityResult {
    const lowerText = text.toLowerCase();
    let toxicity = 0;
    let severeToxicity = 0;
    let threat = 0;
    let identityAttack = 0;
    let profanity = 0;
    
    for (const keyword of TOXIC_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            toxicity = Math.max(toxicity, 0.8);
            profanity = Math.max(profanity, 0.7);
            
            // Severe content
            if (['nigger', 'faggot', 'kill yourself', 'kys', 'nazi', 'heil hitler', 'ich bring dich um', 'i will kill'].some(k => lowerText.includes(k))) {
                severeToxicity = 0.9;
            }
            // Threats
            if (['kill', 'sterben', 'umbringen', 'threat', 'bomb'].some(k => lowerText.includes(k))) {
                threat = 0.8;
            }
            // Hate speech
            if (['nazi', 'heil', 'nigger', 'white power', 'ausländer raus'].some(k => lowerText.includes(k))) {
                identityAttack = 0.9;
            }
        }
    }
    
    // Check spam patterns
    let spamScore = 0;
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(text)) {
            spamScore = 0.7;
            break;
        }
    }
    
    return {
        toxicity,
        severeToxicity,
        identityAttack,
        insult: profanity > 0 ? 0.6 : 0,
        profanity,
        threat,
        sexual: 0, // Can't detect without AI
        selfHarm: severeToxicity > 0 ? 0.5 : 0, // Estimate based on severity
        illicit: 0,
    };
}

/**
 * Check text for toxicity using OpenAI Moderation API (FREE!)
 * Uses omni-moderation-latest model for best results
 * Falls back to keyword-based moderation if API key is not configured
 */
export async function checkToxicity(text: string, language: string = 'de'): Promise<ToxicityResult> {
    if (!OPENAI_API_KEY) {
        // API key not available - use keyword-based fallback moderation
        if (typeof window === 'undefined') {
            console.warn('[Moderation] OpenAI API key not configured - using keyword-based fallback');
        }
        return keywordBasedModeration(text);
    }

    // Skip very short texts
    if (text.length < 3) {
        return { 
            toxicity: 0, severeToxicity: 0, identityAttack: 0, 
            insult: 0, profanity: 0, threat: 0,
            sexual: 0, selfHarm: 0, illicit: 0
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'omni-moderation-latest',
                input: text,
            }),
        });

        if (!response.ok) {
            console.error('[Moderation] OpenAI Moderation API error:', response.status);
            return { 
                toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                insult: 0, profanity: 0, threat: 0,
                sexual: 0, selfHarm: 0, illicit: 0
            };
        }

        const data: OpenAIModerationResult = await response.json();
        const scores = data.results?.[0]?.category_scores;

        if (!scores) {
            return { 
                toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                insult: 0, profanity: 0, threat: 0,
                sexual: 0, selfHarm: 0, illicit: 0
            };
        }

        // Map OpenAI categories to our ToxicityResult format
        // Combine relevant scores for backwards compatibility
        return {
            // toxicity = max of harassment and hate
            toxicity: Math.max(scores.harassment, scores.hate),
            // severeToxicity = threatening content
            severeToxicity: Math.max(scores['harassment/threatening'], scores['hate/threatening']),
            // identityAttack = hate speech
            identityAttack: scores.hate,
            // insult = harassment
            insult: scores.harassment,
            // profanity - using harassment as proxy
            profanity: scores.harassment,
            // threat = violence
            threat: scores.violence,
            // Additional categories
            sexual: scores.sexual,
            selfHarm: Math.max(scores['self-harm'], scores['self-harm/intent'], scores['self-harm/instructions']),
            illicit: Math.max(scores.illicit, scores['illicit/violent']),
        };
    } catch (error) {
        console.error('[Moderation] OpenAI toxicity check error:', error);
        return { 
            toxicity: 0, severeToxicity: 0, identityAttack: 0, 
            insult: 0, profanity: 0, threat: 0,
            sexual: 0, selfHarm: 0, illicit: 0
        };
    }
}

/**
 * Check content (text AND/OR images) using OpenAI Moderation API
 * This is a more comprehensive check that can handle both text and images
 */
export async function checkContentWithOpenAI(
    text?: string, 
    imageUrls?: string[]
): Promise<{ flagged: boolean; scores: ToxicityResult & { violenceGraphic: number; sexualMinors: number } }> {
    if (!OPENAI_API_KEY) {
        console.warn('[Moderation] OpenAI API key not configured');
        return { 
            flagged: false, 
            scores: { 
                toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                insult: 0, profanity: 0, threat: 0,
                sexual: 0, selfHarm: 0, illicit: 0,
                violenceGraphic: 0, sexualMinors: 0
            }
        };
    }

    // Build multi-modal input
    const input: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    if (text && text.trim().length > 0) {
        input.push({ type: 'text', text });
    }
    
    if (imageUrls && imageUrls.length > 0) {
        for (const url of imageUrls) {
            input.push({ type: 'image_url', image_url: { url } });
        }
    }

    if (input.length === 0) {
        return { 
            flagged: false, 
            scores: { 
                toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                insult: 0, profanity: 0, threat: 0,
                sexual: 0, selfHarm: 0, illicit: 0,
                violenceGraphic: 0, sexualMinors: 0
            }
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'omni-moderation-latest',
                input: input.length === 1 && input[0].type === 'text' ? input[0].text : input,
            }),
        });

        if (!response.ok) {
            console.error('[Moderation] OpenAI Moderation API error:', response.status);
            return { 
                flagged: false, 
                scores: { 
                    toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                    insult: 0, profanity: 0, threat: 0,
                    sexual: 0, selfHarm: 0, illicit: 0,
                    violenceGraphic: 0, sexualMinors: 0
                }
            };
        }

        const data: OpenAIModerationResult = await response.json();
        const result = data.results?.[0];

        if (!result) {
            return { 
                flagged: false, 
                scores: { 
                    toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                    insult: 0, profanity: 0, threat: 0,
                    sexual: 0, selfHarm: 0, illicit: 0,
                    violenceGraphic: 0, sexualMinors: 0
                }
            };
        }

        const scores = result.category_scores;

        return {
            flagged: result.flagged,
            scores: {
                toxicity: Math.max(scores.harassment, scores.hate),
                severeToxicity: Math.max(scores['harassment/threatening'], scores['hate/threatening']),
                identityAttack: scores.hate,
                insult: scores.harassment,
                profanity: scores.harassment,
                threat: scores.violence,
                sexual: scores.sexual,
                selfHarm: Math.max(scores['self-harm'], scores['self-harm/intent'], scores['self-harm/instructions']),
                illicit: Math.max(scores.illicit, scores['illicit/violent']),
                violenceGraphic: scores['violence/graphic'],
                sexualMinors: scores['sexual/minors'],
            }
        };
    } catch (error) {
        console.error('[Moderation] OpenAI content check error:', error);
        return { 
            flagged: false, 
            scores: { 
                toxicity: 0, severeToxicity: 0, identityAttack: 0, 
                insult: 0, profanity: 0, threat: 0,
                sexual: 0, selfHarm: 0, illicit: 0,
                violenceGraphic: 0, sexualMinors: 0
            }
        };
    }
}

// ========================================
// SPAM DETECTION
// ========================================

/**
 * Simple hash function for text comparison
 */
function simpleHash(text: string): string {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

/**
 * Check rate limits for a user
 */
export function checkRateLimit(
    userId: string,
    actionType: 'comment' | 'post' | 'message',
    settings: ModerationSettings = DEFAULT_MODERATION_SETTINGS
): { allowed: boolean; waitSeconds?: number } {
    const key = `${userId}:${actionType}`;
    const now = Date.now();
    
    const limits: Record<string, { max: number; windowMs: number }> = {
        comment: { max: settings.maxCommentsPerMinute, windowMs: 60 * 1000 },
        post: { max: settings.maxPostsPerHour, windowMs: 60 * 60 * 1000 },
        message: { max: 30, windowMs: 60 * 1000 }, // 30 messages per minute
    };

    const limit = limits[actionType];
    const cached = rateLimitCache.get(key);

    if (!cached || now > cached.resetAt) {
        rateLimitCache.set(key, { count: 1, resetAt: now + limit.windowMs });
        return { allowed: true };
    }

    if (cached.count >= limit.max) {
        const waitSeconds = Math.ceil((cached.resetAt - now) / 1000);
        return { allowed: false, waitSeconds };
    }

    cached.count++;
    return { allowed: true };
}

/**
 * Check for duplicate/spam text
 */
export function checkDuplicateText(
    userId: string,
    text: string,
    settings: ModerationSettings = DEFAULT_MODERATION_SETTINGS
): { isSpam: boolean; duplicateCount: number } {
    const key = `${userId}:text`;
    const hash = simpleHash(text);
    const now = Date.now();

    // Clean old entries (older than 1 hour)
    for (const [k, v] of textHashCache.entries()) {
        if (now - v.lastSeen > 3600000) {
            textHashCache.delete(k);
        }
    }

    const cached = textHashCache.get(key);

    if (!cached || cached.hash !== hash) {
        textHashCache.set(key, { hash, count: 1, lastSeen: now });
        return { isSpam: false, duplicateCount: 1 };
    }

    cached.count++;
    cached.lastSeen = now;

    // If same text posted more than 3 times, it's spam
    if (cached.count > 3) {
        return { isSpam: true, duplicateCount: cached.count };
    }

    return { isSpam: false, duplicateCount: cached.count };
}

// ========================================
// MAIN MODERATION FUNCTIONS
// ========================================

/**
 * Moderate an image (AI detection + explicit content)
 */
export async function moderateImage(
    imageUrl: string,
    contentType: ModerationContentType,
    userId: string,
    contentId: string,
    settings: ModerationSettings = DEFAULT_MODERATION_SETTINGS
): Promise<ModerationResult> {
    const reasons: ModerationReason[] = [];
    const scores: ModerationResult['scores'] = {};

    // Check for AI-generated content
    const aiScore = await checkAIContent(imageUrl);
    scores.aiScore = aiScore;

    if (aiScore >= settings.aiThreshold) {
        reasons.push('ai_generated');
    }

    // Check for explicit content
    const safeSearch = await checkExplicitContent(imageUrl);
    scores.explicitScore = safeSearch.adult;
    scores.violenceScore = safeSearch.violence;

    if (safeSearch.adult >= settings.explicitThreshold) {
        reasons.push('explicit_content');
    }

    if (safeSearch.violence >= settings.violenceThreshold) {
        reasons.push('violence');
    }

    // Determine overall status
    let status: ModerationStatus = 'approved';
    let requiresReview = false;
    let reviewPriority: ModerationResult['reviewPriority'] = 'low';

    if (reasons.length > 0) {
        if (settings.autoBlockEnabled) {
            status = 'auto_blocked';
        } else {
            status = 'flagged';
            requiresReview = true;
            reviewPriority = 'high';
        }
    } else if (
        aiScore >= settings.aiWarningThreshold ||
        safeSearch.adult >= settings.explicitWarningThreshold ||
        safeSearch.violence >= settings.violenceWarningThreshold
    ) {
        status = 'pending';
        requiresReview = true;
        reviewPriority = 'medium';
    }

    const result: ModerationResult = {
        passed: status === 'approved',
        status,
        reasons,
        scores,
        requiresReview,
        reviewPriority,
    };

    // Add to moderation queue if requires review or blocked
    if (requiresReview || status === 'auto_blocked' || status === 'flagged') {
        await addToModerationQueue({
            contentType,
            contentId,
            contentPreview: imageUrl,
            userId,
            status,
            reasons,
            scores,
            aiDetectionScore: aiScore,
            explicitContentScore: safeSearch.adult,
        });
    }

    return result;
}

/**
 * Moderate text content (toxicity + spam)
 */
export async function moderateText(
    text: string,
    contentType: ModerationContentType,
    userId: string,
    contentId: string,
    language: string = 'de',
    settings: ModerationSettings = DEFAULT_MODERATION_SETTINGS
): Promise<ModerationResult> {
    const reasons: ModerationReason[] = [];
    const scores: ModerationResult['scores'] = {};

    // Check rate limits
    const actionType = contentType === 'feed_post' ? 'post' : 
                       contentType === 'chat_message' ? 'message' : 'comment';
    const rateLimit = checkRateLimit(userId, actionType, settings);
    
    if (!rateLimit.allowed) {
        reasons.push('spam');
        scores.spamScore = 1;
        return {
            passed: false,
            status: 'auto_blocked',
            reasons,
            scores,
            details: `Bitte warte ${rateLimit.waitSeconds} Sekunden bevor du weitere Inhalte postest.`,
        };
    }

    // Check for duplicate text
    const duplicate = checkDuplicateText(userId, text, settings);
    if (duplicate.isSpam) {
        reasons.push('spam');
        scores.spamScore = 0.9;
    }

    // Check toxicity using OpenAI Moderation API (FREE!)
    const toxicity = await checkToxicity(text, language);
    scores.toxicityScore = toxicity.toxicity;

    // Harassment/Hate detection
    if (toxicity.toxicity >= settings.toxicityThreshold || toxicity.severeToxicity >= 0.7) {
        reasons.push('harassment');
    }

    // Identity-based hate speech
    if (toxicity.identityAttack >= 0.7) {
        reasons.push('hate_speech');
    }

    // Violence/threats
    if (toxicity.threat >= 0.8) {
        reasons.push('violence');
    }

    // Sexual content in text (OpenAI category)
    if (toxicity.sexual >= 0.8) {
        reasons.push('explicit_content');
    }

    // Self-harm content (OpenAI category)
    if (toxicity.selfHarm >= 0.7) {
        reasons.push('self_harm');
    }

    // Illicit content (OpenAI category - instructions for illegal acts)
    if (toxicity.illicit >= 0.8) {
        reasons.push('illicit');
    }

    // Determine overall status
    let status: ModerationStatus = 'approved';
    let requiresReview = false;
    let reviewPriority: ModerationResult['reviewPriority'] = 'low';

    if (reasons.length > 0) {
        if (settings.autoBlockEnabled) {
            status = 'auto_blocked';
        } else {
            status = 'flagged';
            requiresReview = true;
            reviewPriority = 'high';
        }
    } else if (
        toxicity.toxicity >= settings.toxicityWarningThreshold ||
        toxicity.insult >= 0.5 ||
        toxicity.profanity >= 0.6 ||
        toxicity.sexual >= 0.5 ||  // OpenAI sexual content warning
        toxicity.selfHarm >= 0.4   // OpenAI self-harm warning
    ) {
        status = 'pending';
        requiresReview = true;
        reviewPriority = 'medium';
    }

    const result: ModerationResult = {
        passed: status === 'approved',
        status,
        reasons,
        scores,
        requiresReview,
        reviewPriority,
    };

    // Add to moderation queue if requires review or blocked
    if (requiresReview || status === 'auto_blocked' || status === 'flagged') {
        await addToModerationQueue({
            contentType,
            contentId,
            contentPreview: text.substring(0, 200),
            userId,
            status,
            reasons,
            scores,
            toxicityScore: toxicity.toxicity,
        });
    }

    return result;
}

/**
 * Combined moderation for posts with images and text
 */
export async function moderatePost(
    text: string,
    imageUrls: string[],
    contentType: ModerationContentType,
    userId: string,
    contentId: string,
    language: string = 'de',
    settings: ModerationSettings = DEFAULT_MODERATION_SETTINGS
): Promise<ModerationResult> {
    const allReasons: ModerationReason[] = [];
    const allScores: ModerationResult['scores'] = {};

    // Moderate text if present
    if (text && text.trim().length > 0) {
        const textResult = await moderateText(text, contentType, userId, contentId, language, settings);
        allReasons.push(...textResult.reasons);
        Object.assign(allScores, textResult.scores);

        if (!textResult.passed) {
            return textResult;
        }
    }

    // Moderate all images
    for (const imageUrl of imageUrls) {
        const imageResult = await moderateImage(imageUrl, contentType, userId, contentId, settings);
        allReasons.push(...imageResult.reasons);
        
        // Keep highest scores
        if (imageResult.scores.aiScore && (!allScores.aiScore || imageResult.scores.aiScore > allScores.aiScore)) {
            allScores.aiScore = imageResult.scores.aiScore;
        }
        if (imageResult.scores.explicitScore && (!allScores.explicitScore || imageResult.scores.explicitScore > allScores.explicitScore)) {
            allScores.explicitScore = imageResult.scores.explicitScore;
        }
        if (imageResult.scores.violenceScore && (!allScores.violenceScore || imageResult.scores.violenceScore > allScores.violenceScore)) {
            allScores.violenceScore = imageResult.scores.violenceScore;
        }

        if (!imageResult.passed) {
            return imageResult;
        }
    }

    // Deduplicate reasons
    const uniqueReasons = [...new Set(allReasons)];

    return {
        passed: uniqueReasons.length === 0,
        status: uniqueReasons.length === 0 ? 'approved' : 'flagged',
        reasons: uniqueReasons,
        scores: allScores,
    };
}

// ========================================
// MODERATION QUEUE MANAGEMENT
// ========================================

/**
 * Add content to moderation queue
 */
export async function addToModerationQueue(
    item: Omit<ModerationQueueItem, 'id' | 'createdAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, "moderation_queue"), {
        ...item,
        createdAt: Date.now(),
    });
    return docRef.id;
}

/**
 * Get moderation queue items
 */
export async function getModerationQueue(
    status?: ModerationStatus,
    contentType?: ModerationContentType,
    limitCount: number = 50
): Promise<ModerationQueueItem[]> {
    let q = query(
        collection(db, "moderation_queue"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModerationQueueItem));

    // Client-side filtering (Firestore limitations)
    if (status) {
        items = items.filter(item => item.status === status);
    }
    if (contentType) {
        items = items.filter(item => item.contentType === contentType);
    }

    return items;
}

/**
 * Review moderation queue item
 */
export async function reviewModerationItem(
    itemId: string,
    decision: 'approve' | 'reject' | 'escalate',
    adminId: string,
    notes?: string
): Promise<void> {
    const docRef = doc(db, "moderation_queue", itemId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error("Moderation item not found");
    }

    const item = docSnap.data() as ModerationQueueItem;

    let newStatus: ModerationStatus;
    switch (decision) {
        case 'approve':
            newStatus = 'approved';
            break;
        case 'reject':
            newStatus = 'rejected';
            break;
        case 'escalate':
            newStatus = 'pending';
            break;
    }

    await updateDoc(docRef, {
        status: newStatus,
        decision,
        reviewedBy: adminId,
        reviewedAt: Date.now(),
        reviewNotes: notes || null,
        updatedAt: Date.now(),
    });

    // If rejected, update the original content
    if (decision === 'reject') {
        await handleRejectedContent(item);
    }

    // If approved, update the original content status
    if (decision === 'approve') {
        await handleApprovedContent(item);
    }
}

/**
 * Handle rejected content
 */
async function handleRejectedContent(item: ModerationQueueItem): Promise<void> {
    // Update the original content based on type
    switch (item.contentType) {
        case 'feed_post':
            await updateDoc(doc(db, "feed_posts", item.contentId), {
                visibility: 'hidden',
                moderationStatus: 'rejected',
                updatedAt: Date.now(),
            });
            break;
        case 'comment':
            await updateDoc(doc(db, "feed_comments", item.contentId), {
                status: 'rejected',
                text: '[Dieser Kommentar wurde wegen Verstoß gegen die Community-Richtlinien entfernt]',
                updatedAt: Date.now(),
            });
            break;
        case 'chat_message':
            await updateDoc(doc(db, "chat_messages", item.contentId), {
                text: '[Nachricht entfernt]',
                type: 'system',
                updatedAt: Date.now(),
            });
            break;
        case 'artwork':
            await updateDoc(doc(db, "artworks", item.contentId), {
                adminApprovalStatus: 'rejected',
                adminRejectionReason: item.reasons.join(', '),
                updatedAt: Date.now(),
            });
            break;
        case 'profile_picture':
        case 'banner':
            // For profile images, we might want to reset to default
            await updateDoc(doc(db, "users", item.userId), {
                ...(item.contentType === 'profile_picture' 
                    ? { profilePictureUrl: null } 
                    : { 'profileCustomization.background.imageUrl': null }),
                updatedAt: Date.now(),
            });
            break;
    }

    // Add strike to user
    await addUserStrike(item.userId, item.reasons[0] || 'other', item.contentId, item.contentType, 'system');
}

/**
 * Handle approved content
 */
async function handleApprovedContent(item: ModerationQueueItem): Promise<void> {
    switch (item.contentType) {
        case 'feed_post':
            await updateDoc(doc(db, "feed_posts", item.contentId), {
                moderationStatus: 'approved',
                updatedAt: Date.now(),
            });
            break;
        case 'artwork':
            await updateDoc(doc(db, "artworks", item.contentId), {
                adminApprovalStatus: 'approved',
                updatedAt: Date.now(),
            });
            break;
    }
}

// ========================================
// USER MODERATION HISTORY & STRIKES
// ========================================

/**
 * Get or create user moderation history
 */
export async function getUserModerationHistory(userId: string): Promise<UserModerationHistory> {
    // Default history for new users or when access fails
    const defaultHistory: UserModerationHistory = {
        id: userId,
        userId,
        strikes: 0,
        strikeHistory: [],
        isBanned: false,
        warningCount: 0,
        totalContentRemoved: 0,
        totalReportsAgainst: 0,
        totalFalseReports: 0,
        createdAt: Date.now(),
    };

    try {
        const docRef = doc(db, "user_moderation", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as UserModerationHistory;
        }
    } catch (error) {
        // If we can't access the moderation history, return default (not banned)
        console.warn('[Moderation] Could not fetch moderation history for user:', userId, error);
        return defaultHistory;
    }

    // Create default history
    const history: Omit<UserModerationHistory, 'id'> = {
        userId,
        strikes: 0,
        strikeHistory: [],
        isBanned: false,
        warningCount: 0,
        totalContentRemoved: 0,
        totalReportsAgainst: 0,
        totalFalseReports: 0,
        createdAt: Date.now(),
    };

    await setDoc(docRef, history);
    return { id: userId, ...history };
}

/**
 * Add a strike to user's record
 */
export async function addUserStrike(
    userId: string,
    reason: ModerationReason,
    contentId: string,
    contentType: ModerationContentType,
    adminId: string,
    settings: ModerationSettings = DEFAULT_MODERATION_SETTINGS
): Promise<{ newStrikeCount: number; action: 'warning' | 'temp_ban' | 'perma_ban' | 'none' }> {
    const history = await getUserModerationHistory(userId);
    
    // Check for expired strikes
    const now = Date.now();
    const expirationMs = settings.strikeExpirationDays * 24 * 60 * 60 * 1000;
    const activeStrikes = history.strikeHistory.filter(s => 
        !s.expiresAt || s.expiresAt > now
    );

    const newStrike = {
        reason,
        contentId,
        contentType,
        issuedAt: now,
        issuedBy: adminId,
        expiresAt: now + expirationMs,
    };

    const newStrikeCount = activeStrikes.length + 1;

    let action: 'warning' | 'temp_ban' | 'perma_ban' | 'none' = 'none';
    let banUpdate: Partial<UserModerationHistory> = {};

    if (newStrikeCount >= settings.strikesBeforePermaBan) {
        action = 'perma_ban';
        banUpdate = {
            isBanned: true,
            banType: 'permanent',
            banReason: `Permanenter Ban nach ${newStrikeCount} Strikes`,
            bannedAt: now,
            bannedBy: adminId,
        };
    } else if (newStrikeCount >= settings.strikesBeforeTempBan) {
        action = 'temp_ban';
        const banDurationMs = settings.tempBanDurationDays * 24 * 60 * 60 * 1000;
        banUpdate = {
            isBanned: true,
            banType: 'temporary',
            banReason: `Temporärer Ban nach ${newStrikeCount} Strikes`,
            bannedAt: now,
            bannedBy: adminId,
            banExpiresAt: now + banDurationMs,
        };
    } else if (newStrikeCount >= settings.strikesBeforeWarning) {
        action = 'warning';
    }

    await updateDoc(doc(db, "user_moderation", userId), {
        strikes: newStrikeCount,
        lastStrikeAt: now,
        strikeHistory: [...history.strikeHistory, newStrike],
        totalContentRemoved: increment(1),
        ...banUpdate,
        updatedAt: now,
    });

    return { newStrikeCount, action };
}

/**
 * Check if user is banned
 */
export async function isUserBanned(userId: string): Promise<{ banned: boolean; reason?: string; expiresAt?: number }> {
    try {
        const history = await getUserModerationHistory(userId);

        if (!history.isBanned) {
            return { banned: false };
        }

        // Check if temporary ban has expired
        if (history.banType === 'temporary' && history.banExpiresAt) {
            if (Date.now() > history.banExpiresAt) {
                // Unban user
                try {
                    await updateDoc(doc(db, "user_moderation", userId), {
                        isBanned: false,
                        banType: null,
                        banReason: null,
                        updatedAt: Date.now(),
                    });
                } catch (updateError) {
                    console.warn('[Moderation] Could not update ban status:', updateError);
                }
                return { banned: false };
            }
        }

        return {
            banned: true,
            reason: history.banReason,
            expiresAt: history.banExpiresAt,
        };
    } catch (error) {
        // If we can't check ban status (e.g. permission issues), assume not banned
        console.warn('[Moderation] Could not check ban status for user:', userId, error);
        return { banned: false };
    }
}

// ========================================
// CONTENT REPORTING
// ========================================

/**
 * Report content
 */
export async function reportContent(
    contentType: ModerationContentType,
    contentId: string,
    reportedBy: string,
    reason: ModerationReason,
    description?: string
): Promise<string> {
    // Check if user already reported this content
    const existingQuery = query(
        collection(db, "content_reports"),
        where("contentId", "==", contentId),
        where("reportedBy", "==", reportedBy)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
        throw new Error("Du hast diesen Inhalt bereits gemeldet");
    }

    const report: Omit<ContentReport, 'id'> = {
        contentType,
        contentId,
        reportedBy,
        reason,
        description,
        status: 'pending',
        createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, "content_reports"), report);

    // Check if content has reached report threshold
    const allReportsQuery = query(
        collection(db, "content_reports"),
        where("contentId", "==", contentId)
    );
    const allReports = await getDocs(allReportsQuery);
    const reportCount = allReports.size;

    // Auto-hide content after 3 reports
    if (reportCount >= 3) {
        // Find or create moderation queue item
        const existingQueueQuery = query(
            collection(db, "moderation_queue"),
            where("contentId", "==", contentId)
        );
        const existingQueue = await getDocs(existingQueueQuery);

        if (existingQueue.empty) {
            await addToModerationQueue({
                contentType,
                contentId,
                userId: '', // Will need to fetch this
                status: 'flagged',
                reasons: [reason],
                scores: {},
                reportCount,
                reportReasons: [reason],
                reporters: [reportedBy],
            });
        } else {
            const queueDoc = existingQueue.docs[0];
            const queueData = queueDoc.data() as ModerationQueueItem;
            await updateDoc(queueDoc.ref, {
                reportCount: (queueData.reportCount || 0) + 1,
                reportReasons: [...new Set([...(queueData.reportReasons || []), reason])],
                reporters: [...(queueData.reporters || []), reportedBy],
                updatedAt: Date.now(),
            });
        }
    }

    // Auto-block after 5 reports
    if (reportCount >= 5) {
        await autoBlockContent(contentType, contentId);
    }

    return docRef.id;
}

/**
 * Auto-block content that has too many reports
 */
async function autoBlockContent(contentType: ModerationContentType, contentId: string): Promise<void> {
    switch (contentType) {
        case 'feed_post':
            await updateDoc(doc(db, "feed_posts", contentId), {
                visibility: 'hidden',
                moderationStatus: 'auto_blocked',
                updatedAt: Date.now(),
            });
            break;
        case 'comment':
            await updateDoc(doc(db, "feed_comments", contentId), {
                status: 'auto_blocked',
                updatedAt: Date.now(),
            });
            break;
        case 'chat_message':
            await deleteDoc(doc(db, "chat_messages", contentId));
            break;
    }
}

// ========================================
// MODERATION STATISTICS
// ========================================

export interface ModerationStats {
    totalQueued: number;
    pendingReview: number;
    approvedToday: number;
    rejectedToday: number;
    avgResponseTime: number;
    topReasons: Array<{ reason: ModerationReason; count: number }>;
    contentTypeBreakdown: Array<{ type: ModerationContentType; count: number }>;
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<ModerationStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const queueSnapshot = await getDocs(collection(db, "moderation_queue"));
    const items = queueSnapshot.docs.map(doc => doc.data() as ModerationQueueItem);

    const pending = items.filter(i => i.status === 'pending' || i.status === 'flagged');
    const approvedToday = items.filter(i => i.status === 'approved' && i.reviewedAt && i.reviewedAt >= todayMs);
    const rejectedToday = items.filter(i => i.status === 'rejected' && i.reviewedAt && i.reviewedAt >= todayMs);

    // Calculate average response time
    const reviewedItems = items.filter(i => i.reviewedAt);
    const avgResponseTime = reviewedItems.length > 0
        ? reviewedItems.reduce((sum, i) => sum + ((i.reviewedAt || 0) - i.createdAt), 0) / reviewedItems.length
        : 0;

    // Count reasons
    const reasonCounts: Record<string, number> = {};
    items.forEach(i => {
        i.reasons.forEach(r => {
            reasonCounts[r] = (reasonCounts[r] || 0) + 1;
        });
    });
    const topReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason: reason as ModerationReason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Count content types
    const typeCounts: Record<string, number> = {};
    items.forEach(i => {
        typeCounts[i.contentType] = (typeCounts[i.contentType] || 0) + 1;
    });
    const contentTypeBreakdown = Object.entries(typeCounts)
        .map(([type, count]) => ({ type: type as ModerationContentType, count }))
        .sort((a, b) => b.count - a.count);

    return {
        totalQueued: items.length,
        pendingReview: pending.length,
        approvedToday: approvedToday.length,
        rejectedToday: rejectedToday.length,
        avgResponseTime: Math.round(avgResponseTime / 1000 / 60), // in minutes
        topReasons,
        contentTypeBreakdown,
    };
}

