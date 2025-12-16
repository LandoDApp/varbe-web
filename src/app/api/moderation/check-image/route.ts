/**
 * API Route: Check Image for AI-generated content and explicit content
 * POST /api/moderation/check-image
 */

import { NextRequest, NextResponse } from "next/server";
import { moderateImage } from "@/lib/moderation";
import { ModerationContentType } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { imageUrl, contentType, userId, contentId } = body;

        // Validation
        if (!imageUrl) {
            return NextResponse.json(
                { error: "imageUrl ist erforderlich" },
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
            'image', 'profile_picture', 'banner', 'artwork', 'feed_post'
        ];
        if (!validContentTypes.includes(contentType)) {
            return NextResponse.json(
                { error: `Ungültiger contentType. Erlaubt: ${validContentTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Run moderation
        const result = await moderateImage(
            imageUrl,
            contentType,
            userId,
            contentId || `temp_${Date.now()}`
        );

        return NextResponse.json({
            success: true,
            result,
            message: result.passed 
                ? "Bild wurde genehmigt" 
                : `Bild wurde blockiert: ${result.reasons.join(', ')}`,
        });

    } catch (error) {
        console.error("[API] Image moderation error:", error);
        return NextResponse.json(
            { error: "Fehler bei der Bildprüfung" },
            { status: 500 }
        );
    }
}




