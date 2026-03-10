import { FriendButton } from '@/components/ui/friendButton';
import { UserCard } from '@/components/ui/userCard';
import type { FriendshipStatus } from '@/types/friends';
import type { ResUserPublic } from '@grit/schema';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function UserCardWithActions({
  user,
  currentUserId,
  friendshipStatus,
  isLoading,
  onAddFriend,
}: {
  user: ResUserPublic;
  currentUserId?: number;
  friendshipStatus: FriendshipStatus;
  isLoading: boolean;
  onAddFriend: (userId: number) => Promise<void>;
}) {
  const isOwnProfile = currentUserId === user.id;
  const isLoggedIn = !!currentUserId;

  return (
    <UserCard
      user={user}
      actions={
        <div className="flex gap-1">
          {isLoggedIn && !isOwnProfile && (
            <FriendButton
              friendshipStatus={friendshipStatus}
              isLoading={isLoading}
              size="sm"
              acceptHref={`/users/${user.id}`}
              onAddFriend={() => {
                void onAddFriend(user.id);
              }}
            />
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/people/${user.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      }
    />
  );
}
