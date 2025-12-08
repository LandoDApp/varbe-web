import { NextResponse } from "next/server";
import { checkShippingDeadlines } from "@/lib/shipping";

/**
 * API Route to check shipping deadlines and send reminders/warnings/cancellations
 * This should be called daily via a cron job (e.g., Vercel Cron, Cloud Scheduler, etc.)
 * 
 * Example cron schedule: 0 9 * * * (every day at 9 AM)
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
        
        console.log("🔄 Checking shipping deadlines...");
        const result = await checkShippingDeadlines();
        
        return NextResponse.json({
            success: true,
            ...result,
            message: `Processed ${result.reminders} reminders, ${result.warnings} warnings, ${result.cancellations} cancellations`,
        });
    } catch (error) {
        const err = error as Error;
        console.error("❌ Error checking shipping deadlines:", err);
        return NextResponse.json(
            {
                error: err.message || "Failed to check shipping deadlines",
                details: process.env.NODE_ENV === "development" ? err.stack : undefined,
            },
            { status: 500 }
        );
    }
}






