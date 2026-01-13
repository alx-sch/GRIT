import { User } from './user';

export interface Event {
  id: number;
  authorId: number;
  author: User;
  content: string | null;
  createdAt: string;
  endAt: string | null;
  isPublished: boolean;
  isPublic: boolean;
  startAt: string;
  title: string;
  interestedFriends?: User[]; // only available if logged in
  imageURL?: string; // to add in event schema
  interestedCount?: number; // to add in event schema
  location?: string | null;
}
