import { Client } from '@microsoft/microsoft-graph-client';
import { BaseMCPServer, MCPFunction, MCPResponse } from './base-mcp-server';
import { refreshMicrosoftToken } from '../microsoftGraph';

export class OutlookMCPServer extends BaseMCPServer {
  constructor() {
    super('outlook');
  }

  getFunctions(): MCPFunction[] {
    return [
      {
        name: 'send_outlook_email',
        description: 'Send an email via Outlook/Microsoft Graph',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient email address'
            },
            subject: {
              type: 'string',
              description: 'Email subject line'
            },
            body: {
              type: 'string',
              description: 'Email body content (can include HTML)'
            },
            cc: {
              type: 'string',
              description: 'CC recipients (comma-separated)'
            },
            bcc: {
              type: 'string',
              description: 'BCC recipients (comma-separated)'
            },
            importance: {
              type: 'string',
              description: 'Email importance level',
              enum: ['low', 'normal', 'high']
            }
          },
          required: ['to', 'subject', 'body']
        }
      },
      {
        name: 'get_outlook_emails',
        description: 'Retrieve emails from Outlook',
        parameters: {
          type: 'object',
          properties: {
            folder: {
              type: 'string',
              description: 'Email folder to search in (inbox, sent, drafts, etc.)'
            },
            maxResults: {
              type: 'string',
              description: 'Maximum number of emails to retrieve (default: 10)'
            },
            filter: {
              type: 'string',
              description: 'OData filter query (e.g., "isRead eq false")'
            },
            search: {
              type: 'string',
              description: 'Search term for email content'
            }
          }
        }
      },
      {
        name: 'create_outlook_event',
        description: 'Create a calendar event in Outlook',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Event title/subject'
            },
            startDateTime: {
              type: 'string',
              description: 'Start date and time (ISO format)'
            },
            endDateTime: {
              type: 'string',
              description: 'End date and time (ISO format)'
            },
            body: {
              type: 'string',
              description: 'Event description/body'
            },
            location: {
              type: 'string',
              description: 'Event location'
            },
            attendees: {
              type: 'string',
              description: 'Comma-separated list of attendee email addresses'
            },
            isAllDay: {
              type: 'string',
              description: 'Whether this is an all-day event (true/false)'
            }
          },
          required: ['subject', 'startDateTime', 'endDateTime']
        }
      },
      {
        name: 'get_outlook_events',
        description: 'Retrieve calendar events from Outlook',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date for event search (ISO format)'
            },
            endDate: {
              type: 'string',
              description: 'End date for event search (ISO format)'
            },
            maxResults: {
              type: 'string',
              description: 'Maximum number of events to return (default: 20)'
            }
          }
        }
      },
      {
        name: 'mark_outlook_email_read',
        description: 'Mark an Outlook email as read',
        parameters: {
          type: 'object',
          properties: {
            emailId: {
              type: 'string',
              description: 'Outlook message ID'
            }
          },
          required: ['emailId']
        }
      }
    ];
  }

  async executeFunction(functionName: string, parameters: any, userId: string): Promise<MCPResponse> {
    try {
      const user = await this.getAuthenticatedUser();
      const tokens = await this.getServiceTokens(user);
      
      if (!tokens) {
        return this.createErrorResponse('Microsoft Outlook authentication tokens not found');
      }

      const accessToken = await this.refreshTokenIfNeeded(user);
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });

      switch (functionName) {
        case 'send_outlook_email':
          return await this.sendOutlookEmail(graphClient, parameters);
        
        case 'get_outlook_emails':
          return await this.getOutlookEmails(graphClient, parameters);
        
        case 'create_outlook_event':
          return await this.createOutlookEvent(graphClient, parameters);
        
        case 'get_outlook_events':
          return await this.getOutlookEvents(graphClient, parameters);
        
        case 'mark_outlook_email_read':
          return await this.markOutlookEmailRead(graphClient, parameters);
        
        default:
          return this.createErrorResponse(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      console.error(`Outlook MCP error in ${functionName}:`, error);
      return this.createErrorResponse(`Failed to execute ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async refreshTokenIfNeeded(user: any): Promise<string> {
    try {
      if (!user.microsoftRefreshToken) {
        console.warn('No Microsoft refresh token available');
        return user.microsoftAccessToken;
      }
      const refreshResult = await refreshMicrosoftToken(user.microsoftRefreshToken);
      return refreshResult.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return user.microsoftAccessToken;
    }
  }

  private async sendOutlookEmail(graphClient: Client, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['to', 'subject', 'body']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { to, subject, body, cc, bcc, importance = 'normal' } = parameters;
      
      const toRecipients = to.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }));

      const message: any = {
        subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients,
        importance
      };

      if (cc) {
        message.ccRecipients = cc.split(',').map((email: string) => ({
          emailAddress: { address: email.trim() }
        }));
      }

      if (bcc) {
        message.bccRecipients = bcc.split(',').map((email: string) => ({
          emailAddress: { address: email.trim() }
        }));
      }

      await graphClient.api('/me/sendMail').post({
        message,
        saveToSentItems: true
      });

      return this.createSuccessResponse(
        { message: 'Email sent successfully' },
        `Email sent successfully to ${to}`
      );
    } catch (error) {
      console.error('Send Outlook email error:', error);
      return this.createErrorResponse(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getOutlookEmails(graphClient: Client, parameters: any): Promise<MCPResponse> {
    try {
      const { folder = 'inbox', maxResults = '10', filter, search } = parameters;
      
      let endpoint = `/me/mailFolders/${folder}/messages`;
      const queryParams: string[] = [`$top=${maxResults}`, '$orderby=receivedDateTime desc'];
      
      if (filter) {
        queryParams.push(`$filter=${encodeURIComponent(filter)}`);
      }
      
      if (search) {
        queryParams.push(`$search="${encodeURIComponent(search)}"`);
      }

      const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await graphClient.api(`${endpoint}${query}`).get();

      const emails = response.value.map((email: any) => ({
        id: email.id,
        subject: email.subject,
        from: email.from?.emailAddress?.address || '',
        fromName: email.from?.emailAddress?.name || '',
        receivedDateTime: email.receivedDateTime,
        bodyPreview: email.bodyPreview,
        isRead: email.isRead,
        hasAttachments: email.hasAttachments,
        importance: email.importance,
        conversationId: email.conversationId
      }));

      return this.createSuccessResponse(emails, `Retrieved ${emails.length} emails from ${folder}`);
    } catch (error) {
      console.error('Get Outlook emails error:', error);
      return this.createErrorResponse(`Failed to retrieve emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createOutlookEvent(graphClient: Client, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['subject', 'startDateTime', 'endDateTime']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { subject, startDateTime, endDateTime, body, location, attendees, isAllDay } = parameters;
      
      const event: any = {
        subject,
        body: body ? {
          contentType: 'HTML',
          content: body
        } : undefined,
        start: {
          dateTime: startDateTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'UTC'
        },
        location: location ? {
          displayName: location
        } : undefined,
        isAllDay: isAllDay === 'true'
      };

      if (attendees) {
        event.attendees = attendees.split(',').map((email: string) => ({
          emailAddress: {
            address: email.trim()
          },
          type: 'required'
        }));
      }

      const response = await graphClient.api('/me/events').post(event);

      return this.createSuccessResponse(
        { 
          eventId: response.id,
          webLink: response.webLink,
          event: response 
        },
        `Event "${subject}" created successfully`
      );
    } catch (error) {
      console.error('Create Outlook event error:', error);
      return this.createErrorResponse(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getOutlookEvents(graphClient: Client, parameters: any): Promise<MCPResponse> {
    try {
      const { startDate, endDate, maxResults = '20' } = parameters;
      
      let endpoint = '/me/events';
      const queryParams: string[] = [`$top=${maxResults}`, '$orderby=start/dateTime'];
      
      if (startDate && endDate) {
        const filter = `start/dateTime ge '${startDate}' and end/dateTime le '${endDate}'`;
        queryParams.push(`$filter=${encodeURIComponent(filter)}`);
      }

      const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await graphClient.api(`${endpoint}${query}`).get();

      const events = response.value.map((event: any) => ({
        id: event.id,
        subject: event.subject,
        body: event.body?.content || '',
        location: event.location?.displayName || '',
        start: event.start.dateTime,
        end: event.end.dateTime,
        attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
        webLink: event.webLink,
        isAllDay: event.isAllDay,
        organizer: event.organizer?.emailAddress?.address || ''
      }));

      return this.createSuccessResponse(events, `Retrieved ${events.length} events`);
    } catch (error) {
      console.error('Get Outlook events error:', error);
      return this.createErrorResponse(`Failed to retrieve events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async markOutlookEmailRead(graphClient: Client, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['emailId']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { emailId } = parameters;
      
      await graphClient.api(`/me/messages/${emailId}`).patch({
        isRead: true
      });

      return this.createSuccessResponse(null, 'Email marked as read');
    } catch (error) {
      console.error('Mark Outlook email read error:', error);
      return this.createErrorResponse(`Failed to mark email as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}