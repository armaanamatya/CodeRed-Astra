import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Connect to database and remove Microsoft tokens
    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $unset: {
          microsoftId: '',
          microsoftAccessToken: '',
          microsoftRefreshToken: '',
          microsoftTokenExpiry: ''
        }
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log('Microsoft account disconnected for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Microsoft account disconnected successfully'
    });

  } catch (error) {
    console.error('Microsoft disconnect error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disconnect Microsoft account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

