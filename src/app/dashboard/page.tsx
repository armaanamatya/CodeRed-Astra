'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';
import UnifiedCalendarGrid from '@/components/calendar/UnifiedCalendarGrid';
import UnifiedEmailView from '@/components/email/UnifiedEmailView';
import { TextToSpeechForm } from '@/components/elevenlabs/TextToSpeechForm';
import { SubscriptionInfo } from '@/components/elevenlabs/SubscriptionInfo';
import UnifiedEventModal from '@/components/modals/UnifiedEventModal';
import SendEmailModal from '@/components/modals/SendEmailModal';
import SendOutlookEmailModal from '@/components/modals/SendOutlookEmailModal';
import NotionMCPCalendarView from '@/components/notion/NotionMCPCalendarView';
import { UnifiedEvent } from '@/types/calendar';
import { CalendarService } from '@/lib/calendarService';
import { ToastContainer } from '@/components/ui/toast';
import type { ToastType } from '@/components/ui/toast';

type EventData = {
  title: string;
  description: string;
  start: string;
  end: string;
  location?: string;
  allDay?: boolean;
  source: 'google' | 'outlook' | 'notion';
};

type EmailData = {
  to: string;
  subject: string;
  body: string;
};

type OutlookEventData = {
  subject: string;
  body: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
};

type OutlookEmailData = {
  toRecipients: Array<{ emailAddress: { address: string } }>;
  subject: string;
  body: string;
};

export default function DashboardPage() {
  const { session, signOut } = useAuth();
  const [showUnifiedEventModal, setShowUnifiedEventModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showSendOutlookEmailModal, setShowSendOutlookEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'emails' | 'notion' | 'elevenlabs' | 'account'>('calendar');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleCreateEvent = async (eventData: Partial<UnifiedEvent>) => {
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

      showToast('Event created successfully!', 'success');
      setShowUnifiedEventModal(false);
      
      // Clear cache to refresh data
      const calendarService = CalendarService.getInstance();
      calendarService.clearCache();
      
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Failed to create event. Please try again.', 'error');
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

      showToast('Email sent successfully!', 'success');
      setShowSendEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email. Please try again.', 'error');
    }
  };

  const handleCreateOutlookEvent = async (eventData: OutlookEventData) => {
    try {
      const response = await fetch('/api/outlook/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Outlook event');
      }

      alert('Outlook event created successfully!');
    } catch (error) {
      console.error('Error creating Outlook event:', error);
      alert('Failed to create Outlook event. Please try again.');
    }
  };

  // Temporarily disabled - Microsoft Graph permission issues
  // const handleSendOutlookEmail = async (emailData: any) => {
  //   try {
  //     const response = await fetch('/api/outlook/email', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(emailData),
  //     });

  //     const result = await response.json();

  //     if (!response.ok) {
  //       throw new Error(result.error || 'Failed to send Outlook email');
  //     }

  //     showToast('Outlook email sent successfully!', 'success');
  //     setShowSendOutlookEmailModal(false);
  //   } catch (error) {
  //     console.error('Error sending Outlook email:', error);
  //     showToast('Failed to send Outlook email. Please try again.', 'error');
  //   }
  // };

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
        showToast('Microsoft account is already connected!', 'info');
      } else {
        // Redirect to Microsoft OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Microsoft:', error);
      showToast('Failed to connect to Microsoft. Please try again.', 'error');
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
      showToast('Failed to reconnect to Microsoft. Please try again.', 'error');
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const handleMicrosoftDisconnect = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to disconnect your Microsoft account? You will need to reconnect to use Outlook features.');
      
      if (!confirmed) return;

      setMicrosoftLoading(true);
      
      const response = await fetch('/api/microsoft/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect Microsoft account');
      }

      setMicrosoftConnected(false);
      showToast('Microsoft account disconnected successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting Microsoft:', error);
      showToast('Failed to disconnect Microsoft account', 'error');
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
      <main className="relative min-h-screen overflow-hidden">
        {/* Background with solid color */}
        <div className="absolute inset-0 bg-theme-background" />
        
        {/* Navigation Bar */}
        <div className="fixed top-4 left-4 right-4 z-50 transition-all duration-300 border-2 border-theme-border bg-theme-secondary shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-95 h-[60px] rounded-[30px]">
          <div className="flex justify-between items-center h-full px-8">
            {/* Animated NAVI Logo */}
            <div className="text-theme-primary font-bold text-2xl navi-logo relative group cursor-pointer">
              {/* SVG Background - Slides from center to right on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out -z-10">
                <Image
                  src="/assets/NaviDarkMode.svg"
                  alt="NAVI Logo Background"
                  width={120}
                  height={40}
                  className="transform translate-x-0 group-hover:translate-x-full transition-transform duration-300 ease-out"
                />
              </div>
              <div className="relative z-10">
                <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">N</span>
                <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">A</span>
                <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">V</span>
                <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">I</span>
              </div>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-4">
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-theme-foreground">
                  {session?.user?.name || session?.user?.email}
                </span>
                <Button 
                  onClick={signOut} 
                  className="bg-theme-primary text-theme-primary-foreground hover:bg-theme-accent border border-theme-border text-sm px-3 py-1"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-32 relative z-10">
          <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-theme-foreground mb-2">Dashboard</h1>
              <p className="text-theme-foreground opacity-80">Welcome back, {session?.user?.name || 'User'}!</p>
            </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-theme-border">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'calendar'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unified Calendar
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'emails'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unified Emails
            </button>
            <button
              onClick={() => setActiveTab('notion')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'notion'
                  ? 'border-b-2 border-theme-border text-theme-foreground'
                  : 'text-theme-foreground hover:text-theme-accent'
              }`}
            >
              Notion
            </button>
            <button
              onClick={() => setActiveTab('elevenlabs')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'elevenlabs'
                  ? 'border-b-2 border-theme-border text-theme-foreground'
                  : 'text-theme-foreground hover:text-theme-accent'
              }`}
            >
              ElevenLabs AI
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'account'
                  ? 'border-b-2 border-theme-border text-theme-foreground'
                  : 'text-theme-foreground hover:text-theme-accent'
              }`}
            >
              Account Info
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'calendar' && (
            <UnifiedCalendarGrid
              onEventClick={(event) => {
                setSelectedEvent(event);
                // You could show an event details modal here
                console.log('Event clicked:', event);
              }}
              onCreateEvent={(date) => {
                setSelectedDate(date || null);
                setShowUnifiedEventModal(true);
              }}
              onDateClick={(date) => {
                setSelectedDate(date);
                setShowUnifiedEventModal(true);
              }}
            />
          )}

          {activeTab === 'emails' && (
            <UnifiedEmailView 
              onSendGmailEmail={() => setShowSendEmailModal(true)}
              onSendOutlookEmail={() => {}} // Disabled - permission issues
            />
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
            <div className="p-6 border border-theme-border rounded-lg bg-theme-background">
              <h2 className="text-xl font-semibold mb-4 text-theme-foreground">Account Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-theme-foreground"><strong>Email:</strong> {session?.user?.email}</p>
                  <p className="text-theme-foreground"><strong>Name:</strong> {session?.user?.name}</p>
                  <p className="text-theme-foreground"><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
                </div>
                
                <div className="border-t border-theme-border pt-4">
                  <h3 className="text-lg font-medium mb-2 text-theme-foreground">Connected Services</h3>
                  {microsoftConnected && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <Button 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/microsoft/token-info');
                            const data = await response.json();
                            const info = JSON.stringify(data, null, 2);
                            alert(`Microsoft Token Info:\n\n${info}`);
                            console.log('Microsoft Token Info:', data);
                          } catch (error) {
                            console.error('Error fetching token info:', error);
                            showToast('Failed to fetch token info', 'error');
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        🔍 Debug: Check Token Permissions
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-foreground"><strong>Google:</strong> {googleConnected ? '✅ Connected' : '❌ Not connected'}</span>
                      {googleConnected && (
                        <span className="text-sm text-theme-foreground opacity-70">
                          Calendar & Gmail access enabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-foreground"><strong>Microsoft:</strong> {microsoftConnected ? '✅ Connected' : '❌ Not connected'}</span>
                      <div className="flex gap-2">
                        {!microsoftConnected ? (
                          <Button 
                            onClick={handleMicrosoftConnect}
                            disabled={microsoftLoading}
                            size="sm"
                            className="bg-theme-primary hover:bg-theme-accent text-theme-primary-foreground border border-theme-border"
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
                            <Button 
                              onClick={handleMicrosoftDisconnect}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              disabled={microsoftLoading}
                            >
                              Disconnect
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

          {/* Outlook send temporarily disabled - permission issues */}
          {/* <SendOutlookEmailModal
            isOpen={showSendOutlookEmailModal}
            onClose={() => setShowSendOutlookEmailModal(false)}
            onSubmit={handleSendOutlookEmail}
          /> */}

          {/* Toast Notifications */}
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
