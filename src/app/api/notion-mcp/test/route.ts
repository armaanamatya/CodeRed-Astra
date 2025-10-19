import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { getNotionMCPClient } from '@/lib/notion-mcp';

interface NotionDatabase {
  id: string;
  title?: Array<{text?: {content?: string}}>;
  url?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.notionToken) {
      return NextResponse.json(
        { error: 'Notion workspace not connected. Please connect your Notion account first.' },
        { status: 401 }
      );
    }

    // Test the connection
    const mcpClient = getNotionMCPClient();
    await mcpClient.connect(user.notionToken);

    try {
      // Test 1: Get user info
      const userInfo = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${user.notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (!userInfo.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userInfo.json();

      // Test 2: List databases
      const databases = await mcpClient.listDatabases();
      await mcpClient.disconnect();

      return NextResponse.json({
        success: true,
        message: 'Notion connection test successful!',
        user: {
          id: userData.id,
          name: userData.name,
          type: userData.type
        },
        databases: databases.slice(0, 3).map((db: NotionDatabase) => ({
          id: db.id,
          title: db.title?.[0]?.text?.content || 'Untitled Database',
          url: db.url
        })),
        totalDatabases: databases.length
      });

    } catch (testError) {
      await mcpClient.disconnect();
      throw testError;
    }

  } catch (error) {
    console.error('Notion connection test error:', error);
    return NextResponse.json(
      { 
        error: 'Notion connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
