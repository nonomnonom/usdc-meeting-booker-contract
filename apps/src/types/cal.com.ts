export type CalBooking = {
  id: string;
  uid: string;
  userId: number;
  eventTypeId: number;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';
  title: string;
  description?: string;
  responses: {
    email: string;
    name: string;
    notes?: string;
  };
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
