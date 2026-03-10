import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvatarImageUrl } from '@/lib/image_utils';

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
          <Avatar className="h-12 w-12 border-2 border-black">
            <AvatarImage
              src={user?.avatarKey ? getAvatarImageUrl(user.avatarKey) : undefined}
              seed={user?.id?.toString() ?? 'user'}
            />
            <AvatarFallback name={displayName} />
          </Avatar>
          <div className="flex flex-1 items-center justify-between">
            <div className="overflow-hidden">
              <CardTitle className="text-base truncate">{displayName}</CardTitle>
            </div>
            <div className="flex flex-row gap-2">{actions}</div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
