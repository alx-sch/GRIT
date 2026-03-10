import { Text, Heading } from '@/components/ui/typography';
import { getAvatarImageUrl } from '@/lib/image_utils';
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
}

export function ProfileHeader({
  user,
  friendshipStatus,
  isLoading = false,
  showFriendButton = false,
  onAddFriend,
}: ProfileHeaderProps) {
  const avatarUrl = user.avatarKey ? getAvatarImageUrl(user.avatarKey) : undefined;
  const memberSince = format(new Date(user.createdAt), 'MMMM yyyy');

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-muted shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Text className="text-4xl font-semibold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <Heading level={2}>{user.name}</Heading>

          {showFriendButton && friendshipStatus && onAddFriend && (
            <FriendButton
              friendshipStatus={friendshipStatus}
              isLoading={isLoading}
              onAddFriend={onAddFriend}
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
