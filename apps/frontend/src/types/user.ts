export type {
  ResUserBase as UserBase,
  ResUserGetAll as UserResponse,
  ResUserEvents,
} from '@grit/schema';

export interface CurrentUser {
  id: number;
  email: string;
  avatarKey?: string | null;
  name?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt?: string;
}
