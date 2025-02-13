export type CalBooking = {
  id: string;
  uid: string;
  type: string;
  title: string;
  description: string;
  additionalNotes: string;
  customInputs: Record<string, any>;
  startTime: string;
  endTime: string;
  organizer: {
    id: number;
    name: string;
    email: string;
    username: string;
    timeZone: string;
    language: {
      locale: string;
    };
    timeFormat: string;
  };
  responses: {
    name: {
      label: string;
      value: string;
    };
    email: {
      label: string;
      value: string;
    };
    notes?: {
      label: string;
      value?: string;
    };
    guests?: {
      label: string;
      value?: string[];
    };
  };
  attendees: Array<{
    email: string;
    name: string;
    timeZone: string;
    language: {
      locale: string;
    };
  }>;
  location: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';
  price: number;
  currency: string;
  metadata?: Record<string, any>;
};

export type CalEventType = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  length: number;
  price: number;
  currency: string;
  hidden: boolean;
  userId: number;
};

export type CalUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  timeZone: string;
  defaultScheduleId: number;
};

export type CalSchedule = {
  id: number;
  userId: number;
  name: string;
  timeZone: string;
  availability: {
    days: number[];
    startTime: string;
    endTime: string;
  }[];
};
