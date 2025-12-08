import { NextResponse } from "next/server";
import { deleteOldPendingOrders } from "@/lib/shipping";

/**
 * API Route to delete orders that have been pending for a week and are not paid
 * This should be called daily via a cron job (e.g., Vercel Cron, Cloud Scheduler, etc.)
 * 
 * Example cron schedule: 0 2 * * * (every day at 2 AM)
 */
export async function GET(request: Request) {
    try {
        // Optional: Add authentication/authorization check here
        // For example, check for a secret token in headers
        const authHeader = request.headers.get("authorization");
        const expectedToken = process.env.CRON_SECRET;
        
        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        console.log("🧹 Cleaning up old pending orders...");
        const deleted = await deleteOldPendingOrders();
        
        return NextResponse.json({
            success: true,
            deleted,
            message: `Deleted ${deleted} old pending orders`,
        });
    } catch (error) {
        const err = error as Error;
        console.error("❌ Error cleaning up pending orders:", err);
        return NextResponse.json(
            {
                error: err.message || "Failed to clean up pending orders",
                details: process.env.NODE_ENV === "development" ? err.stack : undefined,
            },
            { status: 500 }
        );
    }
}



