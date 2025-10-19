import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Check environment variables
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Microsoft environment variables not configured' },
        { status: 500 }
      );
    }

    // Generate Microsoft OAuth URL for reconnection
    const microsoftAuthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    microsoftAuthUrl.searchParams.set('client_id', clientId);
    microsoftAuthUrl.searchParams.set('response_type', 'code');
    microsoftAuthUrl.searchParams.set('redirect_uri', redirectUri);
    microsoftAuthUrl.searchParams.set('scope', 'openid profile email offline_access Calendars.ReadWrite Mail.ReadWrite Mail.Send User.Read');
    microsoftAuthUrl.searchParams.set('response_mode', 'query');
    microsoftAuthUrl.searchParams.set('state', 'microsoft-reconnect');
    microsoftAuthUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

    console.log('Generated Microsoft reconnect URL:', microsoftAuthUrl.toString());

    return NextResponse.json({
      success: true,
      authUrl: microsoftAuthUrl.toString(),
    });

  } catch (error) {
    console.error('Microsoft reconnect error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate Microsoft reconnect URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
