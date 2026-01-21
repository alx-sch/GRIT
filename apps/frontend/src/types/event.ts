import {Location} from './location';
import {User} from './user';

export interface Event {
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
}
