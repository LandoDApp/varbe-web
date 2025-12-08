import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
    try {
        const { email, locale = 'de', source = 'footer' } = await request.json();
        
        if (!email) {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            );
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email format" },
                { status: 400 }
            );
        }
        
        // Use email as document ID (sanitized)
        const emailId = email.toLowerCase().replace(/[.#$\/\[\]]/g, '_');
        const subscriberRef = doc(db, "newsletter_subscribers", emailId);
        
        // Save with locale preference
        await setDoc(subscriberRef, {
            email: email.toLowerCase(),
            locale: locale, // 'de' or 'en'
            subscribedAt: new Date().toISOString(),
            source: source, // 'footer', 'register', etc.
            active: true
        }, { merge: true });
        
        return NextResponse.json(
            { success: true, message: "Successfully subscribed" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Newsletter subscribe error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to subscribe" },
            { status: 500 }
        );
    }
}
