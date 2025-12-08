/**
 * API Route: Sync Chatroom Statistics
 * POST /api/chatrooms/sync-stats
 * 
 * Cleans up stale online statuses and recalculates member counts
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanupStaleOnlineStatuses, syncChatroomStats } from "@/lib/chatrooms";

export async function POST(request: NextRequest) {
    try {
        // Clean up stale online statuses (users who closed browser without leaving)
        const cleanedCount = await cleanupStaleOnlineStatuses();
        
        return NextResponse.json({
            success: true,
            message: `Statistiken synchronisiert. ${cleanedCount} veraltete Online-Status bereinigt.`,
            cleanedCount,
        });
    } catch (error) {
        console.error("[API] Sync chatroom stats error:", error);
        return NextResponse.json(
            { error: "Fehler beim Synchronisieren der Statistiken" },
            { status: 500 }
        );
    }
}

// Also allow GET for easy testing/cron jobs
export async function GET(request: NextRequest) {
    return POST(request);
}



