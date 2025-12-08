import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with validation
const getStripe = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || !secretKey.startsWith("sk_")) {
        throw new Error("Invalid or missing STRIPE_SECRET_KEY");
    }
    return new Stripe(secretKey, {
        apiVersion: "2025-11-17.clover" as any,
    });
};

export async function POST(request: NextRequest) {
    try {
        // Debug logging (remove in production)
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        console.log("🔍 Stripe Key Check:");
        console.log("  - Key exists:", !!stripeKey);
        console.log("  - Key length:", stripeKey?.length);
        console.log("  - Key starts with sk_:", stripeKey?.startsWith("sk_"));
        console.log("  - Key preview:", stripeKey ? `${stripeKey.substring(0, 20)}...${stripeKey.substring(stripeKey.length - 10)}` : "undefined");
        
        // Initialize Stripe (will throw if key is invalid)
        const stripe = getStripe();
        
        const { orderId, amount, currency = "eur", listingId, shippingCost, salePrice } = await request.json();

        if (!orderId || !amount) {
            return NextResponse.json(
                { error: "Missing orderId or amount" },
                { status: 400 }
            );
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        // Build line items: artwork price + shipping (if applicable)
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        
        // Artwork price (salePrice or amount if no shipping)
        const artworkPrice = salePrice !== undefined ? salePrice : (shippingCost ? amount - shippingCost : amount);
        if (artworkPrice > 0) {
            lineItems.push({
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: `Order #${orderId.slice(0, 8)}`,
                        description: "Artwork purchase",
                    },
                    unit_amount: Math.round(artworkPrice * 100), // Convert to cents
                },
                quantity: 1,
            });
        }
        
        // Shipping cost (if applicable)
        if (shippingCost && shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: "Shipping",
                        description: "Shipping costs",
                    },
                    unit_amount: Math.round(shippingCost * 100), // Convert to cents
                },
                quantity: 1,
            });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "paypal"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/orders/${orderId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/orders/${orderId}?canceled=true`,
            metadata: {
                orderId: orderId,
                ...(listingId ? { listingId: listingId } : {}),
            },
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (error: any) {
        console.error("Error creating Stripe checkout session:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}

