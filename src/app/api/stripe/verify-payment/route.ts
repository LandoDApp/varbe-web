import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
        console.log("🔍 verify-payment route called");
        const body = await request.json();
        console.log("📦 Request body:", { orderId: body.orderId, sessionId: body.sessionId ? "present" : "missing" });
        
        const { orderId, sessionId } = body;

        if (!orderId) {
            console.error("❌ Missing orderId");
            return NextResponse.json(
                { error: "Missing orderId" },
                { status: 400 }
            );
        }

        // If no sessionId provided, try to find it from Stripe by searching for sessions with this orderId
        if (!sessionId) {
            console.log("ℹ️ No sessionId provided, searching Stripe for sessions with this orderId");
            try {
                const stripe = getStripe();
                // Search for checkout sessions with this orderId in metadata
                const sessions = await stripe.checkout.sessions.list({
                    limit: 10,
                });
                
                // Find session with matching orderId in metadata
                const matchingSession = sessions.data.find(
                    (s) => s.metadata?.orderId === orderId
                );
                
                if (matchingSession) {
                    console.log(`✅ Found session ${matchingSession.id} for order ${orderId}`);
                    // Recursively call with sessionId
                    const session = await stripe.checkout.sessions.retrieve(matchingSession.id);
                    
                    if (session.payment_status === "paid" && session.status === "complete") {
                        // Get listingId from session metadata (if available)
                        const listingId = session.metadata?.listingId;
                        console.log(`📦 Session metadata:`, session.metadata);
                        console.log(`📦 ListingId from metadata:`, listingId);
                        
                        // Update order in Firestore
                        const orderRef = doc(db, "orders", orderId);
                        
                        // Update order status
                        try {
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
                                const orderSnap = await getDoc(orderRef);
                                if (orderSnap.exists()) {
                                    const orderData = orderSnap.data();
                                    if (listingId) {
                                        const listingRef = doc(db, "artworks", listingId);
                                        const listingSnap = await getDoc(listingRef);
                                        if (listingSnap.exists()) {
                                            const listingData = listingSnap.data();
                                            await notifyPurchaseSuccess(orderId, orderData.buyerId, listingId, listingData.title || "Artwork");
                                        }
                                    }
                                }
                            } catch (notifError) {
                                console.error("Error creating purchase notification:", notifError);
                            }
                            
                            // Create notification for seller/artist about paid order
                            try {
                                const { notifyNewOrder, notificationExistsForOrder } = await import("@/lib/notifications");
                                const orderSnap = await getDoc(orderRef);
                                if (orderSnap.exists()) {
                                    const orderData = orderSnap.data();
                                    if (listingId) {
                                        const listingRef = doc(db, "artworks", listingId);
                                        const listingSnap = await getDoc(listingRef);
                                        if (listingSnap.exists()) {
                                            const listingData = listingSnap.data();
                                            const exists = await notificationExistsForOrder(orderData.sellerId, orderId);
                                            if (!exists) {
                                                await notifyNewOrder(
                                                    orderId,
                                                    orderData.sellerId,
                                                    listingId,
                                                    listingData.title || "Artwork",
                                                    orderData.quantity || 1,
                                                    false // Pickup is no longer supported
                                                );
                                            }
                                        }
                                    }
                                }
                            } catch (notifError) {
                                console.error("Error creating seller notification:", notifError);
                            }
                            
                            // Update listing quantity and mark as sold only if quantity reaches 0
                            if (listingId) {
                                try {
                                    const orderSnap = await getDoc(orderRef);
                                    const orderData = orderSnap.exists() ? orderSnap.data() : null;
                                    const orderQuantity = orderData?.quantity || 1;
                                    
                                    const listingRef = doc(db, "artworks", listingId);
                                    const listingSnap = await getDoc(listingRef);
                                    
                                    if (listingSnap.exists()) {
                                        const listingData = listingSnap.data();
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
                                            console.log(`✅ Listing ${listingId} marked as sold (quantity reached 0)`);
                                        } else {
                                            console.log(`✅ Listing ${listingId} quantity updated: ${currentQuantity} -> ${newQuantity}`);
                                        }
                                        
                                        await updateDoc(listingRef, updateData);
                                    }
                                } catch (listingError) {
                                    console.error(`❌ Could not update listing ${listingId}:`, listingError);
                                    console.error(`❌ Listing error details:`, listingError);
                                }
                            } else {
                                console.warn(`⚠️ No listingId in session metadata for order ${orderId}`);
                                // Try to get listingId from order document
                                try {
                                    const orderSnap = await getDoc(orderRef);
                                    if (orderSnap.exists()) {
                                        const orderData = orderSnap.data();
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
                                            }
                                        }
                                    }
                                } catch (fallbackError) {
                                    console.error(`❌ Could not get listingId from order:`, fallbackError);
                                }
                            }
                        } catch (updateError) {
                            console.error(`❌ Could not update order ${orderId}:`, updateError);
                            // Still return success if Stripe says it's paid
                        }
                        
                        return NextResponse.json({
                            paid: true,
                            status: "paid",
                        });
                    } else {
                        return NextResponse.json({
                            paid: false,
                            status: session.payment_status,
                        });
                    }
                } else {
                    console.log(`ℹ️ No matching session found for order ${orderId}`);
                    return NextResponse.json({
                        paid: false,
                        status: "pending",
                    });
                }
            } catch (stripeError) {
                const err = stripeError as Error;
                console.error("❌ Stripe search error:", err);
                // Fallback: return pending status
                return NextResponse.json({
                    paid: false,
                    status: "pending",
                });
            }
        }

        // Verify payment with Stripe
        console.log("🔍 Initializing Stripe...");
        let stripe;
        try {
            stripe = getStripe();
            console.log("✅ Stripe initialized");
        } catch (stripeError) {
            const err = stripeError as Error;
            console.error("❌ Stripe initialization error:", err.message);
            throw new Error(`Stripe initialization failed: ${err.message}`);
        }
        
        console.log(`🔍 Retrieving Stripe session: ${sessionId}`);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log("🔍 Verifying payment for session:", sessionId);
        console.log("📋 Payment status:", session.payment_status);
        console.log("📋 Session status:", session.status);

        // Check if payment was successful
        if (session.payment_status === "paid" && session.status === "complete") {
            // Get listingId from session metadata (if available)
            const listingId = session.metadata?.listingId;
            console.log(`📦 Session metadata:`, session.metadata);
            console.log(`📦 ListingId from metadata:`, listingId);
            
            // Update order in Firestore
            const orderRef = doc(db, "orders", orderId);
            
            // Update order status
            try {
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
                console.log(`✅ Order ${orderId} marked as paid via direct verification`);
                
                // Create notification for buyer
                try {
                    const { notifyPurchaseSuccess } = await import("@/lib/notifications");
                    const orderSnap = await getDoc(orderRef);
                    if (orderSnap.exists()) {
                        const orderData = orderSnap.data();
                        if (listingId) {
                            const listingRef = doc(db, "artworks", listingId);
                            const listingSnap = await getDoc(listingRef);
                            if (listingSnap.exists()) {
                                const listingData = listingSnap.data();
                                await notifyPurchaseSuccess(orderId, orderData.buyerId, listingId, listingData.title || "Artwork");
                            }
                        }
                    }
                } catch (notifError) {
                    console.error("Error creating purchase notification:", notifError);
                }
                
                // Create notification for seller/artist about paid order
                try {
                    const { notifyNewOrder, notificationExistsForOrder } = await import("@/lib/notifications");
                    const orderSnap = await getDoc(orderRef);
                    if (orderSnap.exists()) {
                        const orderData = orderSnap.data();
                        if (listingId) {
                            const listingRef = doc(db, "artworks", listingId);
                            const listingSnap = await getDoc(listingRef);
                            if (listingSnap.exists()) {
                                const listingData = listingSnap.data();
                                const exists = await notificationExistsForOrder(orderData.sellerId, orderId);
                                if (!exists) {
                                    await notifyNewOrder(
                                        orderId,
                                        orderData.sellerId,
                                        listingId,
                                        listingData.title || "Artwork",
                                        orderData.quantity || 1,
                                        orderData.shippingType === 'pickup'
                                    );
                                }
                            }
                        }
                    }
                } catch (notifError) {
                    console.error("Error creating seller notification:", notifError);
                }
                
                // Update listing quantity and mark as sold only if quantity reaches 0
                if (listingId) {
                    try {
                        const orderSnap = await getDoc(orderRef);
                        const orderData = orderSnap.exists() ? orderSnap.data() : null;
                        const orderQuantity = orderData?.quantity || 1;
                        
                        const listingRef = doc(db, "artworks", listingId);
                        const listingSnap = await getDoc(listingRef);
                        
                        if (listingSnap.exists()) {
                            const listingData = listingSnap.data();
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
                                console.log(`✅ Listing ${listingId} marked as sold (quantity reached 0)`);
                            } else {
                                console.log(`✅ Listing ${listingId} quantity updated: ${currentQuantity} -> ${newQuantity}`);
                            }
                            
                            await updateDoc(listingRef, updateData);
                        }
                    } catch (listingError) {
                        console.error(`❌ Could not update listing ${listingId}:`, listingError);
                        console.error(`❌ Listing error details:`, listingError);
                    }
                } else {
                    console.warn(`⚠️ No listingId in session metadata for order ${orderId}`);
                    // Try to get listingId from order document
                    try {
                        const orderSnap = await getDoc(orderRef);
                        if (orderSnap.exists()) {
                            const orderData = orderSnap.data();
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
                                }
                            }
                        }
                    } catch (fallbackError) {
                        console.error(`❌ Could not get listingId from order:`, fallbackError);
                    }
                }
            } catch (updateError) {
                console.error(`❌ Could not update order ${orderId}:`, updateError);
                // Still return success if Stripe says it's paid
            }
            
            return NextResponse.json({
                paid: true,
                status: "paid",
            });
        } else {
            return NextResponse.json({
                paid: false,
                status: session.payment_status,
            });
        }
    } catch (error) {
        const err = error as Error;
        console.error("❌ Error verifying payment:", err);
        console.error("❌ Error stack:", err.stack);
        console.error("❌ Error name:", err.name);
        return NextResponse.json(
            { 
                error: err.message || "Failed to verify payment",
                details: process.env.NODE_ENV === "development" ? err.stack : undefined,
            },
            { status: 500 }
        );
    }
}

