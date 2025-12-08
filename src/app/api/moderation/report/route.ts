/**
 * API Route: Report Content
 * POST /api/moderation/report
 */

import { NextRequest, NextResponse } from "next/server";
import { reportContent } from "@/lib/moderation";
import { ModerationContentType, ModerationReason } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contentType, contentId, reportedBy, reason, description } = body;

        // Validation
        if (!contentType) {
            return NextResponse.json(
                { error: "contentType ist erforderlich" },
                { status: 400 }
            );
        }

        if (!contentId) {
            return NextResponse.json(
                { error: "contentId ist erforderlich" },
                { status: 400 }
            );
        }

        if (!reportedBy) {
            return NextResponse.json(
                { error: "reportedBy ist erforderlich" },
                { status: 400 }
            );
        }

        if (!reason) {
            return NextResponse.json(
                { error: "reason ist erforderlich" },
                { status: 400 }
            );
        }

        // Validate content type
        const validContentTypes: ModerationContentType[] = [
            'image', 'text', 'profile_picture', 'banner', 'artwork', 
            'feed_post', 'comment', 'chat_message', 'dm'
        ];
        if (!validContentTypes.includes(contentType)) {
            return NextResponse.json(
                { error: `Ungültiger contentType` },
                { status: 400 }
            );
        }

        // Validate reason
        const validReasons: ModerationReason[] = [
            'ai_generated', 'explicit_content', 'violence', 'hate_speech',
            'harassment', 'spam', 'copyright', 'impersonation', 'misinformation', 'other'
        ];
        if (!validReasons.includes(reason)) {
            return NextResponse.json(
                { error: `Ungültiger Grund` },
                { status: 400 }
            );
        }

        const reportId = await reportContent(
            contentType,
            contentId,
            reportedBy,
            reason,
            description
        );

        return NextResponse.json({
            success: true,
            reportId,
            message: "Vielen Dank für deine Meldung. Wir werden den Inhalt überprüfen.",
        });

    } catch (error) {
        console.error("[API] Report content error:", error);
        
        if (error instanceof Error && error.message.includes("bereits gemeldet")) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Fehler beim Melden des Inhalts" },
            { status: 500 }
        );
    }
}



