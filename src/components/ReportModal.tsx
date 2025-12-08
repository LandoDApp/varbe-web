"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { createReport } from "@/lib/reports";
import { useAuth } from "@/context/AuthContext";
import { ModerationContentType, ModerationReason } from "@/types";

// Report reasons with labels
const REPORT_REASONS: { value: ModerationReason; label: string; emoji: string }[] = [
    { value: 'ai_generated', label: 'KI-generierter Inhalt', emoji: '🤖' },
    { value: 'explicit_content', label: 'Unangemessener Inhalt', emoji: '🔞' },
    { value: 'violence', label: 'Gewaltinhalt', emoji: '⚠️' },
    { value: 'hate_speech', label: 'Hassrede', emoji: '🚫' },
    { value: 'harassment', label: 'Belästigung', emoji: '👊' },
    { value: 'spam', label: 'Spam', emoji: '📧' },
    { value: 'copyright', label: 'Urheberrechtsverletzung', emoji: '©️' },
    { value: 'impersonation', label: 'Identitätsdiebstahl', emoji: '🎭' },
    { value: 'misinformation', label: 'Fehlinformation', emoji: '📰' },
    { value: 'other', label: 'Sonstiges', emoji: '❓' },
];

interface ReportModalProps {
    listingId?: string;          // For legacy support
    contentId?: string;          // New: generic content ID
    contentType?: ModerationContentType; // New: type of content
    isOpen: boolean;
    onClose: () => void;
    title?: string;              // Custom title
}

export function ReportModal({ 
    listingId, 
    contentId,
    contentType = 'artwork',
    isOpen, 
    onClose,
    title = 'Inhalt melden'
}: ReportModalProps) {
    const { user } = useAuth();
    const [reason, setReason] = useState<ModerationReason | "">("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use contentId if provided, otherwise fall back to listingId
    const effectiveContentId = contentId || listingId || '';

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reason || !effectiveContentId) return;

        setLoading(true);
        setError(null);
        
        try {
            // Try using the new moderation API first
            const response = await fetch('/api/moderation/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    contentId: effectiveContentId,
                    reportedBy: user.uid,
                    reason,
                    description: description.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If already reported, show specific message
                if (response.status === 409) {
                    setError(data.error || 'Du hast diesen Inhalt bereits gemeldet.');
                    return;
                }
                throw new Error(data.error || 'Fehler beim Melden');
            }

            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setReason("");
                setDescription("");
            }, 2000);
        } catch (err) {
            console.error("Error submitting report:", err);
            
            // Fallback to legacy report system for listings
            if (listingId) {
                try {
                    const reportData: any = {
                        listingId,
                        reportedBy: user.uid,
                        reason,
                        status: 'pending',
                    };
                    
                    if (description && description.trim()) {
                        reportData.description = description.trim();
                    }
                    
                    await createReport(reportData);
                    setSubmitted(true);
                    setTimeout(() => {
                        onClose();
                        setSubmitted(false);
                        setReason("");
                        setDescription("");
                    }, 2000);
                } catch (legacyError) {
                    setError('Fehler beim Melden. Bitte versuche es später erneut.');
                }
            } else {
                setError(err instanceof Error ? err.message : 'Fehler beim Melden');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-comic bg-white p-8 border-4 border-black max-w-md w-full">
                {submitted ? (
                    <div className="text-center">
                        <h2 className="text-3xl font-heading mb-4">✅ Meldung gesendet</h2>
                        <p className="font-body">Vielen Dank für deine Meldung. Wir werden den Inhalt prüfen.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-heading mb-4">🚩 {title}</h2>
                        
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 mb-4 text-sm">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-bold mb-2">Grund *</label>
                                <select
                                    className="input-comic w-full"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value as ModerationReason | "")}
                                    required
                                >
                                    <option value="">Wähle einen Grund...</option>
                                    {REPORT_REASONS.map(({ value, label, emoji }) => (
                                        <option key={value} value={value}>
                                            {emoji} {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* AI Art hint */}
                            {reason === 'ai_generated' && (
                                <div className="bg-purple-50 border-2 border-purple-300 p-3 text-sm">
                                    <p className="font-bold text-purple-700">🤖 KI-generierte Kunst</p>
                                    <p className="text-purple-600 mt-1">
                                        Varbe ist eine Plattform für echte, von Menschen geschaffene Kunst. 
                                        Wenn du glaubst, dass dieses Werk von einer KI erstellt wurde, 
                                        hilft uns deine Meldung, die Integrität unserer Community zu wahren.
                                    </p>
                                </div>
                            )}
                            
                            <div>
                                <label className="block font-bold mb-2">Beschreibung (optional)</label>
                                <textarea
                                    className="input-comic w-full h-24"
                                    placeholder="Bitte gib weitere Details an..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        setReason("");
                                        setDescription("");
                                        setError(null);
                                    }}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Abbrechen
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !reason}
                                    variant="accent"
                                    className="flex-1"
                                >
                                    {loading ? "Wird gesendet..." : "Melden"}
                                </Button>
                            </div>
                        </form>
                        
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Falschmeldungen können zu Einschränkungen deines Accounts führen.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}




