/**
 * API Route: Scan all existing posts for moderation
 * POST /api/admin/scan-all-posts
 * 
 * This will check all feed_posts with OpenAI moderation and flag problematic content
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface ModerationResult {
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
}

async function moderateContent(text?: string, imageUrls?: string[]): Promise<{
    flagged: boolean;
    reasons: string[];
    scores: Record<string, number>;
}> {
    if (!OPENAI_API_KEY) {
        return { flagged: false, reasons: [], scores: {} };
    }

    // Build input for OpenAI
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
        return { flagged: false, reasons: [], scores: {} };
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
            console.error('[Scan] OpenAI API error:', response.status);
            return { flagged: false, reasons: [], scores: {} };
        }

        const data = await response.json();
        const result = data.results?.[0];

        if (!result) {
            return { flagged: false, reasons: [], scores: {} };
        }

        const reasons: string[] = [];
        const scores: Record<string, number> = {};

        // Check categories
        if (result.categories.sexual) reasons.push('explicit_content');
        if (result.categories['sexual/minors']) reasons.push('explicit_content');
        if (result.categories.violence) reasons.push('violence');
        if (result.categories['violence/graphic']) reasons.push('violence');
        if (result.categories.harassment) reasons.push('harassment');
        if (result.categories['harassment/threatening']) reasons.push('harassment');
        if (result.categories.hate) reasons.push('hate_speech');
        if (result.categories['hate/threatening']) reasons.push('hate_speech');
        if (result.categories['self-harm']) reasons.push('self_harm');
        if (result.categories['self-harm/intent']) reasons.push('self_harm');
        if (result.categories['self-harm/instructions']) reasons.push('self_harm');
        if (result.categories.illicit) reasons.push('illicit');
        if (result.categories['illicit/violent']) reasons.push('illicit');

        // Store scores
        scores.sexual = result.category_scores.sexual || 0;
        scores.violence = result.category_scores.violence || 0;
        scores.harassment = result.category_scores.harassment || 0;
        scores.hate = result.category_scores.hate || 0;
        scores.selfHarm = result.category_scores['self-harm'] || 0;

        return {
            flagged: result.flagged || reasons.length > 0,
            reasons: [...new Set(reasons)], // Dedupe
            scores,
        };
    } catch (error) {
        console.error('[Scan] Moderation error:', error);
        return { flagged: false, reasons: [], scores: {} };
    }
}

export async function POST(request: NextRequest) {
    console.log('[Scan] Starting scan of all posts...');

    if (!OPENAI_API_KEY) {
        return NextResponse.json({
            success: false,
            error: 'OpenAI API key not configured',
        }, { status: 500 });
    }

    try {
        // Get all feed posts
        const postsSnapshot = await getDocs(collection(db, "feed_posts"));
        const posts = postsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        console.log(`[Scan] Found ${posts.length} posts to scan`);

        const results = {
            total: posts.length,
            scanned: 0,
            flagged: 0,
            errors: 0,
            flaggedPosts: [] as { id: string; text: string; reasons: string[] }[],
        };

        // Process each post
        for (const post of posts) {
            try {
                const postData = post as any;
                
                // Skip already flagged posts
                if (postData.needsAdminReview === true) {
                    console.log(`[Scan] Skipping already flagged post: ${post.id}`);
                    results.scanned++;
                    continue;
                }

                console.log(`[Scan] Scanning post ${post.id}...`);

                // Moderate text and images
                const modResult = await moderateContent(
                    postData.text,
                    postData.images
                );

                results.scanned++;

                if (modResult.flagged) {
                    results.flagged++;
                    results.flaggedPosts.push({
                        id: post.id,
                        text: (postData.text || '').substring(0, 100),
                        reasons: modResult.reasons,
                    });

                    // Update post with moderation data
                    await updateDoc(doc(db, "feed_posts", post.id), {
                        moderationStatus: 'pending_review',
                        needsAdminReview: true,
                        moderationReasons: modResult.reasons,
                        moderationScores: {
                            toxicityScore: modResult.scores.harassment || 0,
                            explicitScore: modResult.scores.sexual || 0,
                            violenceScore: modResult.scores.violence || 0,
                        },
                        moderationScannedAt: Date.now(),
                    });

                    console.log(`[Scan] ⚠️ Flagged post ${post.id}: ${modResult.reasons.join(', ')}`);
                } else {
                    console.log(`[Scan] ✅ Post ${post.id} is clean`);
                }

                // Rate limit: wait a bit between requests
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (postError) {
                console.error(`[Scan] Error scanning post ${post.id}:`, postError);
                results.errors++;
            }
        }

        console.log(`[Scan] Scan complete! Total: ${results.total}, Flagged: ${results.flagged}, Errors: ${results.errors}`);

        return NextResponse.json({
            success: true,
            results,
            message: `Scan abgeschlossen! ${results.flagged} von ${results.total} Posts wurden geflaggt.`,
        });

    } catch (error: any) {
        console.error('[Scan] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Fehler beim Scannen der Posts',
        }, { status: 500 });
    }
}





