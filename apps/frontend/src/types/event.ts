import { Location } from './location';
import { UserBase } from './user';

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

  author: UserBase;
  authorId: number;

  attending: UserBase[];

  locationId?: number;
  location?: Location;
}
