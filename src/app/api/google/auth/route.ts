import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Check if user has Google credentials in database
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    const connected = !!(user?.accessToken && user?.googleId);
    
    return NextResponse.json({ 
      connected,
      email: session.user.email 
    });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

