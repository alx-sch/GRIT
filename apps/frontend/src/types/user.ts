import type { ResUserBase } from '@grit/schema';

export type {
  ResUserBase as UserBase,
  ResUserGetAll as UserResponse,
  ResUserEvents,
} from '@grit/schema';

// CurrentUser can be partially loaded (e.g., from auth endpoints) or fully loaded (from /users/me)
// This allows auth flows to work with minimal user data while profile pages use full data
export type CurrentUser = Partial<ResUserBase> & {
  id: number;
  email: string;
  avatarKey?: string | null;
  name?: string | null;
  createdAt?: string;
  isAdmin?: boolean;
};
