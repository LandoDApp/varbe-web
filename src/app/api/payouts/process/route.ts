import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { Order, Payout } from "@/types";
import { calculateSellerBalance } from "@/lib/earnings";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-11-17.clover" as any,
});

/**
 * Process automatic payouts for all artists
 * Should be called on the 15th of each month via cron job
 */
export async function POST(request: NextRequest) {
    try {
        // Verify this is called from a cron job or admin
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { artistId } = await request.json().catch(() => ({}));
        
        // If artistId is provided, process only that artist (for testing)
        if (artistId) {
            const result = await processArtistPayout(artistId);
            return NextResponse.json(result);
        }

        // Otherwise, process all artists
        const usersRef = collection(db, "users");
        const artistsQuery = query(
            usersRef,
            where("verificationStatus", "==", "verified"),
            where("role", "in", ["seller", "admin"])
        );

        const artistsSnapshot = await getDocs(artistsQuery);
        const results = [];

        for (const artistDoc of artistsSnapshot.docs) {
            const artistId = artistDoc.id;
            try {
                const result = await processArtistPayout(artistId);
                results.push({ artistId, ...result });
            } catch (error: any) {
                results.push({ artistId, error: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
        });
    } catch (error: any) {
        console.error("Error processing payouts:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process payouts" },
            { status: 500 }
        );
    }
}

/**
 * Process payout for a single artist
 */
async function processArtistPayout(artistId: string) {
    // Get artist balance
    const balance = await calculateSellerBalance(artistId);
    
    // Check if minimum payout amount (10€) is available
    if (balance.availableBalance < 10) {
        return {
            skipped: true,
            reason: `Insufficient balance: €${balance.availableBalance.toFixed(2)} (minimum: €10)`,
        };
    }

    // Get user profile to check Stripe Connect status
    const userRef = doc(db, "users", artistId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        throw new Error("User not found");
    }

    const userData = userSnap.data();
    const stripeAccountId = userData.stripeAccountId;

    if (!stripeAccountId) {
        return {
            skipped: true,
            reason: "Stripe Connect not set up",
        };
    }

    // Verify Stripe account is active
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
        return {
            skipped: true,
            reason: "Stripe account not fully activated",
        };
    }

    // Get orders that will be included in this payout
    const ordersRef = collection(db, "orders");
    const artistOrdersQuery = query(
        ordersRef,
        where("sellerId", "==", artistId),
        where("status", "in", ["paid", "shipped", "delivered"])
    );

    const ordersSnapshot = await getDocs(artistOrdersQuery);
    const orders: Order[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Order));

    // Filter orders that are ready for payout (buyer protection expired)
    const now = Date.now();
    const ordersToPayout = orders.filter(order => {
        if (order.earningsStatus === 'paid_out') return false;
        if (order.buyerProtectionEndsAt && order.buyerProtectionEndsAt < now) {
            return true;
        }
        return false;
    });

    if (ordersToPayout.length === 0) {
        return {
            skipped: true,
            reason: "No orders ready for payout",
        };
    }

    // Calculate total payout amount
    const payoutAmount = ordersToPayout.reduce((sum, order) => {
        return sum + (order.artistEarnings || 0);
    }, 0);

    // Create payout record
    const payoutData: Omit<Payout, "id"> = {
        sellerId: artistId,
        amount: payoutAmount,
        status: 'processing',
        payoutDate: Date.now(),
        orderIds: ordersToPayout.map(o => o.id),
        createdAt: Date.now(),
    };

    const payoutRef = await addDoc(collection(db, "payouts"), payoutData);
    const payoutId = payoutRef.id;

    try {
        // Transfer money to artist via Stripe Connect
        const transfer = await stripe.transfers.create({
            amount: Math.round(payoutAmount * 100), // Convert to cents
            currency: 'eur',
            destination: stripeAccountId,
            metadata: {
                payoutId: payoutId,
                artistId: artistId,
                orderCount: ordersToPayout.length.toString(),
            },
        });

        // Update payout record
        await updateDoc(doc(db, "payouts", payoutId), {
            status: 'completed',
            completedAt: Date.now(),
            stripePayoutId: transfer.id,
        });

        // Mark orders as paid out
        for (const order of ordersToPayout) {
            await updateDoc(doc(db, "orders", order.id), {
                earningsStatus: 'paid_out',
                updatedAt: Date.now(),
            });
        }

        return {
            success: true,
            payoutId,
            amount: payoutAmount,
            ordersCount: ordersToPayout.length,
            stripeTransferId: transfer.id,
        };
    } catch (error: any) {
        // Update payout record as failed
        await updateDoc(doc(db, "payouts", payoutId), {
            status: 'failed',
        });

        throw error;
    }
}


