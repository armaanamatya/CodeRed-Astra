import { google } from 'googleapis';
import { BaseMCPServer, MCPFunction, MCPResponse } from './base-mcp-server';

export class GmailMCPServer extends BaseMCPServer {
  constructor() {
    super('gmail');
  }

  getFunctions(): MCPFunction[] {
    return [
      {
        name: 'send_email',
        description: 'Send an email via Gmail',
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
            }
          },
          required: ['to', 'subject', 'body']
        }
      },
      {
        name: 'get_emails',
        description: 'Retrieve emails from Gmail',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Gmail search query (e.g., "from:example@gmail.com", "is:unread")'
            },
            maxResults: {
              type: 'string',
              description: 'Maximum number of emails to retrieve (default: 10)'
            },
            includeBody: {
              type: 'string',
              description: 'Whether to include email body content (true/false)'
            }
          }
        }
      },
      {
        name: 'search_emails',
        description: 'Search emails with specific criteria',
        parameters: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description: 'Search term to look for in emails'
            },
            sender: {
              type: 'string',
              description: 'Filter by sender email address'
            },
            timeframe: {
              type: 'string',
              description: 'Time range (e.g., "today", "this week", "last month")'
            },
            isUnread: {
              type: 'string',
              description: 'Filter unread emails only (true/false)'
            }
          },
          required: ['searchTerm']
        }
      },
      {
        name: 'mark_email_read',
        description: 'Mark an email as read',
        parameters: {
          type: 'object',
          properties: {
            emailId: {
              type: 'string',
              description: 'Gmail message ID'
            }
          },
          required: ['emailId']
        }
      },
      {
        name: 'create_draft',
        description: 'Create a draft email',
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
              description: 'Email body content'
            }
          },
          required: ['to', 'subject', 'body']
        }
      }
    ];
  }

  async executeFunction(functionName: string, parameters: any, userId: string): Promise<MCPResponse> {
    try {
      const user = await this.getAuthenticatedUser();
      const tokens = await this.getServiceTokens(user);
      
      if (!tokens) {
        return this.createErrorResponse('Gmail authentication tokens not found');
      }

      const accessToken = await this.refreshTokenIfNeeded(user);
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth });

      switch (functionName) {
        case 'send_email':
          return await this.sendEmail(gmail, parameters);
        
        case 'get_emails':
          return await this.getEmails(gmail, parameters);
        
        case 'search_emails':
          return await this.searchEmails(gmail, parameters);
        
        case 'mark_email_read':
          return await this.markEmailRead(gmail, parameters);
        
        case 'create_draft':
          return await this.createDraft(gmail, parameters);
        
        default:
          return this.createErrorResponse(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      console.error(`Gmail MCP error in ${functionName}:`, error);
      return this.createErrorResponse(`Failed to execute ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async refreshTokenIfNeeded(user: any): Promise<string> {
    // Check if token needs refresh (implement proper token expiry logic)
    return user.accessToken;
  }

  private async sendEmail(gmail: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['to', 'subject', 'body']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { to, subject, body, cc, bcc } = parameters;
      
      let rawMessage = `To: ${to}\r\n`;
      if (cc) rawMessage += `Cc: ${cc}\r\n`;
      if (bcc) rawMessage += `Bcc: ${bcc}\r\n`;
      rawMessage += `Subject: ${subject}\r\n`;
      rawMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      rawMessage += body;

      const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return this.createSuccessResponse(
        { messageId: response.data.id },
        `Email sent successfully to ${to}`
      );
    } catch (error) {
      console.error('Send email error:', error);
      return this.createErrorResponse(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getEmails(gmail: any, parameters: any): Promise<MCPResponse> {
    try {
      const { query = '', maxResults = '10', includeBody = 'false' } = parameters;
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: parseInt(maxResults),
      });

      if (!response.data.messages) {
        return this.createSuccessResponse([], 'No emails found');
      }

      const emails = [];
      for (const message of response.data.messages.slice(0, parseInt(maxResults))) {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: includeBody === 'true' ? 'full' : 'metadata',
        });

        const headers = email.data.payload.headers;
        const emailData: any = {
          id: email.data.id,
          threadId: email.data.threadId,
          snippet: email.data.snippet,
          subject: headers.find((h: any) => h.name === 'Subject')?.value || '',
          from: headers.find((h: any) => h.name === 'From')?.value || '',
          to: headers.find((h: any) => h.name === 'To')?.value || '',
          date: headers.find((h: any) => h.name === 'Date')?.value || '',
          isUnread: email.data.labelIds?.includes('UNREAD') || false,
        };

        if (includeBody === 'true' && email.data.payload.body?.data) {
          emailData.body = Buffer.from(email.data.payload.body.data, 'base64').toString();
        }

        emails.push(emailData);
      }

      return this.createSuccessResponse(emails, `Retrieved ${emails.length} emails`);
    } catch (error) {
      console.error('Get emails error:', error);
      return this.createErrorResponse(`Failed to retrieve emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async searchEmails(gmail: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['searchTerm']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { searchTerm, sender, timeframe, isUnread } = parameters;
      
      let query = searchTerm;
      if (sender) query += ` from:${sender}`;
      if (isUnread === 'true') query += ' is:unread';
      if (timeframe) {
        switch (timeframe.toLowerCase()) {
          case 'today':
            query += ' newer_than:1d';
            break;
          case 'this week':
            query += ' newer_than:7d';
            break;
          case 'last month':
            query += ' newer_than:30d';
            break;
        }
      }

      return await this.getEmails(gmail, { query, maxResults: '20', includeBody: 'false' });
    } catch (error) {
      console.error('Search emails error:', error);
      return this.createErrorResponse(`Failed to search emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async markEmailRead(gmail: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['emailId']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { emailId } = parameters;
      
      await gmail.users.messages.modify({
        userId: 'me',
        id: emailId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      return this.createSuccessResponse(null, 'Email marked as read');
    } catch (error) {
      console.error('Mark email read error:', error);
      return this.createErrorResponse(`Failed to mark email as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createDraft(gmail: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['to', 'subject', 'body']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { to, subject, body } = parameters;
      
      const rawMessage = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${body}`;
      const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });

      return this.createSuccessResponse(
        { draftId: response.data.id },
        `Draft created successfully`
      );
    } catch (error) {
      console.error('Create draft error:', error);
      return this.createErrorResponse(`Failed to create draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}