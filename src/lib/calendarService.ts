import { UnifiedEvent } from '@/types/calendar';

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime: string; date: string };
  end?: { dateTime: string; date: string };
  location?: string;
  attendees?: Array<{ email: string }>;
  [key: string]: unknown;
}

interface OutlookCalendarEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  start?: { dateTime: string };
  end?: { dateTime: string };
  location?: { displayName: string };
  attendees?: Array<{ emailAddress: { address: string } }>;
  [key: string]: unknown;
}

interface NotionCalendarEvent {
  id: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

interface GoogleAttendee {
  email?: string;
  displayName?: string;
  [key: string]: unknown;
}

interface OutlookAttendee {
  emailAddress?: {
    name?: string;
    address?: string;
  };
  [key: string]: unknown;
}

export class CalendarService {
  private static instance: CalendarService;
  private cache: Map<string, UnifiedEvent[]> = new Map();
  private serviceCache: Map<string, { data: UnifiedEvent[], timestamp: number }> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  async fetchAllEvents(startDate?: string, endDate?: string): Promise<UnifiedEvent[]> {
    const cacheKey = `${startDate || 'default'}-${endDate || 'default'}`;
    const now = Date.now();

    // Return cached data if still fresh
    if (this.cache.has(cacheKey) && (now - this.lastFetch) < this.CACHE_DURATION) {
      console.log('Returning cached events:', this.cache.get(cacheKey)?.length || 0);
      return this.cache.get(cacheKey) || [];
    }

    try {
      const allEvents: UnifiedEvent[] = [];
      
      // Fetch from all sources in parallel using existing APIs
      const [googleEvents, outlookEvents, notionEvents] = await Promise.allSettled([
        this.fetchGoogleEvents(startDate, endDate),
        this.fetchOutlookEvents(startDate, endDate),
        this.fetchNotionEvents(startDate, endDate)
      ]);

      // Process Google Calendar events
      if (googleEvents.status === 'fulfilled') {
        allEvents.push(...googleEvents.value);
      }

      // Process Outlook events
      if (outlookEvents.status === 'fulfilled') {
        allEvents.push(...outlookEvents.value);
      }

      // Process Notion events
      if (notionEvents.status === 'fulfilled') {
        allEvents.push(...notionEvents.value);
      }

      // Sort events by start time
      allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());


      // Cache the results
      this.cache.set(cacheKey, allEvents);
      this.lastFetch = now;

      return allEvents;
    } catch (error) {
      console.error('Error fetching unified calendar events:', error);
      return [];
    }
  }

  private async fetchGoogleEvents(startDate?: string, endDate?: string): Promise<UnifiedEvent[]> {
    try {
      const cacheKey = `google-${startDate || 'default'}-${endDate || 'default'}`;
      const cached = this.serviceCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.data;
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return []; // Return empty array instead of throwing
      }

      const events = (data.events || []).map((event: GoogleCalendarEvent) => this.transformGoogleEvent(event));
      
      // Cache the result
      this.serviceCache.set(cacheKey, { data: events, timestamp: Date.now() });
      
      return events;
    } catch (error) {
      console.error('Google events failed (non-critical):', error);
      return []; // Return empty array instead of throwing
    }
  }

  private async fetchOutlookEvents(startDate?: string, endDate?: string): Promise<UnifiedEvent[]> {
    try {
      const cacheKey = `outlook-${startDate || 'default'}-${endDate || 'default'}`;
      const cached = this.serviceCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.data;
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/outlook/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return []; // Return empty array instead of throwing
      }

      const events = (data.events || []).map((event: OutlookCalendarEvent) => this.transformOutlookEvent(event));
      
      // Cache the result
      this.serviceCache.set(cacheKey, { data: events, timestamp: Date.now() });
      
      return events;
    } catch (error) {
      console.error('Outlook events failed (non-critical):', error);
      return []; // Return empty array instead of throwing
    }
  }

  private async fetchNotionEvents(startDate?: string, endDate?: string): Promise<UnifiedEvent[]> {
    try {
      const cacheKey = `notion-${startDate || 'default'}-${endDate || 'default'}`;
      const cached = this.serviceCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.data;
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/notion-mcp/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return []; // Return empty array instead of throwing
      }

      const events = (data.events || []).map((event: NotionCalendarEvent) => this.transformNotionEvent(event));
      
      // Cache the result
      this.serviceCache.set(cacheKey, { data: events, timestamp: Date.now() });
      
      return events;
    } catch (error) {
      console.error('Notion events failed (non-critical):', error);
      return []; // Return empty array instead of throwing
    }
  }

  private transformGoogleEvent(event: GoogleCalendarEvent): UnifiedEvent {
    return {
      id: event.id,
      title: event.summary || 'No Title',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      allDay: !event.start.dateTime,
      location: event.location || '',
      attendees: event.attendees?.map((a: GoogleAttendee) => a.displayName || a.email) || [],
      source: 'google',
      sourceId: event.id,
      url: event.htmlLink || '',
      color: '#4285f4', // Google blue
      status: 'confirmed'
    };
  }

  private transformOutlookEvent(event: OutlookCalendarEvent): UnifiedEvent {
    return {
      id: event.id,
      title: event.subject || 'No Title',
      description: event.bodyPreview || '',
      start: event.start.dateTime,
      end: event.end.dateTime,
      allDay: false, // Outlook events typically have time
      location: event.location?.displayName || '',
      attendees: event.attendees?.map((a: OutlookAttendee) => a.emailAddress?.name || a.emailAddress?.address) || [],
      source: 'outlook',
      sourceId: event.id,
      url: event.webLink || '',
      color: '#0078d4', // Outlook blue
      status: 'confirmed'
    };
  }

  private transformNotionEvent(event: NotionCalendarEvent): UnifiedEvent {
    return {
      id: event.id,
      title: event.properties?.title || 'No Title',
      description: event.properties?.description || '',
      start: event.properties?.start || '',
      end: event.properties?.end || event.properties?.start || '',
      allDay: event.properties?.allDay || false,
      location: event.properties?.location || '',
      attendees: event.properties?.attendees || [],
      source: 'notion',
      sourceId: event.id,
      url: event.properties?.url || '',
      color: '#000000', // Notion black
      status: event.properties?.status || 'confirmed'
    };
  }

  async createEvent(eventData: Partial<UnifiedEvent>, targetSource?: 'google' | 'outlook' | 'notion'): Promise<boolean> {
    try {
      if (targetSource === 'google') {
        return await this.createGoogleEvent(eventData);
      } else if (targetSource === 'outlook') {
        return await this.createOutlookEvent(eventData);
      } else if (targetSource === 'notion') {
        return await this.createNotionEvent(eventData);
      } else {
        // Try to create in the first available source
        const sources: Array<'google' | 'outlook' | 'notion'> = ['google', 'outlook', 'notion'];
        for (const source of sources) {
          try {
            const success = await this.createEvent(eventData, source);
            if (success) return true;
          } catch (error) {
            console.error(`Failed to create event in ${source}:`, error);
          }
        }
        return false;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      return false;
    }
  }

  private async createGoogleEvent(eventData: Partial<UnifiedEvent>): Promise<boolean> {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description,
        startDateTime: eventData.start,
        endDateTime: eventData.end
      })
    });
    return response.ok;
  }

  private async createOutlookEvent(eventData: Partial<UnifiedEvent>): Promise<boolean> {
    const response = await fetch('/api/outlook/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: eventData.title,
        body: eventData.description,
        startDateTime: eventData.start,
        endDateTime: eventData.end,
        location: eventData.location
      })
    });
    return response.ok;
  }

  private async createNotionEvent(eventData: Partial<UnifiedEvent>): Promise<boolean> {
    const response = await fetch('/api/notion-mcp/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eventData.title,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        location: eventData.location,
        allDay: eventData.allDay
      })
    });
    return response.ok;
  }

  clearCache(): void {
    this.cache.clear();
    this.serviceCache.clear();
    this.lastFetch = 0;
  }

  getEventSources(): string[] {
    return ['google', 'outlook', 'notion'];
  }
}
