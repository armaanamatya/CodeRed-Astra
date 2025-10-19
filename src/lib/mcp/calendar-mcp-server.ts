import { google } from 'googleapis';
import { BaseMCPServer, MCPFunction, MCPResponse } from './base-mcp-server';

export class CalendarMCPServer extends BaseMCPServer {
  constructor() {
    super('calendar');
  }

  getFunctions(): MCPFunction[] {
    return [
      {
        name: 'create_event',
        description: 'Create a new calendar event',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Event title/summary'
            },
            startDateTime: {
              type: 'string',
              description: 'Start date and time (ISO format or natural language like "tomorrow 2pm")'
            },
            endDateTime: {
              type: 'string',
              description: 'End date and time (ISO format or natural language)'
            },
            description: {
              type: 'string',
              description: 'Event description'
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
          required: ['title', 'startDateTime', 'endDateTime']
        }
      },
      {
        name: 'get_events',
        description: 'Retrieve calendar events',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date for event search (ISO format or "today", "tomorrow", etc.)'
            },
            endDate: {
              type: 'string',
              description: 'End date for event search (ISO format or "next week", etc.)'
            },
            maxResults: {
              type: 'string',
              description: 'Maximum number of events to return (default: 20)'
            },
            searchQuery: {
              type: 'string',
              description: 'Search term to filter events'
            }
          }
        }
      },
      {
        name: 'update_event',
        description: 'Update an existing calendar event',
        parameters: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Calendar event ID'
            },
            title: {
              type: 'string',
              description: 'New event title'
            },
            startDateTime: {
              type: 'string',
              description: 'New start date and time'
            },
            endDateTime: {
              type: 'string',
              description: 'New end date and time'
            },
            description: {
              type: 'string',
              description: 'New event description'
            },
            location: {
              type: 'string',
              description: 'New event location'
            }
          },
          required: ['eventId']
        }
      },
      {
        name: 'delete_event',
        description: 'Delete a calendar event',
        parameters: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Calendar event ID to delete'
            }
          },
          required: ['eventId']
        }
      },
      {
        name: 'find_available_slots',
        description: 'Find available time slots in calendar',
        parameters: {
          type: 'object',
          properties: {
            duration: {
              type: 'string',
              description: 'Duration in minutes (e.g., "30", "60")'
            },
            startDate: {
              type: 'string',
              description: 'Start date to search from'
            },
            endDate: {
              type: 'string',
              description: 'End date to search until'
            },
            workingHoursOnly: {
              type: 'string',
              description: 'Only show slots during working hours (9am-5pm) (true/false)'
            }
          },
          required: ['duration', 'startDate', 'endDate']
        }
      },
      {
        name: 'get_upcoming_events',
        description: 'Get upcoming events',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'string',
              description: 'Number of upcoming events to retrieve (default: 10)'
            },
            timeframe: {
              type: 'string',
              description: 'Time period (e.g., "today", "this week", "next 7 days")'
            }
          }
        }
      }
    ];
  }

  async executeFunction(functionName: string, parameters: any, userId: string): Promise<MCPResponse> {
    try {
      const user = await this.getAuthenticatedUser();
      const tokens = await this.getServiceTokens(user);
      
      if (!tokens) {
        return this.createErrorResponse('Google Calendar authentication tokens not found');
      }

      const accessToken = await this.refreshTokenIfNeeded(user);
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      
      const calendar = google.calendar({ version: 'v3', auth });

      switch (functionName) {
        case 'create_event':
          return await this.createEvent(calendar, parameters);
        
        case 'get_events':
          return await this.getEvents(calendar, parameters);
        
        case 'update_event':
          return await this.updateEvent(calendar, parameters);
        
        case 'delete_event':
          return await this.deleteEvent(calendar, parameters);
        
        case 'find_available_slots':
          return await this.findAvailableSlots(calendar, parameters);
        
        case 'get_upcoming_events':
          return await this.getUpcomingEvents(calendar, parameters);
        
        default:
          return this.createErrorResponse(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      console.error(`Calendar MCP error in ${functionName}:`, error);
      return this.createErrorResponse(`Failed to execute ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async refreshTokenIfNeeded(user: any): Promise<string> {
    // Implement proper token refresh logic
    return user.accessToken;
  }

  private parseDateTime(dateTimeStr: string): string {
    // Simple date parsing - can be enhanced with libraries like date-fns
    const now = new Date();
    const lowerStr = dateTimeStr.toLowerCase();
    
    if (lowerStr.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (lowerStr.includes('2pm') || lowerStr.includes('2 pm')) {
        tomorrow.setHours(14, 0, 0, 0);
      } else if (lowerStr.includes('9am') || lowerStr.includes('9 am')) {
        tomorrow.setHours(9, 0, 0, 0);
      }
      
      return tomorrow.toISOString();
    }
    
    if (lowerStr === 'today') {
      return now.toISOString().split('T')[0] + 'T09:00:00.000Z';
    }
    
    // Try to parse as ISO string
    try {
      return new Date(dateTimeStr).toISOString();
    } catch {
      // Default to current time
      return now.toISOString();
    }
  }

  private async createEvent(calendar: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['title', 'startDateTime', 'endDateTime']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { title, startDateTime, endDateTime, description, location, attendees, isAllDay } = parameters;
      
      const event: any = {
        summary: title,
        description: description || '',
        location: location || '',
      };

      if (isAllDay === 'true') {
        event.start = { date: this.parseDateTime(startDateTime).split('T')[0] };
        event.end = { date: this.parseDateTime(endDateTime).split('T')[0] };
      } else {
        event.start = { dateTime: this.parseDateTime(startDateTime) };
        event.end = { dateTime: this.parseDateTime(endDateTime) };
      }

      if (attendees) {
        event.attendees = attendees.split(',').map((email: string) => ({ email: email.trim() }));
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email notifications to attendees
      });

      return this.createSuccessResponse(
        { 
          eventId: response.data.id, 
          htmlLink: response.data.htmlLink,
          event: response.data 
        },
        `Event "${title}" created successfully`
      );
    } catch (error) {
      console.error('Create event error:', error);
      return this.createErrorResponse(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getEvents(calendar: any, parameters: any): Promise<MCPResponse> {
    try {
      const { startDate, endDate, maxResults = '20', searchQuery } = parameters;
      
      const queryParams: any = {
        calendarId: 'primary',
        maxResults: parseInt(maxResults),
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (startDate) {
        queryParams.timeMin = this.parseDateTime(startDate);
      }
      
      if (endDate) {
        queryParams.timeMax = this.parseDateTime(endDate);
      }
      
      if (searchQuery) {
        queryParams.q = searchQuery;
      }

      const response = await calendar.events.list(queryParams);
      const events = response.data.items || [];

      const formattedEvents = events.map((event: any) => ({
        id: event.id,
        title: event.summary,
        description: event.description || '',
        location: event.location || '',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        attendees: event.attendees?.map((a: any) => a.email) || [],
        htmlLink: event.htmlLink,
        isAllDay: !event.start.dateTime,
      }));

      return this.createSuccessResponse(formattedEvents, `Retrieved ${formattedEvents.length} events`);
    } catch (error) {
      console.error('Get events error:', error);
      return this.createErrorResponse(`Failed to retrieve events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateEvent(calendar: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['eventId']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { eventId, title, startDateTime, endDateTime, description, location } = parameters;
      
      // First get the existing event
      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      const updateData: any = { ...existingEvent.data };
      
      if (title) updateData.summary = title;
      if (description) updateData.description = description;
      if (location) updateData.location = location;
      if (startDateTime) updateData.start = { dateTime: this.parseDateTime(startDateTime) };
      if (endDateTime) updateData.end = { dateTime: this.parseDateTime(endDateTime) };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updateData,
        sendUpdates: 'all',
      });

      return this.createSuccessResponse(
        { event: response.data },
        `Event updated successfully`
      );
    } catch (error) {
      console.error('Update event error:', error);
      return this.createErrorResponse(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteEvent(calendar: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['eventId']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { eventId } = parameters;
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      return this.createSuccessResponse(null, 'Event deleted successfully');
    } catch (error) {
      console.error('Delete event error:', error);
      return this.createErrorResponse(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findAvailableSlots(calendar: any, parameters: any): Promise<MCPResponse> {
    const validation = this.validateParameters(parameters, ['duration', 'startDate', 'endDate']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    try {
      const { duration, startDate, endDate, workingHoursOnly = 'true' } = parameters;
      const durationMs = parseInt(duration) * 60 * 1000; // Convert to milliseconds
      
      // Get existing events in the time range
      const eventsResponse = await this.getEvents(calendar, { startDate, endDate, maxResults: '100' });
      if (!eventsResponse.success) {
        return eventsResponse;
      }

      const existingEvents = eventsResponse.data;
      const availableSlots = [];
      
      const start = new Date(this.parseDateTime(startDate));
      const end = new Date(this.parseDateTime(endDate));
      
      // Simple slot finding logic (can be enhanced)
      let currentTime = new Date(start);
      
      while (currentTime < end) {
        const slotEnd = new Date(currentTime.getTime() + durationMs);
        
        // Check if this slot conflicts with any existing event
        const hasConflict = existingEvents.some((event: any) => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          return (currentTime < eventEnd && slotEnd > eventStart);
        });
        
        // Check working hours if required
        const isWorkingHours = workingHoursOnly === 'false' || 
          (currentTime.getHours() >= 9 && currentTime.getHours() < 17);
        
        if (!hasConflict && isWorkingHours) {
          availableSlots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
            duration: parseInt(duration),
          });
        }
        
        // Move to next 30-minute slot
        currentTime = new Date(currentTime.getTime() + (30 * 60 * 1000));
      }

      return this.createSuccessResponse(
        availableSlots.slice(0, 10), // Limit to 10 slots
        `Found ${availableSlots.length} available slots`
      );
    } catch (error) {
      console.error('Find available slots error:', error);
      return this.createErrorResponse(`Failed to find available slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getUpcomingEvents(calendar: any, parameters: any): Promise<MCPResponse> {
    try {
      const { limit = '10', timeframe = 'this week' } = parameters;
      
      const now = new Date();
      let endDate: Date;
      
      switch (timeframe.toLowerCase()) {
        case 'today':
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'tomorrow':
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this week':
        default:
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 7);
          break;
      }
      
      return await this.getEvents(calendar, {
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        maxResults: limit,
      });
    } catch (error) {
      console.error('Get upcoming events error:', error);
      return this.createErrorResponse(`Failed to get upcoming events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}