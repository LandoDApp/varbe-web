import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Order } from '@/types';
import { notifyOrderDelivered, notifyPleaseReview } from '@/lib/notifications';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * AfterShip Webhook Handler
 * Receives tracking updates from AfterShip automatically
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('AfterShip webhook received:', {
            event: body.meta?.type,
            tracking_number: body.msg?.tracking_number,
            tag: body.msg?.tag,
        });
        
        // AfterShip webhook structure
        const tracking = body.msg;
        if (!tracking) {
            return NextResponse.json(
                { error: 'Invalid webhook payload' },
                { status: 400 }
            );
        }
        
        // Get order ID from tracking metadata
        const orderId = tracking.order_id || tracking.order_id_path;
        if (!orderId) {
            console.warn('No order ID found in AfterShip webhook');
            return NextResponse.json({ success: true, message: 'No order ID' });
        }
        
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) {
            console.warn(`Order ${orderId} not found for AfterShip webhook`);
            return NextResponse.json({ success: true, message: 'Order not found' });
        }
        
        const order = orderSnap.data() as Order;
        
        // Update order with latest tracking information
        const updateData: any = {
            trackingTag: tracking.tag,
            trackingSubtag: tracking.subtag,
            updatedAt: Date.now(),
        };
        
        // Update expected delivery if available
        if (tracking.expected_delivery) {
            updateData.expectedDelivery = new Date(tracking.expected_delivery).getTime();
        }
        
        // Update checkpoints/history
        if (tracking.checkpoints && Array.isArray(tracking.checkpoints)) {
            updateData.trackingCheckpoints = tracking.checkpoints;
        }
        
        // Handle specific status changes
        if (tracking.tag === 'Delivered' && order.status !== 'delivered') {
            // Package was delivered!
            const deliveredAt = tracking.checkpoints?.[0]?.checkpoint_time 
                ? new Date(tracking.checkpoints[0].checkpoint_time).getTime()
                : Date.now();
            
            updateData.status = 'delivered';
            updateData.deliveredAt = deliveredAt;
            updateData.buyerProtectionEndsAt = deliveredAt + (14 * 24 * 60 * 60 * 1000); // 14 days from delivery
            updateData.buyerProtectionStatus = 'active';
            updateData.earningsStatus = 'pending'; // In buyer protection - money will be available after 14 days
            
            // Notify buyer that package was delivered
            try {
                await notifyOrderDelivered(orderId, order.buyerId, order.listingId);
            } catch (notifError) {
                console.error('Error sending delivery notification:', notifError);
            }
            
            // Notify buyer to review the artist
            try {
                await notifyPleaseReview(orderId, order.buyerId, order.sellerId, order.listingId);
            } catch (notifError) {
                console.error('Error sending review request notification:', notifError);
            }
            
            console.log(`Order ${orderId} delivered! Buyer protection started. 14 days until earnings available.`);
        } else if (tracking.tag === 'OutForDelivery') {
            // Package is out for delivery today
            try {
                // TODO: Send "Your package is arriving today!" notification
                console.log(`Order ${orderId} out for delivery!`);
            } catch (notifError) {
                console.error('Error sending out-for-delivery notification:', notifError);
            }
        }
        
        await updateDoc(orderRef, updateData);
        
        return NextResponse.json({ 
            success: true,
            message: 'Tracking updated',
            orderId,
            tag: tracking.tag,
        });
        
    } catch (error: any) {
        console.error('AfterShip webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process webhook' },
            { status: 500 }
        );
    }
}

// Also handle GET for webhook verification (some services ping the endpoint)
export async function GET(request: NextRequest) {
    return NextResponse.json({ 
        success: true,
        message: 'AfterShip webhook endpoint is active',
    });
}

