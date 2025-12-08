import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        
        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Server-side access bypasses Firestore Rules
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const profile: UserProfile = {
            uid: userSnap.id,
            ...userSnap.data()
        } as UserProfile;

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch user profile", details: error.message },
            { status: 500 }
        );
    }
}

