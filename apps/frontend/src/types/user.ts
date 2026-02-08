export interface UserResponse {
  data: UserBase[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface UserBase {
  id: number;
  name: string;
  email: string;
}

export interface CurrentUser {
  id: number;
  email?: string;
  avatarKey?: string;
  name?: string;
}
