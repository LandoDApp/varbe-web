/**
 * API Route: Moderation Queue Management
 * GET /api/moderation/queue - Get queue items
 * POST /api/moderation/queue - Add item to queue
 */

import { NextRequest, NextResponse } from "next/server";
import { getModerationQueue, addToModerationQueue } from "@/lib/moderation";
import { ModerationStatus, ModerationContentType } from "@/types";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as ModerationStatus | null;
        const contentType = searchParams.get('contentType') as ModerationContentType | null;
        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 50;

        const items = await getModerationQueue(
            status || undefined,
            contentType || undefined,
            limit
        );

        return NextResponse.json({
            success: true,
            items,
            count: items.length,
        });

    } catch (error) {
        console.error("[API] Get moderation queue error:", error);
        return NextResponse.json(
            { error: "Fehler beim Abrufen der Moderationswarteschlange" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            contentType,
            contentId,
            contentPreview,
            userId,
            status,
            reasons,
            scores
        } = body;

        // Validation
        if (!contentType || !contentId || !userId) {
            return NextResponse.json(
                { error: "contentType, contentId und userId sind erforderlich" },
                { status: 400 }
            );
        }

        const id = await addToModerationQueue({
            contentType,
            contentId,
            contentPreview,
            userId,
            status: status || 'pending',
            reasons: reasons || [],
            scores: scores || {},
        });

        return NextResponse.json({
            success: true,
            id,
            message: "Zur Moderationswarteschlange hinzugefügt",
        });

    } catch (error) {
        console.error("[API] Add to moderation queue error:", error);
        return NextResponse.json(
            { error: "Fehler beim Hinzufügen zur Warteschlange" },
            { status: 500 }
        );
    }
}



