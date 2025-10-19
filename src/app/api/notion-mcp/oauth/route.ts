import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate OAuth URL for Notion
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/notion-mcp/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Notion OAuth not configured. Please set NOTION_CLIENT_ID in environment variables.' },
        { status: 500 }
      );
    }

    const oauthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&owner=user`;

    return NextResponse.json({
      oauthUrl,
      message: 'Redirect to this URL to connect your Notion workspace'
    });

  } catch (error) {
    console.error('Notion OAuth error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate OAuth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
