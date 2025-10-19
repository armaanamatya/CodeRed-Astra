import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const NOTION_API_URL = 'https://api.notion.com/v1';

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
    const notionToken = searchParams.get('token') || process.env.NOTION_TOKEN;

    if (!notionToken) {
      return NextResponse.json(
        { error: 'Notion token is required' },
        { status: 400 }
      );
    }

    // Test 1: Check if token works by getting user info
    console.log('Testing Notion token...');
    
    try {
      const userResponse = await fetch(`${NOTION_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        return NextResponse.json({
          success: false,
          error: 'Token validation failed',
          details: errorData
        });
      }

      const userData = await userResponse.json();
      console.log('Token is valid, user:', userData);

      // Test 2: Get available databases
      const databasesResponse = await fetch(`${NOTION_API_URL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'database'
          }
        })
      });

      if (!databasesResponse.ok) {
        const errorData = await databasesResponse.json();
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch databases',
          details: errorData
        });
      }

      const databasesData = await databasesResponse.json();
      console.log('Found databases:', databasesData.results.length);

      return NextResponse.json({
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          type: userData.type
        },
        databases: databasesData.results.map((db: Record<string, unknown>) => ({
          id: db.id,
          title: (db.title as Array<{text: {content: string}}>)?.[0]?.text?.content || 'Untitled Database',
          url: db.url,
          properties: Object.keys(db.properties || {})
        })),
        message: 'Token is working! Found ' + databasesData.results.length + ' databases.'
      });

    } catch (error) {
      console.error('Notion API test error:', error);
      return NextResponse.json({
        success: false,
        error: 'API call failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
