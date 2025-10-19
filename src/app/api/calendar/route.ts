import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { getFreshGoogleToken } from '@/lib/googleAuth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Get fresh Google access token
    const accessToken = await getFreshGoogleToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google account not connected or token refresh failed' },
        { status: 401 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get calendar events
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json({
      success: true,
      events: events.data.items || [],
    });

  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar events',
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

    const { summary, description, startDateTime, endDateTime } = await request.json();

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, startDateTime, endDateTime' },
        { status: 400 }
      );
    }

    // Get fresh Google access token
    const accessToken = await getFreshGoogleToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google account not connected or token refresh failed' },
        { status: 401 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Create calendar event
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/New_York', // You can make this configurable
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/New_York',
        },
      },
    });

    return NextResponse.json({
      success: true,
      event: event.data,
    });

  } catch (error) {
    console.error('Calendar create event error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create calendar event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}