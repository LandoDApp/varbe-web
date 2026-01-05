/**
 * API Route: Moderate Chat Message Content (Server-Side)
 * POST /api/chat/moderate
 * 
 * Server-side moderation for chatroom messages.
 * Environment variables (OPENAI_API_KEY) are only available on the server.
 */

import { NextRequest, NextResponse } from "next/server";
import { moderateText, moderateImage, isUserBanned } from "@/lib/moderation";

interface ModerationRequest {
    userId: string;
    text: string;
    imageUrl?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ModerationRequest = await request.json();
        const { userId, text, imageUrl } = body;

        // Validation
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "userId ist erforderlich" },
                { status: 400 }
            );
        }

        // Check if user is banned
        const banStatus = await isUserBanned(userId);
        if (banStatus.banned) {
            const errorMessage = banStatus.expiresAt 
                ? `Dein Konto ist vorübergehend gesperrt bis ${new Date(banStatus.expiresAt).toLocaleDateString('de-DE')}.`
                : 'Dein Konto ist dauerhaft gesperrt.';
            
            return NextResponse.json(
                { success: false, error: errorMessage, banned: true },
                { status: 403 }
            );
        }

        const messageId = `chat_${Date.now()}_${userId.slice(0, 8)}`;

        // Moderate text content
        if (text && text.trim().length > 0) {
            const textModeration = await moderateText(
                text,
                'chat_message',
                userId,
                messageId,
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

        // Moderate image if present
        if (imageUrl) {
            const imageModeration = await moderateImage(
                imageUrl,
                'chat_message',
                userId,
                messageId
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

        // Moderation passed!
        return NextResponse.json({
            success: true,
            message: "Moderation bestanden",
        });

    } catch (error: any) {
        console.error("[API] Chat moderation error:", error);
        return NextResponse.json(
            { success: false, error: `Fehler bei der Moderation: ${error.message || 'Unbekannter Fehler'}` },
            { status: 500 }
        );
    }
}





