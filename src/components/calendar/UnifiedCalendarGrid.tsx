'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedEvent, CalendarView, CalendarGridProps } from '@/types/calendar';
import { CalendarService } from '@/lib/calendarService';

interface UnifiedCalendarGridProps {
  onEventClick: (event: UnifiedEvent) => void;
  onCreateEvent: (date?: Date) => void;
  onDateClick: (date: Date) => void;
}

export default function UnifiedCalendarGrid({ 
  onEventClick, 
  onCreateEvent, 
  onDateClick 
}: UnifiedCalendarGridProps) {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>({ type: 'month', date: new Date() });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState({
    sources: ['google', 'outlook', 'notion'],
    searchQuery: ''
  });

  const calendarService = CalendarService.getInstance();

  useEffect(() => {
    fetchEvents();
  }, [view, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const allEvents = await calendarService.fetchAllEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Preserve test events (events with id starting with 'test-')
      const testEvents = events.filter(event => event.id.startsWith('test-'));

      // Combine API events with test events
      const combinedEvents = [...allEvents, ...testEvents];

      // Apply filters
      let filteredEvents = combinedEvents.filter(event => 
        filters.sources.includes(event.source)
      );

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
        );
      }

      setEvents(filteredEvents);
    } catch (err) {
      console.error('UnifiedCalendarGrid: Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = (): Date => {
    const date = new Date(view.date);
    switch (view.type) {
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1);
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek;
      case 'day':
        return new Date(date);
      default:
        return date;
    }
  };

  const getViewEndDate = (): Date => {
    const date = new Date(view.date);
    switch (view.type) {
      case 'month':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      case 'week':
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + (6 - date.getDay()));
        return endOfWeek;
      case 'day':
        return new Date(date);
      default:
        return date;
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date): UnifiedEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return (eventStart <= dayEnd && eventEnd >= dayStart);
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === view.date.getMonth();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const navigateView = (direction: 'prev' | 'next') => {
    const newDate = new Date(view.date);
    switch (view.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    setView({ ...view, date: newDate });
  };

  const goToToday = () => {
    setView({ ...view, date: new Date() });
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(view.date);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          
          return (
            <div
              key={index}
              className={`min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                isCurrentDay ? 'bg-blue-100 border-blue-300' : ''
              } ${!isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : ''}`}
              onClick={() => {
                setSelectedDate(date);
                onDateClick(date);
              }}
            >
              <div className="text-sm font-medium mb-1">
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`text-xs p-1 rounded truncate cursor-pointer ${
                      event.source === 'google' ? 'bg-blue-100 text-blue-800' :
                      event.source === 'outlook' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(view.date);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="grid grid-cols-8 gap-1">
        {/* Time column */}
        <div className="p-2 text-sm font-semibold text-gray-600 bg-gray-50">
          Time
        </div>
        
        {/* Day headers */}
        {days.map(day => (
          <div key={day.toISOString()} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
            <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="text-lg">{day.getDate()}</div>
          </div>
        ))}
        
        {/* Time slots */}
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="p-1 text-xs text-gray-500 border-t border-gray-200">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {days.map(day => {
              const dayEvents = getEventsForDate(day).filter(event => {
                const eventStart = new Date(event.start);
                return eventStart.getHours() === hour;
              });
              
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-8 border-t border-gray-200 p-1"
                >
                  {dayEvents.map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`text-xs p-1 rounded cursor-pointer ${
                        event.source === 'google' ? 'bg-blue-100 text-blue-800' :
                        event.source === 'outlook' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}
                      onClick={() => onEventClick(event)}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(view.date);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="grid grid-cols-2 gap-1">
        {/* Time column */}
        <div className="space-y-1">
          {hours.map(hour => (
            <div key={hour} className="h-12 p-2 text-sm text-gray-500 border-t border-gray-200">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>
        
        {/* Events column */}
        <div className="space-y-1">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventStart = new Date(event.start);
              return eventStart.getHours() === hour;
            });
            
            return (
              <div key={hour} className="h-12 border-t border-gray-200 p-1">
                {hourEvents.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`text-xs p-1 rounded cursor-pointer ${
                      event.source === 'google' ? 'bg-blue-100 text-blue-800' :
                      event.source === 'outlook' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}
                    onClick={() => onEventClick(event)}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchEvents} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Unified Calendar</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setView({ ...view, type: 'month' })}
              variant={view.type === 'month' ? 'default' : 'outline'}
              size="sm"
            >
              Month
            </Button>
            <Button
              onClick={() => setView({ ...view, type: 'week' })}
              variant={view.type === 'week' ? 'default' : 'outline'}
              size="sm"
            >
              Week
            </Button>
            <Button
              onClick={() => setView({ ...view, type: 'day' })}
              variant={view.type === 'day' ? 'default' : 'outline'}
              size="sm"
            >
              Day
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => navigateView('prev')} variant="outline" size="sm">
            ←
          </Button>
          <Button onClick={goToToday} variant="outline" size="sm">
            Today
          </Button>
          <Button onClick={() => navigateView('next')} variant="outline" size="sm">
            →
          </Button>
          <Button onClick={fetchEvents} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={() => onCreateEvent()} size="sm">
            Create Event
          </Button>
        </div>
      </div>

      {/* Date Display */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold">
          {view.date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex gap-2">
          <label className="text-sm font-medium">Sources:</label>
          {['google', 'outlook', 'notion'].map(source => (
            <label key={source} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.sources.includes(source)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters({ ...filters, sources: [...filters.sources, source] });
                  } else {
                    setFilters({ ...filters, sources: filters.sources.filter(s => s !== source) });
                  }
                }}
              />
              <span className="text-sm capitalize">{source}</span>
            </label>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Search events..."
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          className="px-3 py-1 border rounded text-sm"
        />
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        {view.type === 'month' && renderMonthView()}
        {view.type === 'week' && renderWeekView()}
        {view.type === 'day' && renderDayView()}
      </div>


      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Google Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
          <span>Outlook</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
          <span>Notion</span>
        </div>
      </div>
    </div>
  );
}
