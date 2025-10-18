'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface NotionEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end?: string;
  allDay: boolean;
  location: string;
  attendees: string[];
  status: string;
  url: string;
  createdTime: string;
  lastEditedTime: string;
}

interface NotionCalendarViewProps {
  onCreateEvent: () => void;
}

export default function NotionCalendarView({ onCreateEvent }: NotionCalendarViewProps) {
  const [events, setEvents] = useState<NotionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
  const [availableDatabases, setAvailableDatabases] = useState<any[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');
  const [userToken, setUserToken] = useState<string>('');

  useEffect(() => {
    checkConnectionStatus();
    // Try to fetch events with a default database if available
    fetchEvents(process.env.NEXT_PUBLIC_NOTION_DATABASE_ID);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // Check if user has connected their Notion workspace
      const response = await fetch('/api/notion/calendar');
      const data = await response.json();
      setConnectionStatus(data.success || false);
    } catch (error) {
      console.error('Error checking Notion connection:', error);
      setConnectionStatus(false);
    }
  };

  const fetchEvents = async (databaseId?: string, token?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (databaseId) params.append('databaseId', databaseId);
      if (token) params.append('token', token);
      
      const url = `/api/notion/calendar?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
        setError(null);
      } else if (data.availableDatabases) {
        // Show available databases if no specific database is selected
        setAvailableDatabases(data.availableDatabases);
        setEvents([]);
        setError(null); // Don't show error, show database selection instead
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching Notion events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleConnectNotion = () => {
    const instructions = `
To connect your Notion workspace:

1. Go to https://www.notion.so/my-integrations
2. Click "New integration" 
3. Give it a name (e.g., "My Calendar App")
4. Select your workspace
5. Copy the "Internal Integration Token"
6. Paste it below and click "Connect"

Your integration will need access to your databases.
    `;
    
    const token = prompt(instructions + '\n\nEnter your Notion Integration Token:');
    if (token) {
      setUserToken(token);
      setConnectionStatus(true);
      fetchEvents(undefined, token);
    }
  };

  if (!connectionStatus) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Notion Calendar</h2>
          <p className="text-gray-600 mb-6">
            This feature requires Notion integration. If you don't have Notion, you can still use the Google Calendar tab above.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Connect Your Notion Calendar:</h3>
            <p className="text-sm text-blue-700 mb-3">
              Connect your personal Notion workspace to view and manage your calendar events. 
              You'll need to create a Notion integration and get your token.
            </p>
            <div className="text-xs text-blue-600">
              <p>• Your personal Notion workspace</p>
              <p>• Your own calendar events</p>
              <p>• One-time setup required</p>
            </div>
          </div>

          <Button onClick={handleConnectNotion} className="bg-purple-600 hover:bg-purple-700">
            Connect Notion Workspace
          </Button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Or use the <strong>Calendar</strong> tab above for Google Calendar events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Notion Calendar</h2>
        <div className="flex gap-2">
          <Button onClick={() => fetchEvents(selectedDatabaseId, userToken)} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={onCreateEvent} className="bg-purple-600 hover:bg-purple-700">
            Create Event
          </Button>
        </div>
      </div>

      {/* Database Selection */}
      {availableDatabases.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">Select a Database:</h3>
          <div className="space-y-2">
            {availableDatabases.map((db) => (
              <div key={db.id} className="flex items-center justify-between p-2 border rounded hover:bg-blue-100">
                <div>
                  <span className="font-medium">{db.title}</span>
                  <p className="text-sm text-gray-600">ID: {db.id}</p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedDatabaseId(db.id);
                    fetchEvents(db.id, userToken);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Use This Database
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Notion events...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchEvents} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && events.length === 0 && availableDatabases.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No events found in your Notion calendar.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting:</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Make sure your database has a <strong>Date</strong> property</li>
              <li>Make sure your database has a <strong>Title</strong> property</li>
              <li>Add some events to your database</li>
              <li>Check that your integration has access to the database</li>
            </ul>
          </div>
          <Button 
            onClick={onCreateEvent} 
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Create Your First Event
          </Button>
        </div>
      )}

      {!loading && !error && events.length === 0 && availableDatabases.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please select a database to view events.</p>
          <p className="text-sm text-gray-500">Choose from your available Notion databases above.</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-2">{event.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      📅 {formatDate(event.start)}
                    </span>
                    {!event.allDay && (
                      <span className="flex items-center gap-1">
                        🕐 {formatTime(event.start)}
                        {event.end && ` - ${formatTime(event.end)}`}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        📍 {event.location}
                      </span>
                    )}
                  </div>

                  {event.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <span>👥</span>
                      <span>{event.attendees.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      event.status === 'Completed' 
                        ? 'bg-green-100 text-green-800'
                        : event.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                    {event.allDay && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        All Day
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(event.url, '_blank')}
                  >
                    View in Notion
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
