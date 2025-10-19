import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('Microsoft auth route called');
    
    // Check environment variables
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Microsoft environment variables not configured' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Check if Microsoft is already connected
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Check if Microsoft is already connected
    if (user.microsoftAccessToken) {
      console.log('Microsoft already connected for user:', user.email);
      return NextResponse.json({
        success: true,
        connected: true,
        message: 'Microsoft account already connected',
        microsoftEmail: user.microsoftId ? 'Connected' : 'Not available',
      });
    }

    // Generate Microsoft OAuth URL
    const microsoftAuthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    microsoftAuthUrl.searchParams.set('client_id', clientId);
    microsoftAuthUrl.searchParams.set('response_type', 'code');
    microsoftAuthUrl.searchParams.set('redirect_uri', redirectUri);
    microsoftAuthUrl.searchParams.set('scope', 'openid profile email offline_access Calendars.ReadWrite Mail.ReadWrite Mail.Send User.Read');
    microsoftAuthUrl.searchParams.set('response_mode', 'query');
    microsoftAuthUrl.searchParams.set('state', 'microsoft-connect');

    console.log('Generated auth URL:', microsoftAuthUrl.toString());

    return NextResponse.json({
      success: true,
      connected: false,
      authUrl: microsoftAuthUrl.toString(),
    });

  } catch (error) {
    console.error('Microsoft auth error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate Microsoft auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST method not implemented yet'
  });
}