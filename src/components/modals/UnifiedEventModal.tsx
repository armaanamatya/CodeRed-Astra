'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EventModalProps } from '@/types/calendar';

export default function UnifiedEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  targetSource
}: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    location: '',
    attendees: '',
    source: targetSource || 'google'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          start: initialData.start || '',
          end: initialData.end || '',
          allDay: initialData.allDay || false,
          location: initialData.location || '',
          attendees: initialData.attendees?.join(', ') || '',
          source: targetSource || initialData.source || 'google'
        });
      } else {
        // Reset form for new event
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        setFormData({
          title: '',
          description: '',
          start: startTime.toISOString().slice(0, 16),
          end: endTime.toISOString().slice(0, 16),
          allDay: false,
          location: '',
          attendees: '',
          source: targetSource || 'google'
        });
      }
    }
  }, [isOpen, initialData, targetSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start: formData.allDay ? new Date(formData.start).toISOString().split('T')[0] : new Date(formData.start).toISOString(),
        end: formData.allDay ? new Date(formData.end).toISOString().split('T')[0] : new Date(formData.end).toISOString(),
        allDay: formData.allDay,
        location: formData.location,
        attendees: formData.attendees.split(',').map(email => email.trim()).filter(email => email),
        source: formData.source as 'google' | 'outlook' | 'notion'
      };

      await onSubmit(eventData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Create in:
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="google">Google Calendar</option>
              <option value="outlook">Outlook Calendar</option>
              <option value="notion">Notion Database</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event description"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => handleInputChange('allDay', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
              All day event
            </label>
          </div>

          {/* Start Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start {formData.allDay ? 'Date' : 'Date & Time'} *
            </label>
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={formData.allDay ? formData.start.split('T')[0] : formData.start}
              onChange={(e) => handleInputChange('start', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End {formData.allDay ? 'Date' : 'Date & Time'} *
            </label>
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={formData.allDay ? formData.end.split('T')[0] : formData.end}
              onChange={(e) => handleInputChange('end', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event location"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendees
            </label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => handleInputChange('attendees', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

          {/* Source-specific info */}
          {formData.source === 'notion' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-700">
                <strong>Notion:</strong> Event will be created in your connected Notion database.
              </p>
            </div>
          )}

          {formData.source === 'outlook' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">
                <strong>Outlook:</strong> Event will be created in your Outlook calendar.
              </p>
            </div>
          )}

          {formData.source === 'google' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Google Calendar:</strong> Event will be created in your Google Calendar.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.start || !formData.end}
              className="flex-1"
            >
              {loading ? 'Creating...' : initialData ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
