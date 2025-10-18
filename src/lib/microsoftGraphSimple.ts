// Simplified Microsoft Graph API implementation without SDK
export class MicrosoftGraphService {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Graph API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get Outlook calendar events
  async getCalendarEvents() {
    try {
      const response = await this.makeRequest(
        '/me/events?$select=subject,start,end,body,location,attendees&$orderby=start/dateTime&$top=20'
      );
      return response.value || [];
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
      return await this.makeRequest('/me/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Get Outlook emails
  async getEmails(maxResults: number = 10, query: string = '') {
    try {
      let endpoint = `/me/messages?$select=subject,from,receivedDateTime,body,isRead&$orderby=receivedDateTime desc&$top=${maxResults}`;
      if (query) {
        endpoint += `&$filter=${encodeURIComponent(query)}`;
      }
      
      const response = await this.makeRequest(endpoint);
      return response.value || [];
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
      return await this.makeRequest('/me/sendMail', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            subject: emailData.subject,
            body: emailData.body,
            toRecipients: emailData.toRecipients,
          },
          saveToSentItems: true,
        }),
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      return await this.makeRequest('/me?$select=id,displayName,mail,userPrincipalName');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

// Helper function to refresh Microsoft access token
export async function refreshMicrosoftToken(refreshToken: string) {
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          scope: 'https://graph.microsoft.com/.default offline_access',
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to refresh token');
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Some flows don't return new refresh token
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing Microsoft token:', error);
    throw error;
  }
}