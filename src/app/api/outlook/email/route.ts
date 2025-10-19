import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { getAccessToken } from '@/lib/microsoftGraph';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Get Microsoft access token
    const accessToken = await getAccessToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Microsoft account not connected or token refresh failed' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Get messages from inbox
    const messages = await graphClient
      .me
      .mailFolders('inbox')
      .messages
      .get({
        queryParameters: {
          $top: 20,
          $orderby: 'receivedDateTime desc',
          $select: 'id,subject,from,receivedDateTime,body,isRead,importance'
        }
      });

    return NextResponse.json({
      success: true,
      messages: messages.value || [],
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

    // Get Microsoft access token
    const accessToken = await getAccessToken(session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Microsoft account not connected or token refresh failed' },
        { status: 401 }
      );
    }

    // Create Graph client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Create message
    const message = {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: Array.isArray(to) ? to.map(email => ({
        emailAddress: { address: email }
      })) : [{
        emailAddress: { address: to }
      }],
      importance: importance
    };

    // Send message
    const result = await graphClient
      .me
      .sendMail
      .post({ message });

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