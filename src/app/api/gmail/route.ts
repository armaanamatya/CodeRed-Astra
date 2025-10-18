import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

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
    
    if (!user?.accessToken) {
      return NextResponse.json(
        { error: 'No access token found. Please re-authenticate.' },
        { status: 401 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const q = searchParams.get('q') || 'in:inbox';

    // Get messages list
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q,
    });

    const messages = messagesResponse.data.messages || [];

    // Get detailed message data for each message
    const detailedMessages = await Promise.all(
      messages.slice(0, 5).map(async (message) => {
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const headers = messageDetails.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Get message body
        let body = '';
        if (messageDetails.data.payload?.body?.data) {
          body = Buffer.from(messageDetails.data.payload.body.data, 'base64').toString();
        } else if (messageDetails.data.payload?.parts) {
          const textPart = messageDetails.data.payload.parts.find(
            part => part.mimeType === 'text/plain'
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString();
          }
        }

        return {
          id: message.id,
          subject,
          from,
          date,
          body: body.substring(0, 500), // Truncate for preview
          snippet: messageDetails.data.snippet,
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: detailedMessages,
      totalMessages: messagesResponse.data.resultSizeEstimate,
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