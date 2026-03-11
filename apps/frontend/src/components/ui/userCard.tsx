import { UserAvatar } from '@/components/ui/user-avatar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface UserCardUser {
  id: number;
  name: string;
  avatarKey?: string | null;
  createdAt?: string;
}

export const UserCard = ({ user, actions }: { user: UserCardUser; actions?: React.ReactNode }) => {
  const displayName = user.name ?? 'User';

  return (
    <>
      <Card key={user.id} className="hover:-translate-y-1 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
          <UserAvatar user={user} size="md" className="border-2 border-black" />
          <div className="flex flex-1 items-center justify-between">
            <div className="overflow-hidden">
              <CardTitle className="text-base truncate">{displayName}</CardTitle>
            </div>
            <div className="flex flex-row gap-2 flex-shrink-0">{actions}</div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
