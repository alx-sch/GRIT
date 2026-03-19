import { UserAvatar } from '@/components/ui/user-avatar';
import { Text, Heading } from '@/components/ui/typography';
import type { FriendshipStatus } from '@/types/friends';
import type { ResUserPublic } from '@grit/schema';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { FriendButton } from '@/components/ui/friendButton';

interface ProfileHeaderProps {
  user: ResUserPublic;
  friendshipStatus?: FriendshipStatus;
  isLoading?: boolean;
  showFriendButton?: boolean;
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  onAcceptRequest?: () => void;
  onCancelRequest?: () => void;
}

export function ProfileHeader({
  user,
  friendshipStatus,
  isLoading = false,
  showFriendButton = false,
  onAddFriend,
  onRemoveFriend,
  onAcceptRequest,
  onCancelRequest,
}: ProfileHeaderProps) {
  const memberSince = format(new Date(user.createdAt), 'MMMM yyyy');

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <UserAvatar user={user} size="xl" alt={user.name} className="shrink-0" />

      <div className="flex-1 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <Heading level={2}>{user.displayName ?? user.name}</Heading>

          {showFriendButton && friendshipStatus && onAddFriend && (
            <FriendButton
              friendshipStatus={friendshipStatus}
              isLoading={isLoading}
              onAddFriend={onAddFriend}
              onRemoveFriend={onRemoveFriend}
              onAcceptRequest={onAcceptRequest}
              onCancelRequest={onCancelRequest}
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          {(user.city ?? user.country) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <Text>{[user.city, user.country].filter(Boolean).join(', ')}</Text>
            </div>
          )}
          <Text className="text-muted-foreground">Member since {memberSince}</Text>
        </div>
      </div>
    </div>
  );
}
