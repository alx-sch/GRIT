import { Location } from './location';
import { User } from './user';

export interface EventResponse {
  data: EventBase[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface EventBase {
  id: number;
  createdAt: number;
  content?: string;
  endAt: string;
  isPublic: boolean;
  isPublished: boolean;
  startAt: string;
  title: string;
  imageKey: string;

  author: User;
  authorId: number;

  attending: User[];

  locationId?: number;
  location?: Location;
}
