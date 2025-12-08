/**
 * API Route: Moderation Statistics
 * GET /api/moderation/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getModerationStats } from "@/lib/moderation";

export async function GET(request: NextRequest) {
    try {
        const stats = await getModerationStats();

        return NextResponse.json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error("[API] Get moderation stats error:", error);
        return NextResponse.json(
            { error: "Fehler beim Abrufen der Statistiken" },
            { status: 500 }
        );
    }
}


