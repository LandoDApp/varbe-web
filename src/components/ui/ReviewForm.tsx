"use client";

import { useState, useEffect } from "react";
import { createReview, canReviewArtist } from "@/lib/reviews";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./Button";

interface ReviewFormProps {
    artistId: string;
    orderId?: string;
    onReviewSubmitted?: () => void;
}

export function ReviewForm({ artistId, orderId, onReviewSubmitted }: ReviewFormProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [canReview, setCanReview] = useState<{ canReview: boolean; orderId?: string; reason?: string } | null>(null);
    const [checking, setChecking] = useState(true);

    // Check if user can review
    useEffect(() => {
        const check = async () => {
            if (!user) {
                setCanReview({ canReview: false, reason: "Du musst eingeloggt sein, um zu bewerten." });
                setChecking(false);
                return;
            }

            try {
                const result = await canReviewArtist(user.uid, artistId);
                setCanReview(result);
                if (result.canReview && result.orderId && !orderId) {
                    // Use the orderId from canReviewArtist if not provided
                    // This will be handled in the submit function
                }
            } catch (err) {
                setError("Fehler beim Prüfen der Bewertungsberechtigung.");
                setCanReview({ canReview: false });
            } finally {
                setChecking(false);
            }
        };
        check();
    }, [user, artistId, orderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            setError("Du musst eingeloggt sein, um zu bewerten.");
            return;
        }

        if (rating === 0) {
            setError("Bitte wähle eine Bewertung aus.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const reviewOrderId = orderId || canReview?.orderId;
            if (!reviewOrderId) {
                setError("Keine Bestellung gefunden, die bewertet werden kann.");
                setSubmitting(false);
                return;
            }

            await createReview(artistId, user.uid, reviewOrderId, rating, comment.trim() || undefined);
            
            // Reset form
            setRating(0);
            setComment("");
            setError("");
            
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }
            
            alert("Vielen Dank für deine Bewertung! ⭐");
        } catch (err: any) {
            setError(err.message || "Fehler beim Erstellen der Bewertung.");
        } finally {
            setSubmitting(false);
        }
    };

    if (checking) {
        return (
            <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-black mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Prüfe Bewertungsberechtigung...</p>
            </div>
        );
    }

    if (!canReview?.canReview) {
        return (
            <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded">
                <p className="text-sm text-gray-600">{canReview?.reason || "Du kannst diesen Künstler nicht bewerten."}</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white border-2 border-black rounded">
            <div>
                <label className="block text-sm font-bold mb-2">Bewertung *</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="text-3xl focus:outline-none transition-transform hover:scale-110"
                        >
                            {(hoveredRating >= star || rating >= star) ? "⭐" : "☆"}
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                        {rating === 1 && "Sehr schlecht"}
                        {rating === 2 && "Schlecht"}
                        {rating === 3 && "Okay"}
                        {rating === 4 && "Gut"}
                        {rating === 5 && "Ausgezeichnet"}
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="comment" className="block text-sm font-bold mb-2">
                    Kommentar (optional)
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Teile deine Erfahrung mit diesem Künstler..."
                    className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={4}
                    maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{comment.length}/500 Zeichen</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border-2 border-red-300 rounded">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <Button
                type="submit"
                variant="accent"
                disabled={submitting || rating === 0}
                className="w-full"
            >
                {submitting ? "Wird gespeichert..." : "Bewertung absenden"}
            </Button>
        </form>
    );
}

