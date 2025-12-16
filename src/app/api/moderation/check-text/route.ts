/**
 * API Route: Check Text for toxicity and spam
 * POST /api/moderation/check-text
 */

import { NextRequest, NextResponse } from "next/server";
import { moderateText } from "@/lib/moderation";
import { ModerationContentType } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, contentType, userId, contentId, language = 'de' } = body;

        // Validation
        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: "text ist erforderlich" },
                { status: 400 }
            );
        }

        if (!contentType) {
            return NextResponse.json(
                { error: "contentType ist erforderlich" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "userId ist erforderlich" },
                { status: 400 }
            );
        }

        // Validate content type
        const validContentTypes: ModerationContentType[] = [
            'text', 'comment', 'chat_message', 'dm', 'feed_post'
        ];
        if (!validContentTypes.includes(contentType)) {
            return NextResponse.json(
                { error: `Ungültiger contentType. Erlaubt: ${validContentTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Run moderation
        const result = await moderateText(
            text,
            contentType,
            userId,
            contentId || `temp_${Date.now()}`,
            language
        );

        return NextResponse.json({
            success: true,
            result,
            message: result.passed 
                ? "Text wurde genehmigt" 
                : result.details || `Text wurde blockiert: ${result.reasons.join(', ')}`,
        });

    } catch (error) {
        console.error("[API] Text moderation error:", error);
        return NextResponse.json(
            { error: "Fehler bei der Textprüfung" },
            { status: 500 }
        );
    }
}




