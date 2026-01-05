import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

export async function GET() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getCountFromServer(usersRef);
        const count = snapshot.data().count;
        
        return NextResponse.json({ count }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        console.error('Error getting user count:', error);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}

