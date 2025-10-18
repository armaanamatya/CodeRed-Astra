'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

interface CalendarViewProps {
  onCreateEvent: (eventData: any) => void;
}

export default function CalendarView({ onCreateEvent }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/calendar');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar events');
      }

      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Calendar Events</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Calendar Events</h2>
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchEvents} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Calendar Events</h2>
        <div className="flex gap-2">
          <Button onClick={fetchEvents} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={() => onCreateEvent({})} size="sm">
            Create Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No upcoming events found.</p>
          <p className="text-sm mt-2">Create your first event to get started!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{event.summary}</h3>
                  {event.description && (
                    <p className="text-gray-600 mt-1 text-sm">{event.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <p><strong>Start:</strong> {formatDate(event.start.dateTime || event.start.date)}</p>
                    <p><strong>End:</strong> {formatDate(event.end.dateTime || event.end.date)}</p>
                    {event.location && (
                      <p><strong>Location:</strong> {event.location}</p>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <p><strong>Attendees:</strong> {event.attendees.map(a => a.displayName || a.email).join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
