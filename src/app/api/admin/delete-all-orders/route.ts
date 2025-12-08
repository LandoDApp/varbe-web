import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, writeBatch } from "firebase/firestore";

export async function POST(request: NextRequest) {
    try {
        console.log("🔍 Admin delete-all-orders API called");
        const body = await request.json();
        const { type, userId } = body;

        console.log("📦 Request body:", { type, userId });

        if (!userId) {
            console.error("❌ Missing userId");
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 }
            );
        }

        if (!type) {
            console.error("❌ Missing type");
            return NextResponse.json(
                { error: "Missing type" },
                { status: 400 }
            );
        }

        // Verify user is admin
        console.log("🔍 Verifying admin status for user:", userId);
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                console.error("❌ User not found:", userId);
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            const userData = userSnap.data();
            console.log("👤 User data:", { role: userData.role, email: userData.email });
            
            if (userData.role !== 'admin') {
                console.error("❌ User is not admin:", userData.role);
                return NextResponse.json(
                    { error: "Unauthorized: Admin access required" },
                    { status: 403 }
                );
            }
            console.log("✅ Admin verified");
        } catch (authError: any) {
            console.error("❌ Error verifying admin:", authError);
            return NextResponse.json(
                { error: `Failed to verify admin: ${authError.message}` },
                { status: 500 }
            );
        }

        let deleted = 0;
        const batchSize = 500; // Firestore batch limit

        console.log(`🗑️ Starting deletion of ${type}...`);

        switch (type) {
            case 'orders': {
                try {
                    console.log("📦 Fetching orders...");
                    const ordersRef = collection(db, "orders");
                    const ordersSnapshot = await getDocs(ordersRef);
                    const orders = ordersSnapshot.docs;
                    console.log(`📦 Found ${orders.length} orders to delete`);
                    
                    for (let i = 0; i < orders.length; i += batchSize) {
                        const batch = writeBatch(db);
                        const batchOrders = orders.slice(i, i + batchSize);
                        
                        batchOrders.forEach((orderDoc) => {
                            batch.delete(orderDoc.ref);
                        });
                        
                        console.log(`🗑️ Deleting batch ${Math.floor(i / batchSize) + 1} (${batchOrders.length} orders)...`);
                        await batch.commit();
                        deleted += batchOrders.length;
                        console.log(`✅ Deleted ${deleted} orders so far`);
                    }
                } catch (ordersError: any) {
                    console.error("❌ Error deleting orders:", ordersError);
                    throw new Error(`Failed to delete orders: ${ordersError.message}`);
                }
                break;
            }
            case 'revenue': {
                try {
                    console.log("💰 Fetching seller balances...");
                    const balancesRef = collection(db, "sellerBalances");
                    const balancesSnapshot = await getDocs(balancesRef);
                    const balances = balancesSnapshot.docs;
                    console.log(`💰 Found ${balances.length} balances to delete`);
                    
                    for (let i = 0; i < balances.length; i += batchSize) {
                        const batch = writeBatch(db);
                        const batchBalances = balances.slice(i, i + batchSize);
                        
                        batchBalances.forEach((balanceDoc) => {
                            batch.delete(balanceDoc.ref);
                        });
                        
                        console.log(`🗑️ Deleting batch ${Math.floor(i / batchSize) + 1} (${batchBalances.length} balances)...`);
                        await batch.commit();
                        deleted += batchBalances.length;
                        console.log(`✅ Deleted ${deleted} balances so far`);
                    }
                } catch (revenueError: any) {
                    console.error("❌ Error deleting revenue:", revenueError);
                    throw new Error(`Failed to delete revenue: ${revenueError.message}`);
                }
                break;
            }
            case 'notifications': {
                try {
                    console.log("🔔 Fetching notifications...");
                    const notificationsRef = collection(db, "notifications");
                    const notificationsSnapshot = await getDocs(notificationsRef);
                    const notifications = notificationsSnapshot.docs;
                    console.log(`🔔 Found ${notifications.length} notifications to delete`);
                    
                    for (let i = 0; i < notifications.length; i += batchSize) {
                        const batch = writeBatch(db);
                        const batchNotifications = notifications.slice(i, i + batchSize);
                        
                        batchNotifications.forEach((notificationDoc) => {
                            batch.delete(notificationDoc.ref);
                        });
                        
                        console.log(`🗑️ Deleting batch ${Math.floor(i / batchSize) + 1} (${batchNotifications.length} notifications)...`);
                        await batch.commit();
                        deleted += batchNotifications.length;
                        console.log(`✅ Deleted ${deleted} notifications so far`);
                    }
                } catch (notificationsError: any) {
                    console.error("❌ Error deleting notifications:", notificationsError);
                    throw new Error(`Failed to delete notifications: ${notificationsError.message}`);
                }
                break;
            }
            default:
                console.error("❌ Invalid type:", type);
                return NextResponse.json(
                    { error: "Invalid type. Must be 'orders', 'revenue', or 'notifications'" },
                    { status: 400 }
                );
        }

        console.log(`✅ Successfully deleted ${deleted} ${type}`);
        return NextResponse.json({ 
            success: true, 
            deleted,
            message: `Successfully deleted ${deleted} ${type}`
        });
    } catch (error: any) {
        console.error("❌ Error in delete-all-orders API:", error);
        console.error("❌ Error stack:", error.stack);
        return NextResponse.json(
            { 
                error: error.message || "Failed to delete",
                details: process.env.NODE_ENV === "development" ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

