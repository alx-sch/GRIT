export interface LoginRes {
  accessToken: string;
  user: {
    avatarKey: string;
    id: number;
    name: string;
  };
}
