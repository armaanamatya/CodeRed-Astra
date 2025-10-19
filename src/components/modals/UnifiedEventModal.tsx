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

  // Helper function to format date for input fields
  const formatDateForInput = (dateString: string, isAllDay: boolean) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isAllDay) {
        // For all-day events, return just the date part
        return date.toISOString().split('T')[0];
      } else {
        // For timed events, return datetime-local format
        return date.toISOString().slice(0, 16);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode - populate form with existing event data
        const isAllDay = initialData.allDay || false;
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          start: formatDateForInput(initialData.start || '', isAllDay),
          end: formatDateForInput(initialData.end || '', isAllDay),
          allDay: isAllDay,
          location: initialData.location || '',
          attendees: initialData.attendees?.join(', ') || '',
          source: targetSource || initialData.source || 'google'
        });
      } else {
        // Create mode - reset form for new event
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
      // Clear any previous errors
      setError(null);
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
        source: formData.source as 'google' | 'outlook' // | 'notion'
      };

      await onSubmit(eventData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: Record<string, unknown>) => {
    if (field === 'allDay') {
      // When toggling all-day, reformat the start and end dates
      setFormData(prev => {
        const newAllDay = value;
        return {
          ...prev,
          allDay: newAllDay,
          start: formatDateForInput(prev.start, newAllDay),
          end: formatDateForInput(prev.end, newAllDay)
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] pt-20">
      <div className="bg-theme-background border-theme-border border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4 pt-2">
          <h2 className="text-xl font-semibold text-theme-foreground">
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-theme-muted-foreground hover:text-theme-foreground transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              Create in:
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
            >
              <option value="google">Google Calendar</option>
              <option value="outlook">Outlook Calendar</option>
              {/* <option value="notion">Notion Database</option> */}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="Event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200 resize-none"
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
              className="rounded border-theme-border text-theme-primary focus:ring-theme-primary"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-theme-foreground">
              All day event
            </label>
          </div>

          {/* Start Date/Time */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              Start {formData.allDay ? 'Date' : 'Date & Time'} *
            </label>
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={formData.start}
              onChange={(e) => handleInputChange('start', e.target.value)}
              required
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* End Date/Time */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              End {formData.allDay ? 'Date' : 'Date & Time'} *
            </label>
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={formData.end}
              onChange={(e) => handleInputChange('end', e.target.value)}
              required
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="Event location"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-1">
              Attendees
            </label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => handleInputChange('attendees', e.target.value)}
              className="w-full px-3 py-2 border-theme-border border rounded-md bg-theme-background text-theme-foreground placeholder-theme-muted-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="text-xs text-theme-muted-foreground mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

          {/* Source-specific info */}
          {/* {formData.source === 'notion' && (
            <div className="bg-theme-secondary border border-theme-border rounded-lg p-2">
              <p className="text-xs text-theme-foreground">
                <strong>Notion:</strong> Event will be created in your connected Notion database.
              </p>
            </div>
          )} */}

          {formData.source === 'outlook' && (
            <div className="bg-theme-secondary border border-theme-border rounded-lg p-2">
              <p className="text-xs text-theme-foreground">
                <strong>Outlook:</strong> Event will be created in your Outlook calendar.
              </p>
            </div>
          )}

          {formData.source === 'google' && (
            <div className="bg-theme-secondary border border-theme-border rounded-lg p-2">
              <p className="text-xs text-theme-foreground">
                <strong>Google Calendar:</strong> Event will be created in your Google Calendar.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.start || !formData.end}
              className="flex-1 bg-theme-primary hover:bg-theme-accent text-theme-primary-foreground hover:text-theme-accent-foreground transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : initialData ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
