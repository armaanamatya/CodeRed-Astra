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

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const pageToken = searchParams.get('pageToken') || undefined;
    const q = searchParams.get('q') || 'in:inbox';

    // Get messages list with pagination
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      q,
    });

    const messages = messagesResponse.data.messages || [];
    const nextPageToken = messagesResponse.data.nextPageToken;

    // Get detailed message data for each message
    // OPTIMIZATION: Use 'metadata' format instead of 'full' for much faster list loading
    // Body content will be fetched on-demand when user clicks on a message
    const detailedMessages = await Promise.all(
      messages.map(async (message) => {
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        });

        const headers = messageDetails.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: message.id,
          subject,
          from,
          date,
          snippet: messageDetails.data.snippet,
          // Body is not fetched here for performance - fetch on-demand via /api/gmail/[id]
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: detailedMessages,
      totalMessages: messagesResponse.data.resultSizeEstimate,
      nextPageToken,
      hasMore: !!nextPageToken,
    });

  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Gmail messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}