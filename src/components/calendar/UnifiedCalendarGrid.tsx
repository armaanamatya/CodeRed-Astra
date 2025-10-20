'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedEvent, CalendarView, CalendarGridProps } from '@/types/calendar';
import { CalendarService } from '@/lib/calendarService';
import { X } from 'lucide-react'; // Add this import at the top

interface UnifiedCalendarGridProps {
  onEventClick: (event: UnifiedEvent) => void;
  onCreateEvent: (date?: Date) => void;
  onDateClick: (date: Date) => void;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

export default function UnifiedCalendarGrid({ 
  onEventClick, 
  onCreateEvent, 
  onDateClick,
  refreshTrigger 
}: UnifiedCalendarGridProps) {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>({ type: 'month', date: new Date() });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState({
    sources: ['google', 'outlook'], // Disabled 'notion' since it's not implemented yet
    searchQuery: ''
  });
  
  // ✅ Add these new state variables
  const [showAllEventsModal, setShowAllEventsModal] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalEvents, setModalEvents] = useState<UnifiedEvent[]>([]);

  const calendarService = CalendarService.getInstance();

  useEffect(() => {
    fetchEvents();
  }, [view, filters, refreshTrigger]); // Added refreshTrigger to dependencies

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      console.log('Fetching events for date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        viewType: view.type
      });

      const allEvents = await calendarService.fetchAllEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      console.log('Fetched events:', allEvents.length, allEvents);

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

      console.log('Filtered events:', filteredEvents.length, filteredEvents);
      console.log('Events by source:', {
        google: filteredEvents.filter(e => e.source === 'google').length,
        outlook: filteredEvents.filter(e => e.source === 'outlook').length,
        notion: filteredEvents.filter(e => e.source === 'notion').length
      });
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
        // For day view, set start date to beginning of the day (00:00:00)
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
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
        // For day view, set end date to end of the day (23:59:59)
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay;
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

  // ✅ Add this helper function to format time nicely
  const formatEventTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  };

  // ✅ Add this function to handle showing all events
  const handleShowAllEvents = (date: Date, events: UnifiedEvent[]) => {
    setModalDate(date);
    setModalEvents(events);
    setShowAllEventsModal(true);
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(view.date);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1 p-2">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-theme-foreground bg-theme-secondary border-theme-border border-b">
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
              className={`min-h-24 p-1 border border-theme-border cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:bg-theme-secondary hover:border-theme-accent hover:z-10 relative ${
                isCurrentDay ? 'bg-theme-accent border-theme-accent' : ''
              } ${!isCurrentMonthDay ? 'bg-theme-muted text-theme-muted-foreground' : 'bg-theme-background text-theme-foreground'}`}
              onClick={() => {
                setSelectedDate(date);
                onDateClick(date);
              }}
            >
              <div className="text-sm font-medium mb-1">
                {date.getDate()}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={`${event.id}-${eventIndex}`}
                    className={`text-xs p-1 rounded truncate cursor-pointer hover:shadow-sm transition-shadow duration-200 ${
                      event.source === 'google' ? 'bg-theme-primary text-theme-primary-foreground' :
                      event.source === 'outlook' ? 'bg-orange-500 text-white' :
                      'bg-purple-500 text-white'
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
                  <div 
                    className="text-xs text-theme-primary hover:text-theme-accent font-medium cursor-pointer hover:underline transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowAllEvents(date, dayEvents);
                    }}
                  >
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
      <div className="grid grid-cols-8 gap-1 p-2">
        {/* Time column */}
        <div className="p-2 text-sm font-semibold text-theme-foreground bg-theme-secondary border-theme-border border-b">
          Time
        </div>
        
        {/* Day headers */}
        {days.map(day => (
          <div key={day.toISOString()} className="p-2 text-center font-semibold text-theme-foreground bg-theme-secondary border-theme-border border-b">
            <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="text-lg">{day.getDate()}</div>
          </div>
        ))}
        
        {/* Time slots */}
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="p-1 text-xs text-theme-muted-foreground border-t border-theme-border bg-theme-background">
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
                  className="min-h-8 border-t border-theme-border p-1 bg-theme-background hover:bg-theme-secondary hover:scale-[1.02] hover:shadow-md hover:z-10 relative transition-all duration-300 ease-in-out"
                >
                  <div className="flex flex-col gap-1">
                    {dayEvents.map((event, eventIndex) => (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className={`text-xs p-1 rounded cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                          event.source === 'google' ? 'bg-theme-primary text-theme-primary-foreground' :
                          event.source === 'outlook' ? 'bg-orange-500 text-white' :
                          'bg-purple-500 text-white'
                        }`}
                        onClick={() => onEventClick(event)}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
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

    // Debug: Log events for the day
    console.log('=== DAY VIEW DEBUG ===');
    console.log('Selected date:', view.date.toDateString());
    console.log('All events:', events);
    console.log('Day events for', view.date.toDateString(), ':', dayEvents);
    console.log('Day events count:', dayEvents.length);
    
    // Debug: Check if events are being filtered correctly
    const allEventsForDay = events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const dayStart = new Date(view.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(view.date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const isInDay = (eventStart <= dayEnd && eventEnd >= dayStart);
      console.log(`Event "${event.title}" (${event.start} - ${event.end}) in day ${view.date.toDateString()}:`, isInDay);
      return isInDay;
    });
    console.log('Manual filter result:', allEventsForDay);
    console.log('=== END DAY VIEW DEBUG ===');

    return (
      <div>
        {/* Date Header */}
        <div className="mb-4 text-center">
          <h4 className="text-lg font-semibold text-theme-foreground">
            {view.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          {/* Debug info */}
          <p className="text-sm text-theme-muted-foreground mt-1">
            {dayEvents.length} events found
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-1 p-2">
          {/* Time column */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="h-12 p-2 text-sm text-theme-muted-foreground border-t border-theme-border bg-theme-background">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
        
          {/* Events column */}
          <div className="space-y-1">
            {hours.map(hour => {
              const hourStart = new Date(view.date);
              hourStart.setHours(hour, 0, 0, 0);
              const hourEnd = new Date(view.date);
              hourEnd.setHours(hour, 59, 59, 999);
              
              const hourEvents = dayEvents.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                
                // Check if event overlaps with this hour
                return (eventStart <= hourEnd && eventEnd >= hourStart);
              });
              
              return (
                <div key={hour} className="h-12 border-t border-theme-border p-1 bg-theme-background hover:bg-theme-secondary transition-colors duration-200">
                  <div className="h-full flex flex-col gap-1 overflow-hidden">
                    {hourEvents.map((event, eventIndex) => {
                      const eventStart = new Date(event.start);
                      const eventEnd = new Date(event.end);
                      const startTime = eventStart.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                      const endTime = eventEnd.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                      
                      return (
                        <div
                          key={`${event.id}-${eventIndex}`}
                          className={`text-xs p-1 rounded cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                            event.source === 'google' ? 'bg-theme-primary text-theme-primary-foreground' :
                            event.source === 'outlook' ? 'bg-orange-500 text-white' :
                            'bg-purple-500 text-white'
                          }`}
                          onClick={() => onEventClick(event)}
                          title={`${event.title} (${startTime} - ${endTime})`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-80">{startTime} - {endTime}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 border border-theme-border rounded-lg bg-theme-background">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-theme-border rounded-lg bg-theme-background">
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
    <div className="p-6 border border-theme-border rounded-lg bg-theme-background">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-theme-foreground">Unified Calendar</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setView({ ...view, type: 'month' })}
              variant={view.type === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-200 ${
                view.type === 'month' 
                  ? 'bg-theme-primary text-theme-primary-foreground shadow-md' 
                  : 'hover:bg-theme-secondary hover:text-theme-foreground hover:scale-105 hover:shadow-sm border-theme-border text-theme-foreground'
              }`}
            >
              Month
            </Button>
            <Button
              onClick={() => setView({ ...view, type: 'week' })}
              variant={view.type === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-200 ${
                view.type === 'week' 
                  ? 'bg-theme-primary text-theme-primary-foreground shadow-md' 
                  : 'hover:bg-theme-secondary hover:text-theme-foreground hover:scale-105 hover:shadow-sm border-theme-border text-theme-foreground'
              }`}
            >
              Week
            </Button>
            <Button
              onClick={() => setView({ ...view, type: 'day' })}
              variant={view.type === 'day' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-200 ${
                view.type === 'day' 
                  ? 'bg-theme-primary text-theme-primary-foreground shadow-md' 
                  : 'hover:bg-theme-secondary hover:text-theme-foreground hover:scale-105 hover:shadow-sm border-theme-border text-theme-foreground'
              }`}
            >
              Day
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigateView('prev')} 
            variant="outline" 
            size="sm"
            className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
          >
            ←
          </Button>
          <Button 
            onClick={goToToday} 
            variant="outline" 
            size="sm"
            className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
          >
            Today
          </Button>
          <Button 
            onClick={() => navigateView('next')} 
            variant="outline" 
            size="sm"
            className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
          >
            →
          </Button>
          <Button 
            onClick={fetchEvents} 
            variant="outline" 
            size="sm"
            className="hover:bg-theme-hover hover:border-theme-hover hover:text-theme-foreground transition-all duration-200 hover:shadow-md"
          >
            Refresh
          </Button>
          <Button 
            onClick={() => onCreateEvent()} 
            size="sm"
            className="bg-theme-primary hover:bg-theme-accent text-theme-primary-foreground hover:text-theme-accent-foreground transition-all duration-200 hover:shadow-lg"
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* Date Display */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold text-theme-foreground">
          {view.date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex gap-2">
          <label className="text-sm font-medium text-theme-foreground">Sources:</label>
          {['google', 'outlook'].map(source => (
            <button
              key={source}
              onClick={() => {
                if (filters.sources.includes(source)) {
                  setFilters({ ...filters, sources: filters.sources.filter(s => s !== source) });
                } else {
                  setFilters({ ...filters, sources: [...filters.sources, source] });
                }
              }}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm ${
                filters.sources.includes(source)
                  ? 'bg-theme-primary text-theme-primary-foreground shadow-md'
                  : 'bg-theme-secondary text-theme-foreground hover:bg-theme-accent border border-theme-border'
              }`}
            >
              {source.charAt(0).toUpperCase() + source.slice(1)}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Search events..."
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          className="px-3 py-1 border border-theme-border rounded text-sm bg-theme-background text-theme-foreground placeholder-theme-muted-foreground"
        />
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden">
        {view.type === 'month' && renderMonthView()}
        {view.type === 'week' && renderWeekView()}
        {view.type === 'day' && renderDayView()}
      </div>

      {/* ✅ Add this modal right after Calendar Grid and before Legend */}
      {showAllEventsModal && modalDate && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAllEventsModal(false)}
        >
          <div 
            className="bg-theme-background border border-theme-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-theme-border bg-theme-secondary">
              <div>
                <h3 className="text-xl font-bold text-theme-foreground">
                  {modalDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <p className="text-sm text-theme-muted-foreground mt-1">
                  {modalEvents.length} {modalEvents.length === 1 ? 'event' : 'events'}
                </p>
              </div>
              <button
                onClick={() => setShowAllEventsModal(false)}
                className="p-2 hover:bg-theme-accent rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-theme-foreground" />
              </button>
            </div>

            {/* Modal Content - Scrollable Events List */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
              <div className="space-y-3">
                {modalEvents.map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      event.source === 'google' 
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/30' 
                        : event.source === 'outlook'
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                        : 'bg-purple-50 dark:bg-purple-950/20 border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-950/30'
                    }`}
                    onClick={() => {
                      setShowAllEventsModal(false);
                      onEventClick(event);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-theme-foreground text-base mb-1 truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-theme-muted-foreground mb-2">
                          <svg 
                            className="h-4 w-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                            />
                          </svg>
                          <span>{formatEventTime(event.start, event.end)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-theme-muted-foreground mb-2">
                            <svg 
                              className="h-4 w-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                              />
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                              />
                            </svg>
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-theme-muted-foreground line-clamp-2 mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        event.source === 'google' 
                          ? 'bg-blue-500 text-white' 
                          : event.source === 'outlook'
                          ? 'bg-orange-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {event.source.charAt(0).toUpperCase() + event.source.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-theme-primary border border-theme-border rounded"></div>
          <span className="text-theme-foreground">Google Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 border border-theme-border rounded"></div>
          <span className="text-theme-foreground">Outlook</span>
        </div>
      </div>
    </div>
  );
}
