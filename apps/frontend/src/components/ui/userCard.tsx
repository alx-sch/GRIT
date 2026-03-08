import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { ResFriendUser } from '@grit/schema';

export const UserCard = ({ user, actions }: { user: ResFriendUser; actions?: React.ReactNode }) => {
  const displayName = user.name ?? 'User';
  const onlineStatus = user.onlineStatus;

  return (
    <>
      <Card key={user.id} className="hover:-translate-y-1 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4 relative">
          {onlineStatus ? (
            <div className="bg-green-500 w-1.5 h-1.5 rounded-full absolute top-4 left-3"></div>
          ) : (
            <div className="bg-gray-700 w-1.5 h-1.5 rounded-full absolute top-4 left-3"></div>
          )}
          <Avatar className="h-12 w-12 border-2 border-black relative">
            <AvatarImage src={getAvatarImageUrl(user.avatarKey ?? undefined)} />
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
