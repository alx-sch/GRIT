import { Event } from './event';
import { User } from './user';

export interface Location {
  id: number;
  author: User;
  authorId: number;
  name?: string;
  city?: string;
  country?: string;
  longitude: number;
  latitude: number;
  isPublic: boolean;
  events: Event[];
}
