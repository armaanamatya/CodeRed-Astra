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

    // Get user from database
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.microsoftAccessToken) {
      return NextResponse.json(
        { error: 'Microsoft account not connected' },
        { status: 400 }
      );
    }

    // Decode the token to see what scopes it has
    // JWT tokens have 3 parts separated by dots
    const tokenParts = user.microsoftAccessToken.split('.');
    
    if (tokenParts.length === 3) {
      try {
        // Decode the payload (second part)
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        
        return NextResponse.json({
          success: true,
          hasToken: true,
          tokenExpiry: user.microsoftTokenExpiry,
          isExpired: user.microsoftTokenExpiry ? new Date() >= user.microsoftTokenExpiry : false,
          scopes: payload.scp || payload.scope || 'No scopes found in token',
          audience: payload.aud,
          issuer: payload.iss,
        });
      } catch (e) {
        return NextResponse.json({
          success: true,
          hasToken: true,
          tokenExpiry: user.microsoftTokenExpiry,
          error: 'Could not decode token - it might be an opaque token',
        });
      }
    }

    return NextResponse.json({
      success: true,
      hasToken: true,
      tokenExpiry: user.microsoftTokenExpiry,
      error: 'Token format unexpected',
    });

  } catch (error) {
    console.error('Token info error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get token info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

