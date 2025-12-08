import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-11-17.clover" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
    console.log("🔔 Webhook received!");
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    console.log("📝 Webhook Secret exists:", !!webhookSecret);
    console.log("📝 Webhook Secret length:", webhookSecret.length);
    console.log("📝 Signature exists:", !!signature);

    if (!signature) {
        console.error("❌ No signature in webhook request");
        return NextResponse.json(
            { error: "No signature" },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log("✅ Webhook signature verified");
        console.log("📦 Event type:", event.type);
    } catch (err: any) {
        console.error("❌ Webhook signature verification failed:", err.message);
        console.error("❌ Error details:", err);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        console.log("✅ Processing checkout.session.completed event");
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        
        console.log("📋 Session ID:", session.id);
        console.log("📋 Order ID from metadata:", orderId);
        console.log("📋 Payment Intent:", session.payment_intent);
        console.log("📋 Payment Status:", session.payment_status);
        console.log("📋 Amount Total:", session.amount_total);

        if (!orderId) {
            console.error("❌ No orderId in session metadata!");
            console.error("📋 Session metadata:", session.metadata);
            return NextResponse.json(
                { error: "No orderId in session metadata" },
                { status: 400 }
            );
        }

        console.log(`🔄 Processing order ${orderId}...`);
        try {
            // Update order status to paid
            const orderRef = doc(db, "orders", orderId);
            const orderSnap = await getDoc(orderRef);
            
            if (!orderSnap.exists()) {
                console.error(`❌ Order ${orderId} not found in Firestore!`);
                return NextResponse.json(
                    { error: `Order ${orderId} not found` },
                    { status: 404 }
                );
            }
            
            const orderData = orderSnap.data();
            console.log(`📦 Order found: ${orderId}`);
            console.log(`📦 Current order status: ${orderData.status}`);
            console.log(`📦 Order amount: €${orderData.amount}`);
            console.log(`📦 Listing ID: ${orderData.listingId}`);
                
                    // Calculate shipping deadline (5 business days from payment)
                    const paidAt = Date.now();
                    const { calculateShippingDeadline } = await import("@/lib/shipping");
                    const shippingDeadline = calculateShippingDeadline(paidAt);
                    
                    await updateDoc(orderRef, {
                        status: "paid",
                        stripePaymentIntentId: session.payment_intent,
                        paidAt: paidAt,
                        shippingDeadline: shippingDeadline,
                        updatedAt: Date.now(),
                    });
                    console.log(`✅ Order ${orderId} marked as paid`);
                    
                    // Create notification for buyer
                    try {
                        const { notifyPurchaseSuccess } = await import("@/lib/notifications");
                        const listingRef = doc(db, "artworks", orderData.listingId);
                        const listingSnap = await getDoc(listingRef);
                        if (listingSnap.exists()) {
                            const listingData = listingSnap.data();
                            await notifyPurchaseSuccess(orderId, orderData.buyerId, orderData.listingId, listingData.title || "Artwork");
                        }
                    } catch (notifError) {
                        console.error("Error creating purchase notification:", notifError);
                    }
                    
                    // Create notification for seller/artist about paid order
                    try {
                        const { notifyNewOrder, notificationExistsForOrder } = await import("@/lib/notifications");
                        const listingRef = doc(db, "artworks", orderData.listingId);
                        const listingSnap = await getDoc(listingRef);
                        if (listingSnap.exists()) {
                            const listingData = listingSnap.data();
                            // Create notification for all orders (including pickup)
                            const exists = await notificationExistsForOrder(orderData.sellerId, orderId);
                            if (!exists) {
                                await notifyNewOrder(
                                    orderId,
                                    orderData.sellerId,
                                    orderData.listingId,
                                    listingData.title || "Artwork",
                                    orderData.quantity || 1,
                                                    false // Pickup is no longer supported
                                );
                            }
                        }
                    } catch (notifError) {
                        console.error("Error creating seller notification:", notifError);
                    }
            console.log(`💰 Order amount: €${orderData.amount}`);
                
            // Update listing quantity and mark as sold only if quantity reaches 0
            if (orderData.listingId) {
                const listingRef = doc(db, "artworks", orderData.listingId);
                const listingSnap = await getDoc(listingRef);
                
                if (listingSnap.exists()) {
                    const listingData = listingSnap.data();
                    const orderQuantity = orderData.quantity || 1;
                    const currentQuantity = listingData.quantity !== undefined ? listingData.quantity : 1;
                    const newQuantity = Math.max(0, currentQuantity - orderQuantity);
                    
                    const updateData: any = {
                        updatedAt: Date.now(),
                    };
                    
                    // Update quantity
                    if (listingData.quantity !== undefined) {
                        updateData.quantity = newQuantity;
                    }
                    
                    // Mark as sold only if quantity reaches 0
                    if (newQuantity === 0) {
                        updateData.status = 'sold';
                        console.log(`✅ Listing ${orderData.listingId} marked as sold (quantity reached 0)`);
                    } else {
                        console.log(`✅ Listing ${orderData.listingId} quantity updated: ${currentQuantity} -> ${newQuantity}`);
                    }
                    
                    await updateDoc(listingRef, updateData);
                    console.log(`📦 Listing title: ${listingSnap.data()?.title || 'Unknown'}`);
                } else {
                    console.error(`❌ Listing ${orderData.listingId} not found`);
                }
            } else {
                console.warn(`⚠️ Order ${orderId} has no listingId`);
            }
        } catch (error) {
            const err = error as Error;
            console.error("❌ Error updating order/listing:", err);
            console.error("❌ Error stack:", err.stack);
            return NextResponse.json(
                { error: `Failed to update order: ${err.message}` },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ received: true });
}
