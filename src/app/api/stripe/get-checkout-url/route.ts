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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json(
                { error: "Missing sessionId" },
                { status: 400 }
            );
        }

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session.url) {
            return NextResponse.json(
                { error: "Checkout session URL not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error getting checkout URL:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get checkout URL" },
            { status: 500 }
        );
    }
}



