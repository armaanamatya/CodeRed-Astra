import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import { getFreshGoogleToken } from '@/lib/googleAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessToken = await getFreshGoogleToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google account not connected' },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch full message with body
    const messageDetails = await gmail.users.messages.get({
      userId: 'me',
      id: params.messageId,
      format: 'full',
    });

    // Get message body
    let body = '';
    if (messageDetails.data.payload?.body?.data) {
      body = Buffer.from(messageDetails.data.payload.body.data, 'base64').toString();
    } else if (messageDetails.data.payload?.parts) {
      const htmlPart = messageDetails.data.payload.parts.find(
        part => part.mimeType === 'text/html'
      );
      const textPart = messageDetails.data.payload.parts.find(
        part => part.mimeType === 'text/plain'
      );
      const preferredPart = htmlPart || textPart;
      if (preferredPart?.body?.data) {
        body = Buffer.from(preferredPart.body.data, 'base64').toString();
      }
    }

    return NextResponse.json({
      success: true,
      body,
    });

  } catch (error) {
    console.error('Gmail message fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message body' },
      { status: 500 }
    );
  }
}

