export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  source: 'google' | 'outlook' | 'notion';
  sourceId: string;
  url?: string;
  color?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface UnifiedEvent extends CalendarEvent {
  // Additional unified properties
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}

export interface CalendarFilters {
  sources: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface CalendarGridProps {
  events: UnifiedEvent[];
  view: CalendarView;
  onEventClick: (event: UnifiedEvent) => void;
  onDateClick: (date: Date) => void;
  onCreateEvent: (date?: Date) => void;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: Partial<UnifiedEvent>) => void;
  initialData?: Partial<UnifiedEvent>;
  targetSource?: 'google' | 'outlook' | 'notion';
}
