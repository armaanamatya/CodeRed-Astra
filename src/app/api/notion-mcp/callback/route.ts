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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code received' },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/notion-mcp/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Notion OAuth not properly configured' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${errorData.error || tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Test the token
    const userResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to validate access token');
    }

    const userData = await userResponse.json();

    // Save the token to database
    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        notionToken: accessToken,
        notionWorkspaceId: userData.workspace?.id,
      },
      { upsert: true, new: true }
    );

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?notion_connected=true`);

  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?notion_error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
  }
}
