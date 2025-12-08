/**
 * API Route: Moderate Direct Message Content (Server-Side)
 * POST /api/dm/moderate
 * 
 * Server-side moderation for direct messages.
 * Environment variables (OPENAI_API_KEY) are only available on the server.
 */

import { NextRequest, NextResponse } from "next/server";
import { moderateText, moderateImage, isUserBanned } from "@/lib/moderation";

interface ModerationRequest {
    senderId: string;
    content: string;
    images?: string[];
}

export async function POST(request: NextRequest) {
    try {
        const body: ModerationRequest = await request.json();
        const { senderId, content, images } = body;

        // Validation
        if (!senderId) {
            return NextResponse.json(
                { success: false, error: "senderId ist erforderlich" },
                { status: 400 }
            );
        }

        // Check if user is banned
        const banStatus = await isUserBanned(senderId);
        if (banStatus.banned) {
            return NextResponse.json(
                { success: false, error: 'Dein Konto ist gesperrt. Du kannst keine Nachrichten senden.', banned: true },
                { status: 403 }
            );
        }

        const tempMessageId = `dm_${Date.now()}_${senderId.slice(0, 8)}`;

        // Moderate text content
        if (content && content.trim().length > 0) {
            const textModeration = await moderateText(
                content,
                'dm',
                senderId,
                tempMessageId,
                'de'
            );

            if (!textModeration.passed) {
                const reasonMessages: Record<string, string> = {
                    'harassment': '🛑 Deine Nachricht enthält unangemessene Sprache.',
                    'hate_speech': '🛑 Hassrede ist nicht erlaubt.',
                    'violence': '⚠️ Gewalthaltige Inhalte sind nicht erlaubt.',
                    'explicit_content': '🚫 Unangemessene Inhalte sind nicht erlaubt.',
                    'spam': '📵 Bitte warte einen Moment bevor du weitere Nachrichten sendest.',
                    'self_harm': '💙 Falls du Hilfe brauchst: Telefonseelsorge 0800 111 0 111',
                    'illicit': '⛔ Diese Inhalte sind nicht erlaubt.',
                };

                return NextResponse.json({
                    success: false,
                    error: textModeration.details || 
                        textModeration.reasons.map(r => reasonMessages[r] || `Verstoß: ${r}`).join('\n') ||
                        'Nachricht konnte nicht gesendet werden.',
                    moderationResult: textModeration,
                });
            }
        }

        // Moderate images if present
        if (images && images.length > 0) {
            for (const imageUrl of images) {
                const imageModeration = await moderateImage(
                    imageUrl,
                    'dm',
                    senderId,
                    tempMessageId
                );

                if (!imageModeration.passed) {
                    const reasonMessages: Record<string, string> = {
                        'ai_generated': '🤖 KI-generierte Bilder sind nicht erlaubt.',
                        'explicit_content': '🚫 Dieses Bild enthält unangemessene Inhalte.',
                        'violence': '⚠️ Gewalthaltige Bilder sind nicht erlaubt.',
                    };

                    return NextResponse.json({
                        success: false,
                        error: imageModeration.reasons.map(r => reasonMessages[r] || `Verstoß: ${r}`).join('\n') ||
                            'Bild konnte nicht gesendet werden.',
                        moderationResult: imageModeration,
                    });
                }
            }
        }

        // Moderation passed!
        return NextResponse.json({
            success: true,
            message: "Moderation bestanden",
        });

    } catch (error: any) {
        console.error("[API] DM moderation error:", error);
        return NextResponse.json(
            { success: false, error: `Fehler bei der Moderation: ${error.message || 'Unbekannter Fehler'}` },
            { status: 500 }
        );
    }
}


