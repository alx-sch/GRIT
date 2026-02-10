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
  password: string;
  avatarKey?: string;
  events: Event[];
  attending: Event[];
  location: Location[];
  isConfirmed: boolean;
}

export interface CurrentUser {
  id: number;
  email?: string;
  avatarKey?: string;
  name?: string;
}
