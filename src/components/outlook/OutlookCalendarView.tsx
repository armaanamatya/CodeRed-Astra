'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  body?: {
    content: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
}

interface OutlookCalendarViewProps {
  onCreateEvent: () => void;
}

export default function OutlookCalendarView({ onCreateEvent }: OutlookCalendarViewProps) {
  const [events, setEvents] = useState<OutlookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/outlook/calendar');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Outlook calendar events');
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching Outlook calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading Outlook calendar events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={fetchEvents} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Outlook Calendar</h2>
        <div className="flex gap-2">
          <Button onClick={fetchEvents} variant="outline">
            Refresh
          </Button>
          <Button onClick={onCreateEvent}>
            Create Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No Outlook calendar events found</div>
          <div className="text-gray-400 mt-2">Create your first event to get started</div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.subject || 'No Subject'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>
                      <strong>Start:</strong> {formatDateTime(event.start.dateTime)}
                    </div>
                    <div>
                      <strong>End:</strong> {formatDateTime(event.end.dateTime)}
                    </div>
                    {event.location?.displayName && (
                      <div>
                        <strong>Location:</strong> {event.location.displayName}
                      </div>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div>
                        <strong>Attendees:</strong>{' '}
                        {event.attendees.map(attendee => attendee.emailAddress.name || attendee.emailAddress.address).join(', ')}
                      </div>
                    )}
                    {event.body?.content && (
                      <div className="mt-2">
                        <strong>Description:</strong>
                        <div className="mt-1 text-gray-700 whitespace-pre-wrap">
                          {event.body.content.replace(/<[^>]*>/g, '')}
                        </div>
                      </div>
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
