import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Debug - Request body:', body);
    
    const { notionApiKey } = body;
    
    if (!notionApiKey) {
      return NextResponse.json({
        error: 'No API key provided',
        received: body
      }, { status: 400 });
    }

    if (!notionApiKey.startsWith('secret_')) {
      return NextResponse.json({
        error: 'Invalid API key format - should start with "secret_"',
        received: notionApiKey.substring(0, 10) + '...'
      }, { status: 400 });
    }

    // Test the API key directly
    try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({
          error: 'Notion API test failed',
          status: response.status,
          details: errorData
        }, { status: 400 });
      }

      const userData = await response.json();
      
      return NextResponse.json({
        success: true,
        message: 'API key is valid!',
        user: {
          id: userData.id,
          name: userData.name,
          type: userData.type
        },
        apiKeyLength: notionApiKey.length,
        apiKeyPrefix: notionApiKey.substring(0, 10) + '...'
      });

    } catch (apiError) {
      return NextResponse.json({
        error: 'Failed to test API key',
        details: apiError instanceof Error ? apiError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
