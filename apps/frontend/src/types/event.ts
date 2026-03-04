import type { ResEventBase, ResEventFile, ResEventGetPublished } from '@grit/schema';

export type EventBase = Omit<ResEventBase, 'startAt' | 'endAt' | 'createdAt'> & {
  id: number;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export type EventFile = ResEventFile;

export interface EventResponse {
  data: EventBase[];
  pagination: ResEventGetPublished['pagination'];
}
