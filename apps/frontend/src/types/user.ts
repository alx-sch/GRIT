export type { ResUserBase as UserBase, ResUserGetAll as UserResponse } from '@grit/schema';

export interface CurrentUser {
  id: number;
  email?: string;
  avatarKey?: string;
  name?: string;
}
