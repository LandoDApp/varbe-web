import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    return NextResponse.json({
        stripeSecretKey: {
            exists: !!stripeKey,
            length: stripeKey?.length || 0,
            startsWithSk: stripeKey?.startsWith("sk_") || false,
            preview: stripeKey ? `${stripeKey.substring(0, 20)}...${stripeKey.substring(stripeKey.length - 10)}` : "undefined",
            full: stripeKey || "NOT FOUND"
        },
        publishableKey: {
            exists: !!publishableKey,
            length: publishableKey?.length || 0,
            preview: publishableKey ? `${publishableKey.substring(0, 20)}...` : "undefined"
        },
        webhookSecret: {
            exists: !!webhookSecret,
            length: webhookSecret?.length || 0,
            preview: webhookSecret ? `${webhookSecret.substring(0, 20)}...` : "undefined"
        },
        allEnvVars: Object.keys(process.env).filter(k => k.includes("STRIPE"))
    });
}






