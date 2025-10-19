import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/microsoftGraphSimple';
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

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const mailboxType = searchParams.get('mailboxType') || 'inbox';

    // Get user from database to check Microsoft token
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.microsoftAccessToken) {
      return NextResponse.json(
        { error: 'Microsoft account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = user.microsoftAccessToken;
    if (user.microsoftTokenExpiry && new Date() >= user.microsoftTokenExpiry) {
      if (!user.microsoftRefreshToken) {
        return NextResponse.json(
          { error: 'Microsoft token expired and no refresh token available' },
          { status: 401 }
        );
      }

      try {
        const { refreshMicrosoftToken } = await import('@/lib/microsoftGraph');
        const refreshedTokens = await refreshMicrosoftToken(user.microsoftRefreshToken);
        
        // Update user with new tokens
        await User.findOneAndUpdate(
          { email: session.user.email },
          {
            microsoftAccessToken: refreshedTokens.access_token,
            microsoftRefreshToken: refreshedTokens.refresh_token,
            microsoftTokenExpiry: new Date(Date.now() + refreshedTokens.expires_in * 1000),
          }
        );
        
        accessToken = refreshedTokens.access_token;
      } catch (error) {
        console.error('Error refreshing Microsoft token:', error);
        return NextResponse.json(
          { error: 'Failed to refresh Microsoft token' },
          { status: 401 }
        );
      }
    }

    // Create Graph service and fetch messages with pagination
    const microsoftService = new MicrosoftGraphService(accessToken);
    const messages = await microsoftService.getMessages(maxResults, skip, mailboxType);

    return NextResponse.json({
      success: true,
      messages: messages.value || [],
      hasMore: messages['@odata.nextLink'] !== undefined,
      skipToken: messages['@odata.nextLink'],
    });

  } catch (error) {
    console.error('Outlook Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Outlook messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const { to, subject, body, importance = 'normal' } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Get user from database to check Microsoft token
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.microsoftAccessToken) {
      return NextResponse.json(
        { error: 'Microsoft account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = user.microsoftAccessToken;
    if (user.microsoftTokenExpiry && new Date() >= user.microsoftTokenExpiry) {
      if (!user.microsoftRefreshToken) {
        return NextResponse.json(
          { error: 'Microsoft token expired and no refresh token available' },
          { status: 401 }
        );
      }

      try {
        const { refreshMicrosoftToken } = await import('@/lib/microsoftGraph');
        const refreshedTokens = await refreshMicrosoftToken(user.microsoftRefreshToken);
        
        // Update user with new tokens
        await User.findOneAndUpdate(
          { email: session.user.email },
          {
            microsoftAccessToken: refreshedTokens.access_token,
            microsoftRefreshToken: refreshedTokens.refresh_token,
            microsoftTokenExpiry: new Date(Date.now() + refreshedTokens.expires_in * 1000),
          }
        );
        
        accessToken = refreshedTokens.access_token;
      } catch (error) {
        console.error('Error refreshing Microsoft token:', error);
        return NextResponse.json(
          { error: 'Failed to refresh Microsoft token' },
          { status: 401 }
        );
      }
    }

    // Create Graph service
    const microsoftService = new MicrosoftGraphService(accessToken);

    // Send message using the service
    const result = await microsoftService.sendMessage({
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      body: body,
      importance: importance
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
    });

  } catch (error) {
    console.error('Outlook Email send error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send Outlook email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    const { messageId, isRead } = await request.json();

    if (!messageId || typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, isRead' },
        { status: 400 }
      );
    }

    // Get user from database to check Microsoft token
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.microsoftAccessToken) {
      return NextResponse.json(
        { error: 'Microsoft account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = user.microsoftAccessToken;
    if (user.microsoftTokenExpiry && new Date() >= user.microsoftTokenExpiry) {
      if (!user.microsoftRefreshToken) {
        return NextResponse.json(
          { error: 'Microsoft token expired and no refresh token available' },
          { status: 401 }
        );
      }

      try {
        const { refreshMicrosoftToken } = await import('@/lib/microsoftGraph');
        const refreshedTokens = await refreshMicrosoftToken(user.microsoftRefreshToken);
        
        // Update user with new tokens
        await User.findOneAndUpdate(
          { email: session.user.email },
          {
            microsoftAccessToken: refreshedTokens.access_token,
            microsoftRefreshToken: refreshedTokens.refresh_token,
            microsoftTokenExpiry: new Date(Date.now() + refreshedTokens.expires_in * 1000),
          }
        );
        
        accessToken = refreshedTokens.access_token;
      } catch (error) {
        console.error('Error refreshing Microsoft token:', error);
        return NextResponse.json(
          { error: 'Failed to refresh Microsoft token' },
          { status: 401 }
        );
      }
    }

    // Create Graph service
    const microsoftService = new MicrosoftGraphService(accessToken);

    // Mark message as read
    await microsoftService.markMessageAsRead(messageId);

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Outlook Email mark as read error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mark email as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}