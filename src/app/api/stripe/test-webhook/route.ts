import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    return NextResponse.json({
        webhookSecretExists: !!webhookSecret,
        webhookSecretLength: webhookSecret?.length || 0,
        webhookSecretPreview: webhookSecret ? `${webhookSecret.substring(0, 10)}...${webhookSecret.substring(webhookSecret.length - 10)}` : "Not set",
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/stripe/webhook`,
        message: webhookSecret 
            ? "✅ Webhook secret is configured. Make sure Stripe CLI is running: stripe listen --forward-to localhost:3000/api/stripe/webhook"
            : "❌ Webhook secret is not configured. Add STRIPE_WEBHOOK_SECRET to .env.local",
    });
}






