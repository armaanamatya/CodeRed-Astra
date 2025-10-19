'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Subscription {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  max_voice_add_edits: number;
  voice_add_edit_counter: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  currency: string;
  status: string;
}

export function SubscriptionInfo() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/elevenlabs/subscription');
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Failed to fetch subscription info');
      }
    } catch (err) {
      setError('Network error fetching subscription info');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button 
            onClick={fetchSubscriptionInfo} 
            variant="outline" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-500">No subscription information available</p>
      </div>
    );
  }

  const usagePercentage = subscription.character_count && subscription.character_limit 
    ? Math.round((subscription.character_count / subscription.character_limit) * 100) 
    : 0;
  const resetDate = subscription.next_character_count_reset_unix 
    ? new Date(subscription.next_character_count_reset_unix * 1000)
    : new Date();

  return (
    <div className="max-w-md mx-auto p-6">
      <h3 className="text-lg font-semibold mb-4">ElevenLabs Subscription</h3>
      
      <div className="space-y-4">
        {/* Plan Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800">Plan: {subscription.tier}</h4>
          <p className="text-sm text-blue-600">Status: {subscription.status}</p>
        </div>

        {/* Character Usage */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">Character Usage</h4>
          <div className="flex justify-between text-sm mb-1">
            <span>{subscription.character_count?.toLocaleString() || '0'} used</span>
            <span>{subscription.character_limit?.toLocaleString() || 'N/A'} limit</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                usagePercentage > 90 ? 'bg-red-500' : 
                usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Resets on {resetDate.toLocaleDateString()}
          </p>
        </div>

        {/* Voice Limits */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">Voice Limits</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Voice Limit:</span>
              <span>{subscription.voice_limit || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Professional Voices:</span>
              <span>{subscription.professional_voice_limit || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Voice Edits:</span>
              <span>{subscription.voice_add_edit_counter || 0}/{subscription.max_voice_add_edits || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">Features</h4>
          <div className="text-sm space-y-1">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${
                subscription.can_use_instant_voice_cloning ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span>Instant Voice Cloning</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${
                subscription.can_use_professional_voice_cloning ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span>Professional Voice Cloning</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${
                subscription.can_extend_character_limit ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span>Can Extend Character Limit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}