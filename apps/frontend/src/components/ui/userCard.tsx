import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';

interface UserCardUser {
  id: number;
  name: string;
  avatarKey?: string | null;
  createdAt?: string;
  onlineStatus?: boolean | null | undefined;
}

export const UserCard = ({ user, actions }: { user: UserCardUser; actions?: React.ReactNode }) => {
  const displayName = user.name ?? 'User';

  return (
    <>
      <Card key={user.id} className="hover:-translate-y-1 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4 relative">
          {user.onlineStatus && (
            <div className="bg-green-500 w-1.5 h-1.5 rounded-full absolute top-4 left-3"></div>
          )}
          <UserAvatar user={user} size="md" className="border-2 border-black" />
          <div className="flex flex-1 items-center justify-between min-w-0">
            <div className="overflow-hidden min-w-0">
              <CardTitle className="text-base break-words line-clamp-2">{displayName}</CardTitle>
            </div>
            <div className="flex flex-row gap-2 flex-shrink-0">{actions}</div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
