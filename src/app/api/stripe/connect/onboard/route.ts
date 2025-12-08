import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-11-17.clover" as any,
});

/**
 * Create Stripe Connect Express account and onboarding link
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Check if user already has a Stripe account
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        let accountId = userData.stripeAccountId;

        // Create Stripe Connect account if it doesn't exist
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'DE', // Default to Germany, can be changed
                email: userData.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            accountId = account.id;

            // Save account ID to user profile
            await updateDoc(userRef, {
                stripeAccountId: accountId,
                stripeAccountStatus: 'pending',
            });
        }

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/artist/dashboard?stripe_refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/artist/dashboard?stripe_success=true`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            success: true,
            url: accountLink.url,
            accountId: accountId,
        });
    } catch (error: any) {
        console.error("Error creating Stripe Connect onboarding:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create onboarding link" },
            { status: 500 }
        );
    }
}

/**
 * Get Stripe Connect account status
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        const accountId = userData.stripeAccountId;

        if (!accountId) {
            return NextResponse.json({
                connected: false,
                status: 'not_connected',
            });
        }

        // Get account details from Stripe
        const account = await stripe.accounts.retrieve(accountId);
        
        const isActive = account.details_submitted && account.charges_enabled && account.payouts_enabled;

        // Update user profile with current status
        await updateDoc(userRef, {
            stripeAccountStatus: isActive ? 'active' : 'pending',
        });

        return NextResponse.json({
            connected: true,
            status: isActive ? 'active' : 'pending',
            accountId: accountId,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
        });
    } catch (error: any) {
        console.error("Error getting Stripe Connect status:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get account status" },
            { status: 500 }
        );
    }
}



