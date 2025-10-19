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

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all'; // 'google', 'notion', or 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const events = [];

    // Fetch from Google Calendar if requested
    if (source === 'all' || source === 'google') {
      try {
        const googleResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/calendar?${new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        })}`, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          if (googleData.success) {
            events.push(...googleData.events.map((event: any) => ({
              ...event,
              source: 'google'
            })));
          }
        }
      } catch (error) {
        console.error('Google Calendar fetch error:', error);
      }
    }

    // Fetch from Notion Calendar if requested
    if (source === 'all' || source === 'notion') {
      try {
        const notionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notion/calendar?${new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        })}`, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        });

        if (notionResponse.ok) {
          const notionData = await notionResponse.json();
          if (notionData.success) {
            events.push(...notionData.events.map((event: any) => ({
              ...event,
              source: 'notion'
            })));
          }
        }
      } catch (error) {
        console.error('Notion Calendar fetch error:', error);
      }
    }

    // Sort events by start time
    events.sort((a, b) => {
      const dateA = new Date(a.start?.dateTime || a.start);
      const dateB = new Date(b.start?.dateTime || b.start);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      success: true,
      events,
      sources: {
        google: source === 'all' || source === 'google',
        notion: source === 'all' || source === 'notion'
      }
    });

  } catch (error) {
    console.error('Combined calendars API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
