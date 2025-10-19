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
        <div className="text-center text-theme-muted-foreground py-8">
          <p>Select a message to view its content</p>
        </div>
      );
    }

    if (selectedMessage.source === 'gmail') {
      const isHtml = selectedMessage.body && selectedMessage.body.includes('<');
      
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs bg-theme-primary text-theme-primary-foreground rounded-full">
              Gmail
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2 text-theme-foreground">{selectedMessage.subject}</h3>
          <div className="text-sm text-theme-muted-foreground mb-4">
            <p><strong>From:</strong> {selectedMessage.from}</p>
            <p><strong>Date:</strong> {formatDate(selectedMessage.date)}</p>
          </div>
          <div className="border-t border-theme-border pt-4">
            <h4 className="font-medium mb-2 text-theme-foreground">Message Content:</h4>
            <div className="text-sm text-theme-foreground max-h-96 overflow-y-auto bg-theme-secondary p-4 rounded border border-theme-border custom-scrollbar">
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
            return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
          case 'low':
            return 'text-theme-muted-foreground bg-theme-secondary';
          default:
            return 'text-theme-primary bg-theme-accent';
        }
      };

      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs bg-theme-accent text-theme-accent-foreground rounded-full">
              Outlook
            </span>
            {!selectedMessage.isRead && (
              <span className="px-2 py-1 text-xs bg-theme-primary text-theme-primary-foreground rounded-full">
                New
              </span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(selectedMessage.importance)}`}>
              {selectedMessage.importance}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2 text-theme-foreground">{selectedMessage.subject || 'No Subject'}</h3>
          <div className="text-sm text-theme-muted-foreground mb-4">
            <p><strong>From:</strong> {getMessageFrom(selectedMessage)}</p>
            <p><strong>Date:</strong> {formatDate(selectedMessage.receivedDateTime)}</p>
          </div>
          <div className="border-t border-theme-border pt-4">
            <h4 className="font-medium mb-2 text-theme-foreground">Message Content:</h4>
            <div className="text-sm text-theme-foreground max-h-96 overflow-y-auto bg-theme-secondary p-4 rounded border border-theme-border custom-scrollbar">
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
                <p className="text-theme-muted-foreground">No message content available</p>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6 border-theme-border border rounded-lg bg-theme-background">
        <h2 className="text-xl font-semibold mb-4 text-theme-foreground">Unified Emails</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border-theme-border border rounded-lg bg-theme-background">
        <h2 className="text-xl font-semibold mb-4 text-theme-foreground">Unified Emails</h2>
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => fetchMessages(currentPage)} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 border-theme-border border rounded-lg bg-theme-background">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-theme-foreground">Unified Email</h2>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchMessages(currentPage)} 
              variant="outline" 
              size="sm"
              className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
            >
              Refresh
            </Button>
            <Button 
              onClick={onSendGmailEmail} 
              size="sm" 
              className="bg-theme-primary hover:bg-theme-accent text-theme-primary-foreground hover:text-theme-accent-foreground transition-all duration-200 hover:shadow-lg"
            >
              Send Gmail
            </Button>
            {/* Outlook send temporarily disabled - permission issues */}
            {/* <Button onClick={onSendOutlookEmail} size="sm" className="bg-orange-600 hover:bg-orange-700">
              Send Outlook
            </Button> */}
          </div>
        </div>
        
        {/* Pagination Info */}
        <div className="flex justify-between items-center text-sm text-theme-muted-foreground">
          <span>
            Page {currentPage} • Showing {filteredMessages.length} emails
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              variant="outline"
              size="sm"
              className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              ← Previous
            </Button>
            <span className="px-3 py-1 bg-theme-secondary rounded flex items-center text-theme-foreground">
              {currentPage}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              variant="outline"
              size="sm"
              className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              Next →
            </Button>
          </div>
        </div>
      </div>

      {/* Mailbox Type Selector */}
      <div className="mb-4 flex gap-2 border-b border-theme-border pb-2">
        <button
          onClick={() => setFilters({ ...filters, mailboxType: 'inbox' })}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
            filters.mailboxType === 'inbox'
              ? 'bg-theme-primary text-theme-primary-foreground'
              : 'bg-theme-secondary text-theme-foreground hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          Inbox
        </button>
        <button
          onClick={() => setFilters({ ...filters, mailboxType: 'sent' })}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
            filters.mailboxType === 'sent'
              ? 'bg-theme-primary text-theme-primary-foreground'
              : 'bg-theme-secondary text-theme-foreground hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Sent
        </button>
        <button
          onClick={() => setFilters({ ...filters, mailboxType: 'drafts' })}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
            filters.mailboxType === 'drafts'
              ? 'bg-theme-primary text-theme-primary-foreground'
              : 'bg-theme-secondary text-theme-foreground hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Drafts
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Email Inbox Filters */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-theme-foreground">Inboxes:</label>
          <button
            onClick={() => {
              if (filters.sources.includes('gmail')) {
                setFilters({ ...filters, sources: filters.sources.filter(s => s !== 'gmail') });
              } else {
                setFilters({ ...filters, sources: [...filters.sources, 'gmail'] });
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
              filters.sources.includes('gmail')
                ? 'bg-theme-primary text-theme-primary-foreground shadow-md'
                : 'bg-theme-secondary text-theme-foreground hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground hover:shadow-md'
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
            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
              filters.sources.includes('outlook')
                ? 'bg-theme-primary text-theme-primary-foreground shadow-md'
                : 'bg-theme-secondary text-theme-foreground hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground hover:shadow-md'
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
          <label className="text-sm font-medium text-theme-foreground">Search:</label>
          <div className="flex gap-1">
            {(['all', 'mail', 'people', 'files'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setFilters({ ...filters, searchCategory: category })}
                className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                  filters.searchCategory === category
                    ? 'bg-theme-primary text-theme-primary-foreground'
                    : 'bg-theme-secondary text-theme-foreground hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground'
                }`}
              >
                {category === 'all' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    All
                  </>
                )}
                {category === 'mail' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Mail
                  </>
                )}
                {category === 'people' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    People
                  </>
                )}
                {category === 'files' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Files
                  </>
                )}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={`Search ${filters.searchCategory}...`}
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="px-3 py-1 border-theme-border border rounded text-sm flex-1 max-w-xs bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-8 text-theme-muted-foreground">
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
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredMessages.map((message) => (
              <div
                key={`${message.source}-${message.id}`}
                className={`p-3 border-theme-border border rounded-lg cursor-pointer transition-all duration-200 hover:bg-theme-hover hover:border-theme-hover hover:shadow-lg ${
                  selectedMessage?.id === message.id && selectedMessage?.source === message.source
                    ? 'bg-theme-accent border-theme-primary shadow-lg'
                    : ''
                } ${
                  message.source === 'outlook' && !message.isRead
                    ? 'border-l-4 border-l-theme-primary'
                    : ''
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate text-theme-foreground">
                        {getMessageSubject(message)}
                      </h4>
                      <span className={`p-1 rounded flex-shrink-0 ${
                        message.source === 'gmail'
                          ? 'bg-theme-primary text-theme-primary-foreground'
                          : 'bg-theme-accent text-theme-accent-foreground'
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
                    <p className="text-theme-muted-foreground text-xs truncate">{getMessageFrom(message)}</p>
                    <p className="text-theme-muted-foreground text-xs">{formatDate(getMessageDate(message))}</p>
                    <p className="text-theme-muted-foreground text-xs mt-1 line-clamp-2">
                      {getMessagePreview(message)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Detail */}
          <div className="border-theme-border border rounded-lg p-4 max-h-[600px] overflow-y-auto bg-theme-background custom-scrollbar">
            {renderMessageDetail()}
          </div>
        </div>
      )}

    </div>
  );
}

