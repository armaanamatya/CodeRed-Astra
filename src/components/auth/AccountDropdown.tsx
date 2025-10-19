'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function AccountDropdown({ isOpen, onClose, showToast }: AccountDropdownProps) {
  const { session } = useAuth();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Check connection status when dropdown opens
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      {/* Dropdown */}
      <div 
        ref={dropdownRef}
        className="relative bg-theme-secondary border-2 border-theme-border rounded-lg shadow-lg p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-theme-accent rounded-full transition-colors text-theme-foreground text-lg font-bold"
        >
          ×
        </button>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-theme-foreground">Account Information</h2>
          
          {/* User Info */}
          <div className="space-y-2">
            <p className="text-theme-foreground"><strong>Email:</strong> {session?.user?.email}</p>
            <p className="text-theme-foreground"><strong>Name:</strong> {session?.user?.name}</p>
            <p className="text-theme-foreground"><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
          </div>
          
          {/* Connected Services */}
          <div className="border-t border-theme-border pt-4">
            <h3 className="text-lg font-medium mb-3 text-theme-foreground">Connected Services</h3>
            
            {/* Microsoft Debug Token Info */}
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
            
            <div className="space-y-3">
              {/* Google Connection */}
              <div className="flex items-center justify-between">
                <span className="text-theme-foreground">
                  <strong>Google:</strong> {googleConnected ? '✅ Connected' : '❌ Not connected'}
                </span>
                {googleConnected && (
                  <span className="text-sm text-theme-foreground opacity-70">
                    Calendar & Gmail access enabled
                  </span>
                )}
              </div>
              
              {/* Microsoft Connection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-theme-foreground">
                    <strong>Microsoft:</strong> {microsoftConnected ? '✅ Connected' : '❌ Not connected'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Section */}
          <div className="border-t border-theme-border pt-4">
            <p className="text-theme-foreground"><strong>Session Error:</strong> {session?.error || 'None'}</p>
            <div className="mt-3">
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
    </div>
  );
}