'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  snippet: string;
}

interface GmailViewProps {
  onSendEmail: () => void;
}

export default function GmailView({ onSendEmail }: GmailViewProps) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/gmail');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Gmail messages');
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

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Gmail Messages</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Gmail Messages</h2>
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
        <h2 className="text-xl font-semibold">Gmail Messages</h2>
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
          <p>No messages found.</p>
          <p className="text-sm mt-2">Your inbox might be empty or there was an issue fetching messages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Message List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?.id === message.id ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <h4 className="font-semibold text-sm truncate">{message.subject}</h4>
                <p className="text-gray-600 text-xs truncate">{message.from}</p>
                <p className="text-gray-500 text-xs">{formatDate(message.date)}</p>
                <p className="text-gray-600 text-xs mt-1 line-clamp-2">{message.snippet}</p>
              </div>
            ))}
          </div>

          {/* Message Detail */}
          <div className="border rounded-lg p-4">
            {selectedMessage ? (
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedMessage.subject}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>From:</strong> {selectedMessage.from}</p>
                  <p><strong>Date:</strong> {formatDate(selectedMessage.date)}</p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Message Content:</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedMessage.body || selectedMessage.snippet}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Select a message to view its content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
