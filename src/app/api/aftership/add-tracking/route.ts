import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Order } from '@/types';

// Ensure this route is not statically generated
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// AfterShip API Key (from Keys.md: asat_fbfc0873a99b49c3b9e71983b721172f)
const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY || 'asat_fbfc0873a99b49c3b9e71983b721172f';

// Map shipping provider names to AfterShip slugs
const CARRIER_SLUG_MAP: Record<string, string> = {
    'DHL': 'dhl-germany',
    'DPD': 'dpd',
    'Hermes': 'hermes-de',
    'Deutsche Post': 'deutsche-post',
    'UPS': 'ups',
    'FedEx': 'fedex',
    'GLS': 'gls',
    'Andere': 'auto-detect', // AfterShip can auto-detect carrier
};

/**
 * Convert shipping provider name to AfterShip slug
 */
function getCarrierSlug(provider: string): string {
    const normalized = provider.trim();
    return CARRIER_SLUG_MAP[normalized] || normalized.toLowerCase().replace(/\s+/g, '-');
}

export async function POST(request: NextRequest) {
    try {
        if (!AFTERSHIP_API_KEY) {
            return NextResponse.json(
                { error: 'AfterShip API key not configured' },
                { status: 500 }
            );
        }

        const { orderId, trackingNumber, shippingProvider } = await request.json();
        
        if (!orderId || !trackingNumber || !shippingProvider) {
            return NextResponse.json(
                { error: 'Order ID, tracking number, and shipping provider are required' },
                { status: 400 }
            );
        }
        
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }
        
        const order = orderSnap.data() as Order;
        
        if (order.status !== 'paid') {
            return NextResponse.json(
                { error: 'Order must be paid before adding tracking' },
                { status: 400 }
            );
        }
        
        // Get carrier slug for AfterShip
        const carrierSlug = getCarrierSlug(shippingProvider);
        
        console.log('Registering tracking with AfterShip:', {
            orderId,
            trackingNumber,
            carrierSlug,
        });
        
        // Register tracking with AfterShip
        const aftershipResponse = await fetch('https://api.aftership.com/v4/trackings', {
            method: 'POST',
            headers: {
                'aftership-api-key': AFTERSHIP_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tracking: {
                    tracking_number: trackingNumber.trim(),
                    slug: carrierSlug === 'auto-detect' ? undefined : carrierSlug,
                    title: `Order ${orderId}`,
                    order_id: orderId,
                    order_id_path: orderId,
                    // Add webhook URL for updates (will be set up separately)
                },
            }),
        });
        
        if (!aftershipResponse.ok) {
            const errorData = await aftershipResponse.json().catch(() => ({}));
            console.error('AfterShip API error:', errorData);
            
            // Check if tracking already exists
            if (aftershipResponse.status === 400 && errorData.meta?.message?.includes('already exists')) {
                // Try to get existing tracking
                return NextResponse.json(
                    { error: 'Tracking number already registered. Please use a different number or contact support.' },
                    { status: 400 }
                );
            }
            
            return NextResponse.json(
                { 
                    error: errorData.meta?.message || 'Failed to register tracking with AfterShip',
                    details: errorData
                },
                { status: aftershipResponse.status }
            );
        }
        
        const aftershipData = await aftershipResponse.json();
        const tracking = aftershipData.data?.tracking;
        
        if (!tracking) {
            return NextResponse.json(
                { error: 'Invalid response from AfterShip' },
                { status: 500 }
            );
        }
        
        console.log('AfterShip tracking response:', {
            id: tracking.id,
            tag: tracking.tag,
            subtag: tracking.subtag,
            expected_delivery: tracking.expected_delivery,
        });
        
        // Check if tracking number is invalid
        if (tracking.tag === 'Exception') {
            return NextResponse.json(
                { 
                    error: `Ungültige Tracking-Nummer: ${tracking.subtag_message || tracking.subtag || 'Tracking-Nummer nicht gefunden'}`,
                    invalid: true,
                    tag: tracking.tag,
                    subtag: tracking.subtag,
                    subtag_message: tracking.subtag_message,
                },
                { status: 400 }
            );
        }
        
        // Update order with tracking information
        const trackingSubmittedAt = Date.now();
        
        await updateDoc(orderRef, {
            trackingNumber: trackingNumber.trim(),
            trackingStatus: 'approved', // Auto-approved when validated by AfterShip
            trackingSubmittedAt,
            trackingApprovedAt: trackingSubmittedAt, // Auto-approved since AfterShip validated it
            shippingProvider,
            shippedAt: trackingSubmittedAt,
            status: 'shipped',
            // AfterShip tracking data
            aftershipTrackingId: tracking.id,
            trackingTag: tracking.tag, // Status: InTransit, Delivered, etc.
            trackingSubtag: tracking.subtag,
            expectedDelivery: tracking.expected_delivery ? new Date(tracking.expected_delivery).getTime() : null,
            trackingCheckpoints: tracking.checkpoints || [],
            updatedAt: Date.now(),
        });
        
        return NextResponse.json({
            success: true,
            tracking: {
                id: tracking.id,
                tag: tracking.tag,
                subtag: tracking.subtag,
                expected_delivery: tracking.expected_delivery,
                eta: tracking.expected_delivery,
                checkpoints: tracking.checkpoints || [],
            },
            message: 'Tracking erfolgreich registriert und validiert! ✅',
        });
        
    } catch (error: any) {
        console.error('AfterShip tracking registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to register tracking' },
            { status: 500 }
        );
    }
}

