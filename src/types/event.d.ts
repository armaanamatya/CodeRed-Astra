export interface EventData {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface OutlookEventData {
  subject: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
}

export interface OutlookEmailData {
  to: string;
  subject: string;
  body: string;
}
