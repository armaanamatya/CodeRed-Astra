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

    // Get date parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Get calendar events with date filtering
    const microsoftService = new MicrosoftGraphService(accessToken);
    const events = await microsoftService.getCalendarEvents(startDate, endDate);

    return NextResponse.json({
      success: true,
      events: events,
    });

  } catch (error) {
    console.error('Outlook Calendar API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Outlook calendar events',
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

    const { subject, description, startDateTime, endDateTime, location } = await request.json();

    if (!subject || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, startDateTime, endDateTime' },
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

    // Create calendar event
    const microsoftService = new MicrosoftGraphService(accessToken);
    const eventData: {
      subject: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      body?: { content: string; contentType: string };
      location?: { displayName: string };
    } = {
      subject,
      start: {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      body: {
        content: description || '',
        contentType: 'text',
      },
    };
    
    // Add location if provided
    if (location) {
      eventData.location = {
        displayName: location
      };
    }
    
    const event = await microsoftService.createCalendarEvent(eventData);

    return NextResponse.json({
      success: true,
      event: event,
    });

  } catch (error) {
    console.error('Outlook Calendar create event error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Outlook calendar event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
