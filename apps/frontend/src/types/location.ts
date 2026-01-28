import { EventBase } from './event';
import { UserBase } from './user';

export interface Location {
  id: number;
  author: UserBase;
  authorId: number;
  name?: string;
  city?: string;
  country?: string;
  longitude: number;
  latitude: number;
  isPublic: boolean;
  events: EventBase[];
}
