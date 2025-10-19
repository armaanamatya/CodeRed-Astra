import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { getNotionMCPClient } from '@/lib/notion-mcp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { notionApiKey } = await request.json();

    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API key is required' },
        { status: 400 }
      );
    }

    // Test the API key by connecting to Notion MCP
    try {
      const mcpClient = getNotionMCPClient();
      await mcpClient.connectWithApiKey(notionApiKey);
      
      // Test the connection by listing databases
      const databases = await mcpClient.listDatabases();
      await mcpClient.disconnect();

      await connectDB();
      
      // Update or create user with Notion credentials
      const user = await User.findOneAndUpdate(
        { email: session.user.email },
        {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          notionToken: notionApiKey,
          notionWorkspaceId: undefined, // Will be determined from the API key
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Notion workspace connected successfully',
        databases: databases.slice(0, 5), // Return first 5 databases
        workspaceId: user.notionWorkspaceId
      });

    } catch (apiError) {
      console.error('Notion API connection test failed:', apiError);
      return NextResponse.json(
        { 
          error: 'Invalid Notion API key or connection failed',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Notion connection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect Notion workspace',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
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

    return NextResponse.json({
      connected: !!user?.notionToken,
      workspaceId: user?.notionWorkspaceId
    });

  } catch (error) {
    console.error('Notion MCP connection status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check Notion MCP connection status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
