/**
 * API Route: Review Moderation Queue Item
 * POST /api/moderation/review
 */

import { NextRequest, NextResponse } from "next/server";
import { reviewModerationItem } from "@/lib/moderation";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { itemId, decision, adminId, notes } = body;

        // Validation
        if (!itemId) {
            return NextResponse.json(
                { error: "itemId ist erforderlich" },
                { status: 400 }
            );
        }

        if (!decision || !['approve', 'reject', 'escalate'].includes(decision)) {
            return NextResponse.json(
                { error: "Ungültige Entscheidung. Erlaubt: approve, reject, escalate" },
                { status: 400 }
            );
        }

        if (!adminId) {
            return NextResponse.json(
                { error: "adminId ist erforderlich" },
                { status: 400 }
            );
        }

        await reviewModerationItem(itemId, decision, adminId, notes);

        const actionMessages = {
            approve: 'Inhalt genehmigt',
            reject: 'Inhalt abgelehnt und entfernt',
            escalate: 'Zur weiteren Prüfung eskaliert',
        };

        return NextResponse.json({
            success: true,
            message: actionMessages[decision as keyof typeof actionMessages],
        });

    } catch (error) {
        console.error("[API] Review moderation item error:", error);
        
        if (error instanceof Error && error.message === "Moderation item not found") {
            return NextResponse.json(
                { error: "Moderationseintrag nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Fehler bei der Überprüfung" },
            { status: 500 }
        );
    }
}


