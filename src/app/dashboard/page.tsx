'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import UnifiedCalendarGrid from '@/components/calendar/UnifiedCalendarGrid';
import GmailView from '@/components/gmail/GmailView';
import OutlookCalendarView from '@/components/outlook/OutlookCalendarView';
import OutlookEmailView from '@/components/outlook/OutlookEmailView';
import NotionMCPCalendarView from '@/components/notion/NotionMCPCalendarView';
import { TextToSpeechForm } from '@/components/elevenlabs/TextToSpeechForm';
import { SubscriptionInfo } from '@/components/elevenlabs/SubscriptionInfo';
import UnifiedEventModal from '@/components/modals/UnifiedEventModal';
import SendEmailModal from '@/components/modals/SendEmailModal';
import SendOutlookEmailModal from '@/components/modals/SendOutlookEmailModal';
import type { EventData, EmailData, OutlookEventData, OutlookEmailData } from '@/types/event.d';

export default function DashboardPage() {
  const { session } = useAuth();
  const [showUnifiedEventModal, setShowUnifiedEventModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showSendOutlookEmailModal, setShowSendOutlookEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'unified' | 'gmail' | 'outlook' | 'notion' | 'elevenlabs' | 'account'>('unified');
  const [outlookSubTab, setOutlookSubTab] = useState<'calendar' | 'email'>('calendar');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

  const handleCreateEvent = async (eventData: EventData) => {
    try {
      console.log('Creating event:', eventData);
      
      // Create event directly via the appropriate API based on source
      let response;
      if (eventData.source === 'google') {
        response = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: eventData.title,
            description: eventData.description,
            startDateTime: eventData.start,
            endDateTime: eventData.end
          })
        });
      } else if (eventData.source === 'outlook') {
        response = await fetch('/api/outlook/calendar', {
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
      } else if (eventData.source === 'notion') {
        response = await fetch('/api/notion-mcp/calendar', {
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
      } else {
        throw new Error('Invalid event source');
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event');
      }

      alert('Event created successfully!');
      setShowUnifiedEventModal(false);
      
      // Clear cache to refresh data
      const calendarService = CalendarService.getInstance();
      calendarService.clearCache();
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleSendEmail = async (emailData: EmailData) => {
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleSendOutlookEmail = async (emailData: OutlookEmailData) => {
    try {
      const response = await fetch('/api/outlook/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send Outlook email');
      }

      alert('Outlook email sent successfully!');
    } catch (error) {
      console.error('Error sending Outlook email:', error);
      alert('Failed to send Outlook email. Please try again.');
    }
  };

  const handleMicrosoftConnect = async () => {
    try {
      setMicrosoftLoading(true);
      const response = await fetch('/api/microsoft/auth');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get Microsoft auth URL');
      }

      if (data.connected) {
        setMicrosoftConnected(true);
        alert('Microsoft account is already connected!');
      } else {
        // Redirect to Microsoft OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Microsoft:', error);
      alert('Failed to connect to Microsoft. Please try again.');
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const refreshMicrosoftStatus = async () => {
    try {
      const response = await fetch('/api/microsoft/auth');
      const data = await response.json();
      if (response.ok) {
        setMicrosoftConnected(data.connected);
      }
    } catch (error) {
      console.error('Error checking Microsoft status:', error);
    }
  };

  const handleMicrosoftReconnect = async () => {
    try {
      setMicrosoftLoading(true);
      const response = await fetch('/api/microsoft/reconnect');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get Microsoft reconnect URL');
      }

      // Redirect to Microsoft OAuth for reconnection
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error reconnecting to Microsoft:', error);
      alert('Failed to reconnect to Microsoft. Please try again.');
    } finally {
      setMicrosoftLoading(false);
    }
  };

  // Check connection status on component mount
  React.useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const response = await fetch('/api/google/auth');
        const data = await response.json();
        if (response.ok) {
          setGoogleConnected(data.connected);
        }
      } catch (error) {
        console.error('Error checking Google status:', error);
      }
    };

    const checkMicrosoftStatus = async () => {
      try {
        const response = await fetch('/api/microsoft/auth');
        const data = await response.json();
        if (response.ok) {
          setMicrosoftConnected(data.connected);
        }
      } catch (error) {
        console.error('Error checking Microsoft status:', error);
      }
    };

    checkGoogleStatus();
    checkMicrosoftStatus();

    // Check for Microsoft connection success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('microsoft_connected') === 'true') {
      setMicrosoftConnected(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh the page to update the UI
      window.location.reload();
    }
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <span className="text-lg font-medium">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('unified')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'unified'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unified Calendar
            </button>
            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'gmail'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gmail
            </button>
            <button
              onClick={() => setActiveTab('outlook')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'outlook'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Outlook
            </button>
            <button
              onClick={() => setActiveTab('notion')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'notion'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notion
            </button>
            <button
              onClick={() => setActiveTab('elevenlabs')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'elevenlabs'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ElevenLabs AI
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'account'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Account Info
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'unified' && (
            <UnifiedCalendarGrid
              onEventClick={(event) => {
                setSelectedEvent(event);
                // You could show an event details modal here
                console.log('Event clicked:', event);
              }}
              onCreateEvent={(date) => {
                setShowUnifiedEventModal(true);
              }}
              onDateClick={(date) => {
                setShowUnifiedEventModal(true);
              }}
            />
          )}

          {activeTab === 'gmail' && (
            <GmailView onSendEmail={() => setShowSendEmailModal(true)} />
          )}

          {activeTab === 'outlook' && (
            <div className="space-y-6">
              {!microsoftConnected ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-4">Microsoft account not connected</div>
                  <Button 
                    onClick={handleMicrosoftConnect}
                    disabled={microsoftLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {microsoftLoading ? 'Connecting...' : 'Connect to Microsoft'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setOutlookSubTab('calendar')}
                      className={`px-4 py-2 font-medium rounded-lg ${
                        outlookSubTab === 'calendar'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Calendar
                    </button>
                    <button
                      onClick={() => setOutlookSubTab('email')}
                      className={`px-4 py-2 font-medium rounded-lg ${
                        outlookSubTab === 'email'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                  
                  {outlookSubTab === 'calendar' && (
                    <OutlookCalendarView onCreateEvent={() => setShowUnifiedEventModal(true)} />
                  )}
                  
                  {outlookSubTab === 'email' && (
                    <OutlookEmailView onSendEmail={() => setShowSendOutlookEmailModal(true)} />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notion' && (
            <NotionMCPCalendarView onCreateEvent={() => setShowUnifiedEventModal(true)} />
          )}

          {activeTab === 'elevenlabs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border">
                  <TextToSpeechForm />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg border">
                  <SubscriptionInfo />
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">ElevenLabs Features</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• AI-powered text-to-speech</p>
                    <p>• Multiple voice options</p>
                    <p>• Adjustable voice settings</p>
                    <p>• Download MP3 files</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p><strong>Email:</strong> {session?.user?.email}</p>
                  <p><strong>Name:</strong> {session?.user?.name}</p>
                  <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Connected Services</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span><strong>Google:</strong> {googleConnected ? '✅ Connected' : '❌ Not connected'}</span>
                      {googleConnected && (
                        <span className="text-sm text-gray-500">
                          Calendar & Gmail access enabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span><strong>Microsoft:</strong> {microsoftConnected ? '✅ Connected' : '❌ Not connected'}</span>
                      <div className="flex gap-2">
                        {!microsoftConnected ? (
                          <Button 
                            onClick={handleMicrosoftConnect}
                            disabled={microsoftLoading}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {microsoftLoading ? 'Connecting...' : 'Connect'}
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              onClick={refreshMicrosoftStatus}
                              size="sm"
                              variant="outline"
                            >
                              Refresh
                            </Button>
                            <Button 
                              onClick={handleMicrosoftReconnect}
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              Reconnect
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p><strong>Session Error:</strong> {session?.error || 'None'}</p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => window.open('/api/debug/session', '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      Debug Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          <UnifiedEventModal
            isOpen={showUnifiedEventModal}
            onClose={() => setShowUnifiedEventModal(false)}
            onSubmit={handleCreateEvent}
            initialData={selectedEvent || undefined}
            targetSource={selectedEvent?.source}
          />

          <SendEmailModal
            isOpen={showSendEmailModal}
            onClose={() => setShowSendEmailModal(false)}
            onSubmit={handleSendEmail}
          />

          <SendOutlookEmailModal
            isOpen={showSendOutlookEmailModal}
            onClose={() => setShowSendOutlookEmailModal(false)}
            onSubmit={handleSendOutlookEmail}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}