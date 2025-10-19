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
  async getCalendarEvents(startDate?: string, endDate?: string) {
    try {
      // Use the calendar view endpoint which automatically expands recurring events
      let query = '/me/calendarView';
      
      // Add required parameters - calendarView requires StartDateTime and EndDateTime
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDateTime', startDate);
      } else {
        // Default to current date if not provided
        params.append('startDateTime', new Date().toISOString());
      }
      
      if (endDate) {
        params.append('endDateTime', endDate);
      } else {
        // Default to 30 days from now if not provided
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        params.append('endDateTime', futureDate.toISOString());
      }
      
      params.append('$select', 'subject,start,end,body,location,attendees');
      params.append('$orderby', 'start/dateTime');
      params.append('$top', '100');
      
      query += `?${params.toString()}`;
      
      const response = await this.makeRequest(query);
      return response.value || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  // Get Outlook messages
  async getMessages() {
    try {
      const response = await this.makeRequest(
        '/me/messages?$select=id,subject,from,receivedDateTime,body,isRead,importance&$orderby=receivedDateTime desc&$top=20'
      );
      return response;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send Outlook message
  async sendMessage(messageData: {
    to: string[];
    subject: string;
    body: string;
    importance?: string;
  }) {
    try {
      const message = {
        subject: messageData.subject,
        body: {
          contentType: 'HTML',
          content: messageData.body
        },
        toRecipients: messageData.to.map(email => ({
          emailAddress: { address: email }
        })),
        importance: messageData.importance || 'normal'
      };

      const response = await this.makeRequest('/me/sendMail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          saveToSentItems: true
        })
      });

      return response;
    } catch (error) {
      console.error('Error sending message:', error);
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