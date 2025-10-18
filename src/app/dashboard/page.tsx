'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import CalendarView from '@/components/calendar/CalendarView';
import GmailView from '@/components/gmail/GmailView';
import CreateEventModal from '@/components/modals/CreateEventModal';
import SendEmailModal from '@/components/modals/SendEmailModal';

export default function DashboardPage() {
  const { session } = useAuth();
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'gmail' | 'account'>('calendar');

  const handleCreateEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event');
      }

      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleSendEmail = async (emailData: any) => {
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
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'calendar'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar
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
          {activeTab === 'calendar' && (
            <CalendarView onCreateEvent={() => setShowCreateEventModal(true)} />
          )}

          {activeTab === 'gmail' && (
            <GmailView onSendEmail={() => setShowSendEmailModal(true)} />
          )}

          {activeTab === 'account' && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-2">
                <p><strong>Email:</strong> {session?.user?.email}</p>
                <p><strong>Name:</strong> {session?.user?.name}</p>
                <p><strong>Access Token:</strong> {session?.accessToken ? '✅ Available' : '❌ Not available'}</p>
                <p><strong>Access Token Length:</strong> {session?.accessToken?.length || 0} characters</p>
                <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
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
          )}

          {/* Modals */}
          <CreateEventModal
            isOpen={showCreateEventModal}
            onClose={() => setShowCreateEventModal(false)}
            onSubmit={handleCreateEvent}
          />

          <SendEmailModal
            isOpen={showSendEmailModal}
            onClose={() => setShowSendEmailModal(false)}
            onSubmit={handleSendEmail}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}