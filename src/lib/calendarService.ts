import { CalendarEvent, UnifiedEvent } from '@/types/calendar';

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

      console.log('Fetching Google events:', `/api/calendar?${params.toString()}`);
      const response = await fetch(`/api/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Google Calendar API error:', response.status, data);
        if (response.status === 401) {
          console.error('Google Calendar: Authentication failed - user may need to reconnect');
        }
        return []; // Return empty array instead of throwing
      }

      if (!data.success) {
        console.error('Google Calendar API returned error:', data);
        return [];
      }

      const events = (data.events || []).map((event: Record<string, unknown>) => this.transformGoogleEvent(event));
      console.log('Google events fetched:', events.length);
      
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

      const events = (data.events || []).map((event: Record<string, unknown>) => this.transformOutlookEvent(event));
      
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

      console.log('Fetching Notion events:', `/api/notion-mcp/calendar?${params.toString()}`);
      const response = await fetch(`/api/notion-mcp/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Notion Calendar API error:', response.status, data);
        if (response.status === 401) {
          console.error('Notion Calendar: Authentication failed - user may need to reconnect or provide database ID');
        }
        return []; // Return empty array instead of throwing
      }

      if (!data.success) {
        console.error('Notion Calendar API returned error:', data);
        return [];
      }

      const events = (data.events || []).map((event: Record<string, unknown>) => this.transformNotionEvent(event));
      console.log('Notion events fetched:', events.length);
      
      // Cache the result
      this.serviceCache.set(cacheKey, { data: events, timestamp: Date.now() });
      
      return events;
    } catch (error) {
      console.error('Notion events failed (non-critical):', error);
      return []; // Return empty array instead of throwing
    }
  }

  private transformGoogleEvent(event: Record<string, unknown>): UnifiedEvent {
    const eventObj = event as Record<string, unknown>;
    return {
      id: eventObj.id as string,
      title: (eventObj.summary as string) || 'No Title',
      description: (eventObj.description as string) || '',
      start: ((eventObj.start as Record<string, unknown>)?.dateTime || (eventObj.start as Record<string, unknown>)?.date) as string,
      end: ((eventObj.end as Record<string, unknown>)?.dateTime || (eventObj.end as Record<string, unknown>)?.date) as string,
      allDay: !((eventObj.start as Record<string, unknown>)?.dateTime),
      location: (eventObj.location as string) || '',
      attendees: (eventObj.attendees as Array<{displayName?: string; email?: string}>)?.map((a) => a.displayName || a.email) || [],
      source: 'google',
      sourceId: eventObj.id as string,
      url: (eventObj.htmlLink as string) || '',
      color: '#4285f4', // Google blue
      status: 'confirmed'
    };
  }

  private transformOutlookEvent(event: Record<string, unknown>): UnifiedEvent {
    const eventObj = event as Record<string, unknown>;
    return {
      id: eventObj.id as string,
      title: (eventObj.subject as string) || 'No Title',
      description: ((eventObj.body as Record<string, unknown>)?.content as string)?.replace(/<[^>]*>/g, '') || '',
      start: ((eventObj.start as Record<string, unknown>)?.dateTime) as string,
      end: ((eventObj.end as Record<string, unknown>)?.dateTime) as string,
      allDay: false, // Outlook events typically have time
      location: ((eventObj.location as Record<string, unknown>)?.displayName as string) || '',
      attendees: (eventObj.attendees as Array<{emailAddress: {name?: string; address?: string}}>)?.map((a) => a.emailAddress.name || a.emailAddress.address) || [],
      source: 'outlook',
      sourceId: eventObj.id as string,
      url: (eventObj.webLink as string) || '',
      color: '#0078d4', // Outlook blue
      status: 'confirmed'
    };
  }

  private transformNotionEvent(event: Record<string, unknown>): UnifiedEvent {
    const eventObj = event as Record<string, unknown>;
    return {
      id: eventObj.id as string,
      title: (eventObj.title as string) || 'No Title',
      description: (eventObj.description as string) || '',
      start: eventObj.start as string,
      end: (eventObj.end as string) || (eventObj.start as string),
      allDay: (eventObj.allDay as boolean) || false,
      location: (eventObj.location as string) || '',
      attendees: (eventObj.attendees as string[]) || [],
      source: 'notion',
      sourceId: eventObj.id as string,
      url: (eventObj.url as string) || '',
      color: '#000000', // Notion black
      status: (eventObj.status as string) || 'confirmed'
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
        const sources = ['google', 'outlook', 'notion'];
        for (const source of sources) {
          try {
            const success = await this.createEvent(eventData, source as 'google' | 'outlook' | 'notion');
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
