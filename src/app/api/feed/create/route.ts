/**
 * API Route: Moderate Feed Post Content (Server-Side)
 * POST /api/feed/create
 * 
 * This route ONLY handles content moderation on the server where
 * environment variables (API keys for OpenAI, etc.) are available.
 * 
 * The actual post creation happens client-side after moderation passes.
 */

import { NextRequest, NextResponse } from "next/server";
import { moderatePost, isUserBanned } from "@/lib/moderation";
import { FeedPostType } from "@/types";

interface ModerationRequest {
    artistId: string;
    text: string;
    images?: string[];
}

export async function POST(request: NextRequest) {
    console.log("[API] Feed moderation request received");
    
    try {
        const body: ModerationRequest = await request.json();
        const { artistId, text, images } = body;
        
        console.log("[API] Request body:", { artistId, textLength: text?.length, imageCount: images?.length });

        // Validation
        if (!artistId) {
            return NextResponse.json(
                { success: false, error: "artistId ist erforderlich" },
                { status: 400 }
            );
        }

        if (!text || !text.trim()) {
            return NextResponse.json(
                { success: false, error: "Text ist erforderlich" },
                { status: 400 }
            );
        }

        // Check if user is banned
        console.log("[API] Checking ban status...");
        let banStatus;
        try {
            banStatus = await isUserBanned(artistId);
            console.log("[API] Ban status:", banStatus);
        } catch (banError: any) {
            console.error("[API] Ban check failed:", banError);
            // Continue without ban check if it fails
            banStatus = { banned: false };
        }
        
        if (banStatus.banned) {
            const errorMessage = banStatus.expiresAt 
                ? `Dein Konto ist vorübergehend gesperrt bis ${new Date(banStatus.expiresAt).toLocaleDateString('de-DE')}. Grund: ${banStatus.reason}`
                : `Dein Konto ist dauerhaft gesperrt. Grund: ${banStatus.reason}`;
            
            return NextResponse.json(
                { success: false, error: errorMessage, banned: true },
                { status: 403 }
            );
        }

        // Generate temporary content ID for moderation
        const tempContentId = `feed_post_${Date.now()}_${artistId.slice(0, 8)}`;

        // Run content moderation on text and images (SERVER-SIDE)
        // Environment variables (OPENAI_API_KEY, etc.) are available here!
        console.log("[API] Running moderation...");
        console.log("[API] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
        
        const moderationResult = await moderatePost(
            text,
            images || [],
            'feed_post',
            artistId,
            tempContentId,
            'de' // Default to German
        );
        
        console.log("[API] Moderation result:", moderationResult);

        // Only block for spam (rate limiting) - everything else gets posted but flagged for review
        if (!moderationResult.passed && moderationResult.reasons.includes('spam')) {
            return NextResponse.json({
                success: false,
                error: '📵 Zu viele Beiträge in kurzer Zeit. Bitte warte einen Moment.',
                moderationResult,
            });
        }

        // Determine if post needs admin review
        const needsReview = !moderationResult.passed || moderationResult.requiresReview;
        
        // Build user-friendly message about pending review
        let pendingReviewMessage = '';
        if (needsReview) {
            const reasonMessages: Record<string, string> = {
                'ai_generated': '🤖 Dein Bild wird auf KI-Generierung geprüft.',
                'explicit_content': '🔞 Dein Beitrag wird auf unangemessene Inhalte geprüft.',
                'violence': '⚠️ Dein Beitrag wird auf gewalttätige Inhalte geprüft.',
                'harassment': '💬 Dein Text wird auf belästigende Sprache geprüft.',
                'hate_speech': '🛑 Dein Text wird auf Hassrede geprüft.',
                'self_harm': '💙 Dein Beitrag enthält sensible Inhalte und wird geprüft.',
                'illicit': '⚠️ Dein Beitrag wird auf problematische Inhalte geprüft.',
            };

            const reasons = (moderationResult.reasons || [])
                .filter(r => r !== 'spam')
                .map(r => reasonMessages[r])
                .filter(Boolean);

            pendingReviewMessage = reasons.length > 0 
                ? `📋 Dein Beitrag wurde gepostet, muss aber von einem Admin freigegeben werden:\n${reasons.join('\n')}`
                : '📋 Dein Beitrag wurde gepostet und wird von einem Admin überprüft.';
        }

        // Return success - post will be created client-side with appropriate moderation status
        console.log("[API] Moderation complete!", { needsReview });
        return NextResponse.json({
            success: true,
            moderationResult,
            needsReview,
            pendingReviewMessage: needsReview ? pendingReviewMessage : undefined,
            moderationStatus: needsReview ? 'pending_review' : 'approved',
            moderationReasons: moderationResult.reasons || [],
            message: needsReview 
                ? "Post wird erstellt und zur Überprüfung eingereicht" 
                : "Moderation bestanden - Post kann erstellt werden",
        });

    } catch (error: any) {
        console.error("[API] Feed moderation error:", error);
        console.error("[API] Error stack:", error.stack);
        return NextResponse.json(
            { success: false, error: `Fehler bei der Moderation: ${error.message || 'Unbekannter Fehler'}` },
            { status: 500 }
        );
    }
}

