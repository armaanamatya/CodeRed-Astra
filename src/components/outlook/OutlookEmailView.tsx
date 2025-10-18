'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OutlookEmail {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  body: {
    content: string;
    contentType: string;
  };
  isRead: boolean;
}

interface OutlookEmailViewProps {
  onSendEmail: () => void;
}

export default function OutlookEmailView({ onSendEmail }: OutlookEmailViewProps) {
  const [emails, setEmails] = useState<OutlookEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/outlook/email');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Outlook emails');
      }

      setEmails(data.messages || []);
    } catch (err) {
      console.error('Error fetching Outlook emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getEmailPreview = (body: { content: string; contentType: string }) => {
    if (body.contentType === 'text') {
      return body.content.substring(0, 200);
    } else {
      // Remove HTML tags for preview
      return body.content.replace(/<[^>]*>/g, '').substring(0, 200);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading Outlook emails...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={fetchEmails} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Outlook Email</h2>
        <div className="flex gap-2">
          <Button onClick={fetchEmails} variant="outline">
            Refresh
          </Button>
          <Button onClick={onSendEmail}>
            Send Email
          </Button>
        </div>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No Outlook emails found</div>
          <div className="text-gray-400 mt-2">Your inbox appears to be empty</div>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div 
              key={email.id} 
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                !email.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {email.subject || 'No Subject'}
                    </h3>
                    {!email.isRead && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>From:</strong> {email.from.emailAddress.name || email.from.emailAddress.address}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {formatDateTime(email.receivedDateTime)}
                  </div>
                  <div className="text-gray-700">
                    {getEmailPreview(email.body)}
                    {getEmailPreview(email.body).length >= 200 && '...'}
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
