export interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  name: string;
  avatarKey?: string | null;
  isConfirmed?: boolean;
}
