/**
 * API Route: Create a content report
 * POST /api/reports/create
 */

import { NextRequest, NextResponse } from "next/server";
import { createContentReport } from "@/lib/reports";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reporterId, contentType, contentId, reason, description } = body;

        // Validation
        if (!reporterId) {
            return NextResponse.json(
                { success: false, error: "reporterId ist erforderlich" },
                { status: 400 }
            );
        }

        if (!contentType) {
            return NextResponse.json(
                { success: false, error: "contentType ist erforderlich" },
                { status: 400 }
            );
        }

        if (!contentId) {
            return NextResponse.json(
                { success: false, error: "contentId ist erforderlich" },
                { status: 400 }
            );
        }

        if (!reason) {
            return NextResponse.json(
                { success: false, error: "reason ist erforderlich" },
                { status: 400 }
            );
        }

        // Valid content types
        const validContentTypes = ['feed_post', 'comment', 'user', 'artwork', 'message'];
        if (!validContentTypes.includes(contentType)) {
            return NextResponse.json(
                { success: false, error: `Ungültiger contentType. Erlaubt: ${validContentTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Create the report
        const reportId = await createContentReport({
            reporterId,
            contentType,
            contentId,
            reason,
            description,
        });

        console.log(`[Report] Created report ${reportId} for ${contentType} ${contentId}`);

        return NextResponse.json({
            success: true,
            reportId,
            message: "Meldung wurde erfolgreich eingereicht",
        });

    } catch (error: any) {
        console.error("[API] Report creation error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Fehler beim Erstellen der Meldung" },
            { status: 500 }
        );
    }
}




