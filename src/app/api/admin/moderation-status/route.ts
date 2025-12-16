/**
 * API Route: Get Moderation API Status
 * GET /api/admin/moderation-status
 * 
 * Returns the configuration status of moderation APIs
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Check which API keys are configured
        const openaiConfigured = !!process.env.OPENAI_API_KEY;
        const googleCloudVisionConfigured = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;
        const hiveConfigured = !!process.env.HIVE_API_KEY;
        const perspectiveConfigured = !!process.env.PERSPECTIVE_API_KEY;

        return NextResponse.json({
            success: true,
            status: {
                openaiTextModeration: {
                    configured: openaiConfigured,
                    description: "OpenAI Moderation API für Text-Prüfung (Toxizität, Hassrede, etc.)",
                    icon: "💬",
                },
                googleCloudVision: {
                    configured: googleCloudVisionConfigured,
                    description: "Google Cloud Vision für Bild-Prüfung (Explizite Inhalte)",
                    icon: "🖼️",
                },
                hiveAiDetection: {
                    configured: hiveConfigured,
                    description: "Hive AI für KI-generierte Kunst-Erkennung",
                    icon: "🤖",
                },
                perspectiveApi: {
                    configured: perspectiveConfigured,
                    description: "Google Perspective API für erweiterte Toxizitäts-Erkennung",
                    icon: "🔍",
                },
            },
            summary: {
                totalApis: 4,
                configuredApis: [openaiConfigured, googleCloudVisionConfigured, hiveConfigured, perspectiveConfigured].filter(Boolean).length,
            }
        });

    } catch (error) {
        console.error("[API] Moderation status error:", error);
        return NextResponse.json(
            { error: "Fehler beim Abrufen des Moderation-Status" },
            { status: 500 }
        );
    }
}




