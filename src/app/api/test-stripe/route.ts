import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
    try {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        
        if (!secretKey) {
            return NextResponse.json({
                error: "STRIPE_SECRET_KEY not found",
                keyExists: false
            }, { status: 500 });
        }

        // Try to initialize Stripe
        const stripe = new Stripe(secretKey, {
            apiVersion: "2025-11-17.clover" as any,
        });

        // Try a simple API call to test the key
        const account = await stripe.accounts.retrieve();
        
        return NextResponse.json({
            success: true,
            message: "Stripe API Key is valid!",
            accountId: account.id,
            keyPreview: `${secretKey.substring(0, 20)}...${secretKey.substring(secretKey.length - 10)}`,
            keyLength: secretKey.length
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            errorType: error.type,
            errorCode: error.code,
            keyPreview: process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 10)}` : "undefined",
            keyLength: process.env.STRIPE_SECRET_KEY?.length || 0
        }, { status: 500 });
    }
}



