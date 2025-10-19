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

interface NotionMCPCalendarViewProps {
  onCreateEvent: () => void;
}

export default function NotionMCPCalendarView({ onCreateEvent }: NotionMCPCalendarViewProps) {
  const [events, setEvents] = useState<NotionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(true);
  const [availableDatabases, setAvailableDatabases] = useState<any[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');
  const [userApiKey, setUserApiKey] = useState<string>('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setCheckingConnection(true);
      const response = await fetch('/api/notion-mcp/connect');
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus(true);
        // If already connected, try to fetch databases
        fetchDatabases();
      } else {
        // Not connected, but don't show error - let user choose connection method
        setConnectionStatus(false);
        setError(null); // Clear any previous errors
      }
    } catch (error) {
      console.error('Error checking Notion MCP connection:', error);
      setConnectionStatus(false);
      setError(null); // Don't show error on initial load
    } finally {
      setCheckingConnection(false);
    }
  };

  const fetchDatabases = async (apiKey?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/notion-mcp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notionApiKey: apiKey || userApiKey }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.databases) {
        setAvailableDatabases(data.databases);
        if (data.databases.length > 0) {
          setSelectedDatabaseId(data.databases[0].id);
          fetchEvents(data.databases[0].id);
        }
      } else {
        setError(data.error || 'Failed to fetch databases');
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
      setError('Failed to fetch databases');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (databaseId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const dbId = databaseId || selectedDatabaseId;
      if (!dbId) {
        setError('Please select a database first');
        return;
      }

      const response = await fetch(`/api/notion-mcp/calendar?databaseId=${dbId}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectNotion = async () => {
    try {
      setLoading(true);
      
      // Get OAuth URL from server
      const response = await fetch('/api/notion-mcp/oauth');
      const data = await response.json();
      
      if (response.ok && data.oauthUrl) {
        // Redirect to Notion OAuth
        window.location.href = data.oauthUrl;
      } else {
        setError(data.error || 'Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      setError('Failed to connect to Notion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualConnect = () => {
    const instructions = `
To connect your Notion workspace manually:

1. Go to https://www.notion.so/my-integrations
2. Click "New integration" 
3. Give it a name (e.g., "CodeRed Astra")
4. Select your workspace
5. Copy the "Internal Integration Token"
6. Paste it below and click "Connect"

Your integration will need access to your databases.
    `;
    
    const apiKey = prompt(instructions + '\n\nEnter your Notion Integration Token:');
    if (apiKey) {
      setUserApiKey(apiKey);
      setConnectionStatus(true);
      fetchDatabases(apiKey);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (checkingConnection) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Checking Notion connection...</p>
        </div>
      </div>
    );
  }

  if (!connectionStatus) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Notion Calendar</h2>
          <p className="text-gray-600 mb-6">
            Connect your Notion workspace to view and manage your calendar events. Choose your preferred connection method below.
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-purple-800 mb-2">Connect Your Notion Workspace:</h3>
            <p className="text-sm text-purple-700 mb-3">
              Choose your preferred connection method. OAuth is recommended for the best experience.
            </p>
            <div className="text-xs text-purple-600">
              <p>• OAuth: Automatic, secure, no manual setup</p>
              <p>• Manual: Use integration token if OAuth isn't available</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleConnectNotion} 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect with OAuth (Recommended)'}
            </Button>
            
            <Button 
              onClick={handleManualConnect} 
              variant="outline" 
              className="w-full"
            >
              Connect with API Key (Manual)
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Or use the <strong>Calendar</strong> tab for Google Calendar integration</p>
          </div>

          <div className="mt-6">
            <Button 
              onClick={checkConnectionStatus} 
              variant="outline" 
              size="sm"
              disabled={checkingConnection}
            >
              {checkingConnection ? 'Checking...' : 'Refresh Connection Status'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading Notion data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchEvents()} className="bg-purple-600 hover:bg-purple-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Notion Calendar (MCP)</h2>
        <div className="flex gap-2">
          <Button onClick={onCreateEvent} className="bg-purple-600 hover:bg-purple-700">
            Create Event
          </Button>
          <Button onClick={() => fetchEvents()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Database Selection */}
      {availableDatabases.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Database:
          </label>
          <select
            value={selectedDatabaseId}
            onChange={(e) => {
              setSelectedDatabaseId(e.target.value);
              fetchEvents(e.target.value);
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {availableDatabases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No events found in the selected database.</p>
            <p className="text-sm mt-2">Try creating a new event or selecting a different database.</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 mt-1">{event.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <p><strong>Start:</strong> {formatTime(event.start)}</p>
                    {event.end && <p><strong>End:</strong> {formatTime(event.end)}</p>}
                    {event.location && <p><strong>Location:</strong> {event.location}</p>}
                    {event.attendees.length > 0 && (
                      <p><strong>Attendees:</strong> {event.attendees.join(', ')}</p>
                    )}
                    <p><strong>Status:</strong> {event.status}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => window.open(event.url, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    View in Notion
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
