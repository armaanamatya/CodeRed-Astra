'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OutlookMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
  body: {
    content: string;
    contentType: string;
  };
  isRead: boolean;
  importance: string;
}

interface OutlookEmailViewProps {
  onSendEmail: () => void;
}

export default function OutlookEmailView({ onSendEmail }: OutlookEmailViewProps) {
  const [messages, setMessages] = useState<OutlookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<OutlookMessage | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/outlook/email');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Outlook messages');
      }

      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getImportanceColor = (importance: string) => {
    switch (importance.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Outlook Email</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Outlook Email</h2>
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchMessages} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Outlook Email</h2>
        <div className="flex gap-2">
          <Button onClick={fetchMessages} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={onSendEmail} size="sm">
            Send Email
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No Outlook messages found.</p>
          <p className="text-sm mt-2">Send your first email to get started!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                !message.isRead ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{message.subject || 'No Subject'}</h3>
                    {!message.isRead && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        New
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(message.importance)}`}>
                      {message.importance}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>From:</strong> {message.from.emailAddress.name || message.from.emailAddress.address}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    <strong>Date:</strong> {formatDate(message.receivedDateTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {message.body?.content ? stripHtml(message.body.content).substring(0, 200) + '...' : 'No preview available'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedMessage.subject || 'No Subject'}</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <strong>From:</strong> {selectedMessage.from.emailAddress.name || selectedMessage.from.emailAddress.address}
              </div>
              <div>
                <strong>Date:</strong> {formatDate(selectedMessage.receivedDateTime)}
              </div>
              <div>
                <strong>Importance:</strong> {selectedMessage.importance}
              </div>
              <div>
                <strong>Status:</strong> {selectedMessage.isRead ? 'Read' : 'Unread'}
              </div>
              
              <div className="border-t pt-4">
                <strong>Message:</strong>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {selectedMessage.body?.content ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.body.content }} />
                  ) : (
                    <p className="text-gray-500">No message content available</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setSelectedMessage(null)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}