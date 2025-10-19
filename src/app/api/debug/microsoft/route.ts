import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found in database'
      });
    }

    return NextResponse.json({
      success: true,
      microsoft: {
        hasAccessToken: !!user.microsoftAccessToken,
        hasRefreshToken: !!user.microsoftRefreshToken,
        tokenExpiry: user.microsoftTokenExpiry,
        isExpired: user.microsoftTokenExpiry ? new Date() >= user.microsoftTokenExpiry : null,
        microsoftId: user.microsoftId,
        accessTokenLength: user.microsoftAccessToken?.length || 0,
        refreshTokenLength: user.microsoftRefreshToken?.length || 0,
      },
      google: {
        hasAccessToken: !!user.accessToken,
        hasRefreshToken: !!user.refreshToken,
        tokenExpiry: user.tokenExpiry,
        isExpired: user.tokenExpiry ? new Date() >= user.tokenExpiry : null,
        googleId: user.googleId,
      }
    });

  } catch (error) {
    console.error('Debug Microsoft error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get Microsoft debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
