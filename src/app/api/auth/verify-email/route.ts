import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();
        
        if (!token) {
            return NextResponse.json(
                { success: false, error: "missing_token" },
                { status: 400 }
            );
        }
        
        // Get token from Firestore
        const tokenRef = doc(db, "email_verification_tokens", token);
        const tokenSnap = await getDoc(tokenRef);
        
        if (!tokenSnap.exists()) {
            return NextResponse.json(
                { success: false, error: "invalid_token" },
                { status: 400 }
            );
        }
        
        const tokenData = tokenSnap.data();
        
        // Check if token was already used
        if (tokenData.used) {
            return NextResponse.json(
                { success: false, error: "token_already_used" },
                { status: 400 }
            );
        }
        
        // Check if token is expired
        if (Date.now() > tokenData.expiresAt) {
            // Delete expired token
            await deleteDoc(tokenRef);
            return NextResponse.json(
                { success: false, error: "token_expired" },
                { status: 400 }
            );
        }
        
        // Mark user as email verified
        const userRef = doc(db, "users", tokenData.userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return NextResponse.json(
                { success: false, error: "user_not_found" },
                { status: 404 }
            );
        }
        
        // Update user document
        await updateDoc(userRef, {
            emailVerified: true,
            emailVerifiedAt: Date.now()
        });
        
        // Mark token as used
        await updateDoc(tokenRef, {
            used: true,
            usedAt: Date.now()
        });
        
        console.log("Email verified successfully for user:", tokenData.userId);
        
        return NextResponse.json(
            { success: true, message: "Email verified successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verify email error:", error);
        return NextResponse.json(
            { success: false, error: "verification_failed" },
            { status: 500 }
        );
    }
}

// Also support GET for direct link clicks (will redirect)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
        return NextResponse.redirect(new URL('/auth/verify-email?error=missing_token', request.url));
    }
    
    // Process the token
    try {
        const tokenRef = doc(db, "email_verification_tokens", token);
        const tokenSnap = await getDoc(tokenRef);
        
        if (!tokenSnap.exists()) {
            return NextResponse.redirect(new URL('/auth/verify-email?error=invalid_token', request.url));
        }
        
        const tokenData = tokenSnap.data();
        
        if (tokenData.used) {
            return NextResponse.redirect(new URL('/auth/verify-email?error=token_already_used', request.url));
        }
        
        if (Date.now() > tokenData.expiresAt) {
            await deleteDoc(tokenRef);
            return NextResponse.redirect(new URL('/auth/verify-email?error=token_expired', request.url));
        }
        
        // Mark user as verified
        const userRef = doc(db, "users", tokenData.userId);
        await updateDoc(userRef, {
            emailVerified: true,
            emailVerifiedAt: Date.now()
        });
        
        // Mark token as used
        await updateDoc(tokenRef, {
            used: true,
            usedAt: Date.now()
        });
        
        // Redirect to success page
        return NextResponse.redirect(new URL('/auth/verify-email?success=true', request.url));
    } catch (error) {
        console.error("Verify email GET error:", error);
        return NextResponse.redirect(new URL('/auth/verify-email?error=verification_failed', request.url));
    }
}


