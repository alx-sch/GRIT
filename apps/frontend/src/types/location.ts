import { EventBase } from './event';
import { UserBase } from './user';

export interface LocationResponse {
  data: LocationBase[];
  pagination: { hasMore: boolean; nextCursor: string | null };
}

export interface LocationBase {
  id: number;
  author: UserBase;
  authorId: number;
  name?: string;
  city?: string;
  country?: string;
  longitude: number;
  latitude: number;
  isPublic: boolean;
  address?: string;
  events: EventBase[];
}
