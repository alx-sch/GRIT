import type { ResEventBase, ResEventGetPublished } from '@grit/schema';

export type EventBase = Omit<ResEventBase, 'startAt' | 'endAt' | 'createdAt'> & {
  id: number;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export interface EventResponse {
  data: EventBase[];
  pagination: ResEventGetPublished['pagination'];
}
