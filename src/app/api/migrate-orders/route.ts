// This route is no longer needed - migration runs client-side
// Keeping for backwards compatibility but it won't work without auth
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    return NextResponse.json(
        { 
            error: "Migration must be run client-side. Please use the button in the Artist Dashboard.",
        },
        { status: 400 }
    );
}

