import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

class CustomAuthenticationProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    const authProvider = new CustomAuthenticationProvider(accessToken);
    this.client = Client.initWithMiddleware({ authProvider });
  }

  // Get Outlook calendar events
  async getCalendarEvents() {
    try {
      const events = await this.client
        .api('/me/events')
        .select('subject,start,end,body,location,attendees')
        .orderby('start/dateTime')
        .top(20)
        .get();

      return events.value || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  // Create a calendar event
  async createCalendarEvent(eventData: {
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    body?: { content: string; contentType: string };
    location?: { displayName: string };
  }) {
    try {
      const event = await this.client
        .api('/me/events')
        .post(eventData);

      return event;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Get Outlook emails
  async getEmails(maxResults: number = 10, query: string = '') {
    try {
      const messages = await this.client
        .api('/me/messages')
        .select('subject,from,receivedDateTime,body,isRead')
        .orderby('receivedDateTime desc')
        .top(maxResults)
        .filter(query)
        .get();

      return messages.value || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  // Send an email
  async sendEmail(emailData: {
    toRecipients: Array<{ emailAddress: { address: string } }>;
    subject: string;
    body: { content: string; contentType: string };
  }) {
    try {
      const message = {
        message: {
          subject: emailData.subject,
          body: emailData.body,
          toRecipients: emailData.toRecipients,
        },
        saveToSentItems: true,
      };

      const result = await this.client
        .api('/me/sendMail')
        .post(message);

      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const user = await this.client
        .api('/me')
        .select('id,displayName,mail,userPrincipalName')
        .get();

      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

// Helper function to refresh Microsoft access token
export async function refreshMicrosoftToken(refreshToken: string) {
  try {
    const response = await fetch(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to refresh token');
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing Microsoft token:', error);
    throw error;
  }
}
