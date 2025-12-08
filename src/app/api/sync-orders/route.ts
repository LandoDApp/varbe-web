import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const getStripe = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || !secretKey.startsWith("sk_")) {
        throw new Error("Invalid or missing STRIPE_SECRET_KEY");
    }
    return new Stripe(secretKey, {
        apiVersion: "2025-11-17.clover" as any,
    });
};

/**
 * API Route to get Stripe checkout sessions for order synchronization
 * This allows the client to sync orders without needing server-side Firestore access
 */
export async function GET(request: NextRequest) {
    try {
        console.log("🔄 API: Fetching Stripe sessions...");
        const stripe = getStripe();
        
        // Get all Stripe checkout sessions (limit to recent ones)
        const sessions = await stripe.checkout.sessions.list({
            limit: 100,
        });
        
        console.log(`✅ API: Found ${sessions.data.length} Stripe sessions`);
        
        // Create a map of orderId -> session data
        const orderIdToSession: Record<string, {
            id: string;
            payment_status: string;
            status: string | null;
            payment_intent: string | Stripe.PaymentIntent | null;
        }> = {};
        
        for (const session of sessions.data) {
            const orderId = session.metadata?.orderId;
            if (orderId) {
                orderIdToSession[orderId] = {
                    id: session.id,
                    payment_status: session.payment_status,
                    status: session.status || null,
                    payment_intent: session.payment_intent,
                };
            }
        }
        
        return NextResponse.json({
            success: true,
            sessions: orderIdToSession,
            total: sessions.data.length,
        });
    } catch (error) {
        const err = error as Error;
        console.error("❌ API: Error fetching Stripe sessions:", err);
        return NextResponse.json(
            { 
                error: err.message || "Failed to fetch Stripe sessions",
            },
            { status: 500 }
        );
    }
}

