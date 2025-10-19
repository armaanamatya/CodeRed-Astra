import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { notionToken } = await request.json();

    if (!notionToken) {
      return NextResponse.json(
        { error: 'Notion integration token is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Update or create user with Notion credentials
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        notionToken,
        notionWorkspaceId: undefined, // Will be determined from the token
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Notion workspace connected successfully',
      workspaceId: user.notionWorkspaceId
    });

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
    console.error('Notion connection status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check Notion connection status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
