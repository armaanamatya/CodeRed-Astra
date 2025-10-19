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
  source: 'gmail';
}

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
  source: 'outlook';
}

type UnifiedMessage = GmailMessage | OutlookMessage;

interface UnifiedEmailViewProps {
  onSendGmailEmail: () => void;
  onSendOutlookEmail: () => void;
}

export default function UnifiedEmailView({ onSendGmailEmail, onSendOutlookEmail }: UnifiedEmailViewProps) {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<UnifiedMessage | null>(null);
  const [filters, setFilters] = useState({
    sources: ['gmail', 'outlook'],
    searchQuery: '',
    searchCategory: 'all' as 'all' | 'mail' | 'people' | 'files',
    mailboxType: 'inbox' as 'inbox' | 'sent' | 'drafts'
  });
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailsPerPage] = useState(20);
  const [totalEmails, setTotalEmails] = useState(0);
  const [hasMoreGmail, setHasMoreGmail] = useState(false);
  const [hasMoreOutlook, setHasMoreOutlook] = useState(false);
  const [gmailPageTokens, setGmailPageTokens] = useState<string[]>([]);
  const [outlookSkipCounts, setOutlookSkipCounts] = useState<number[]>([]);

  const fetchMessages = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const messagesPerSource = Math.ceil(emailsPerPage / 2); // Split equally between sources

      // Get the page token for Gmail (if navigating to a previously visited page)
      const gmailPageToken = page > 1 ? gmailPageTokens[page - 2] : undefined;
      
      // Get the skip count for Outlook
      const outlookSkip = (page - 1) * messagesPerSource;

      // Determine Gmail query based on mailbox type
      let gmailQuery = 'in:inbox';
      if (filters.mailboxType === 'sent') {
        gmailQuery = 'in:sent';
      } else if (filters.mailboxType === 'drafts') {
        gmailQuery = 'in:drafts';
      }

      // Fetch Gmail messages with pagination
      let gmailUrl = `/api/gmail?maxResults=${messagesPerSource}&q=${encodeURIComponent(gmailQuery)}`;
      if (gmailPageToken) {
        gmailUrl += `&pageToken=${gmailPageToken}`;
      }
      
      const gmailPromise = fetch(gmailUrl)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setHasMoreGmail(data.hasMore || false);
            
            // Store the next page token
            if (data.nextPageToken) {
              setGmailPageTokens(prev => {
                const newTokens = [...prev];
                newTokens[page - 1] = data.nextPageToken;
                return newTokens;
              });
            }
            
            return data.messages.map((msg: any) => ({ ...msg, source: 'gmail' as const }));
          }
          return [];
        })
        .catch(err => {
          console.error('Error fetching Gmail:', err);
          return [];
        });

      // Fetch Outlook messages with pagination
      const outlookPromise = fetch(`/api/outlook/email?maxResults=${messagesPerSource}&skip=${outlookSkip}&mailboxType=${filters.mailboxType}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setHasMoreOutlook(data.hasMore || false);
            return data.messages.map((msg: any) => ({ ...msg, source: 'outlook' as const }));
          }
          return [];
        })
        .catch(err => {
          console.error('Error fetching Outlook:', err);
          return [];
        });

      const [gmailMessages, outlookMessages] = await Promise.all([gmailPromise, outlookPromise]);
      
      const allMessages: UnifiedMessage[] = [...gmailMessages, ...outlookMessages];
      
      // Sort by date (most recent first)
      allMessages.sort((a, b) => {
        const dateA = a.source === 'gmail' ? new Date(a.date) : new Date(a.receivedDateTime);
        const dateB = b.source === 'gmail' ? new Date(b.date) : new Date(b.receivedDateTime);
        return dateB.getTime() - dateA.getTime();
      });

      setMessages(allMessages);
      setTotalEmails(allMessages.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when mailbox type changes
    setCurrentPage(1);
    setGmailPageTokens([]);
    fetchMessages(1);
  }, [filters.mailboxType]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchMessages(currentPage);
    }
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedMessage(null); // Clear selection when changing pages
  };

  const hasNextPage = hasMoreGmail || hasMoreOutlook;
  const hasPrevPage = currentPage > 1;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    if (isToday) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getMessageDate = (message: UnifiedMessage): string => {
    return message.source === 'gmail' ? message.date : message.receivedDateTime;
  };

  const getMessageSubject = (message: UnifiedMessage): string => {
    return message.subject || 'No Subject';
  };

  const getMessageFrom = (message: UnifiedMessage): string => {
    if (message.source === 'gmail') {
      return message.from || 'Unknown Sender';
    } else {
      if (!message.from || !message.from.emailAddress) {
        return 'Unknown Sender';
      }
      return message.from.emailAddress.name || message.from.emailAddress.address || 'Unknown Sender';
    }
  };

  const getMessagePreview = (message: UnifiedMessage): string => {
    if (message.source === 'gmail') {
      return message.snippet;
    } else {
      const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
      return message.body?.content ? stripHtml(message.body.content).substring(0, 200) : 'No preview available';
    }
  };

  const handleMessageClick = async (message: UnifiedMessage) => {
    setSelectedMessage(message);
    
    // Mark Outlook email as read if it's unread
    if (message.source === 'outlook' && !message.isRead) {
      try {
        setMarkingAsRead(true);
        const response = await fetch('/api/outlook/email', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId: message.id,
            isRead: true
          }),
        });

        if (response.ok) {
          // Update local state to mark message as read
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === message.id && msg.source === 'outlook'
                ? { ...msg, isRead: true }
                : msg
            )
          );
          
          // Update selected message too
          setSelectedMessage(prev => 
            prev && prev.id === message.id && prev.source === 'outlook'
              ? { ...prev, isRead: true }
              : prev
          );
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      } finally {
        setMarkingAsRead(false);
      }
    }
  };

  const sanitizeHtml = (html: string): string => {
    // Remove script and style tags for security
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove potentially dangerous attributes
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
    
    return sanitized;
  };

  const filteredMessages = messages.filter(message => {
    // Filter by source
    if (!filters.sources.includes(message.source)) {
      return false;
    }

    // Filter by search query and category
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const subject = getMessageSubject(message).toLowerCase();
      const from = getMessageFrom(message).toLowerCase();
      const preview = getMessagePreview(message).toLowerCase();
      
      switch (filters.searchCategory) {
        case 'people':
          // Search only in sender field
          return from.includes(query);
        case 'mail':
          // Search in subject and body
          return subject.includes(query) || preview.includes(query);
        case 'files':
          // Search for messages with attachments (you can enhance this later)
          // For now, search in subject for common file extensions
          const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.jpg', '.png', 'attachment'];
          return fileExtensions.some(ext => subject.includes(ext) || preview.includes(ext));
        case 'all':
        default:
          // Search everywhere
          return subject.includes(query) || from.includes(query) || preview.includes(query);
      }
    }

    return true;
  });

  const renderMessageDetail = () => {
    if (!selectedMessage) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>Select a message to view its content</p>
        </div>
      );
    }

    if (selectedMessage.source === 'gmail') {
      const isHtml = selectedMessage.body && selectedMessage.body.includes('<');
      
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Gmail
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">{selectedMessage.subject}</h3>
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>From:</strong> {selectedMessage.from}</p>
            <p><strong>Date:</strong> {formatDate(selectedMessage.date)}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Message Content:</h4>
            <div className="text-sm text-gray-700 max-h-96 overflow-y-auto bg-white p-4 rounded border">
              {isHtml ? (
                <div 
                  className="email-content overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedMessage.body) }}
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap break-words overflow-hidden">
                  {selectedMessage.body || selectedMessage.snippet}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else {
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

      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              Outlook
            </span>
            {!selectedMessage.isRead && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                New
              </span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(selectedMessage.importance)}`}>
              {selectedMessage.importance}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">{selectedMessage.subject || 'No Subject'}</h3>
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>From:</strong> {getMessageFrom(selectedMessage)}</p>
            <p><strong>Date:</strong> {formatDate(selectedMessage.receivedDateTime)}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Message Content:</h4>
            <div className="text-sm text-gray-700 max-h-96 overflow-y-auto bg-white p-4 rounded border">
              {selectedMessage.body?.content ? (
                <div 
                  className="email-content overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedMessage.body.content) }}
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                  }}
                />
              ) : (
                <p className="text-gray-500">No message content available</p>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Unified Emails</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Unified Emails</h2>
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => fetchMessages(currentPage)} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Unified Email</h2>
          <div className="flex gap-2">
            <Button onClick={() => fetchMessages(currentPage)} variant="outline" size="sm">
              Refresh
            </Button>
            <Button onClick={onSendGmailEmail} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Send Gmail
            </Button>
            {/* Outlook send temporarily disabled - permission issues */}
            {/* <Button onClick={onSendOutlookEmail} size="sm" className="bg-orange-600 hover:bg-orange-700">
              Send Outlook
            </Button> */}
          </div>
        </div>
        
        {/* Pagination Info */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Page {currentPage} • Showing {filteredMessages.length} emails
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              variant="outline"
              size="sm"
            >
              ← Previous
            </Button>
            <span className="px-3 py-1 bg-gray-100 rounded flex items-center">
              {currentPage}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              variant="outline"
              size="sm"
            >
              Next →
            </Button>
          </div>
        </div>
      </div>

      {/* Mailbox Type Selector */}
      <div className="mb-4 flex gap-2 border-b pb-2">
        <button
          onClick={() => setFilters({ ...filters, mailboxType: 'inbox' })}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filters.mailboxType === 'inbox'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📥 Inbox
        </button>
        <button
          onClick={() => setFilters({ ...filters, mailboxType: 'sent' })}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filters.mailboxType === 'sent'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📤 Sent
        </button>
        <button
          onClick={() => setFilters({ ...filters, mailboxType: 'drafts' })}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filters.mailboxType === 'drafts'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📝 Drafts
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Email Inbox Filters */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Inboxes:</label>
          <button
            onClick={() => {
              if (filters.sources.includes('gmail')) {
                setFilters({ ...filters, sources: filters.sources.filter(s => s !== 'gmail') });
              } else {
                setFilters({ ...filters, sources: [...filters.sources, 'gmail'] });
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
              filters.sources.includes('gmail')
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
            </svg>
            Gmail
          </button>
          <button
            onClick={() => {
              if (filters.sources.includes('outlook')) {
                setFilters({ ...filters, sources: filters.sources.filter(s => s !== 'outlook') });
              } else {
                setFilters({ ...filters, sources: [...filters.sources, 'outlook'] });
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
              filters.sources.includes('outlook')
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            </svg>
            Outlook
          </button>
        </div>

        {/* Search with Categories */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Search:</label>
          <div className="flex gap-1">
            {(['all', 'mail', 'people', 'files'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setFilters({ ...filters, searchCategory: category })}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  filters.searchCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' && '🔍 All'}
                {category === 'mail' && '✉️ Mail'}
                {category === 'people' && '👥 People'}
                {category === 'files' && '📎 Files'}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={`Search ${filters.searchCategory}...`}
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="px-3 py-1 border rounded text-sm flex-1 max-w-xs"
          />
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No messages found.</p>
          <p className="text-sm mt-2">
            {filters.sources.length === 0
              ? 'Please select at least one email source to view messages.'
              : 'Your inbox might be empty or there was an issue fetching messages.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Message List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMessages.map((message) => (
              <div
                key={`${message.source}-${message.id}`}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?.id === message.id && selectedMessage?.source === message.source
                    ? 'bg-blue-50 border-blue-300'
                    : ''
                } ${
                  message.source === 'outlook' && !message.isRead
                    ? 'border-l-4 border-l-blue-500'
                    : ''
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {getMessageSubject(message)}
                      </h4>
                      <span className={`p-1 rounded flex-shrink-0 ${
                        message.source === 'gmail'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {message.source === 'gmail' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                          </svg>
                        )}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs truncate">{getMessageFrom(message)}</p>
                    <p className="text-gray-500 text-xs">{formatDate(getMessageDate(message))}</p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {getMessagePreview(message)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Detail */}
          <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
            {renderMessageDetail()}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Gmail</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
          <span>Outlook</span>
        </div>
      </div>
    </div>
  );
}

