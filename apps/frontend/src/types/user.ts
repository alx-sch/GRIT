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
