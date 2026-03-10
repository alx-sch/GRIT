import { BackButton } from '@/components/ui/backButton';
import { Heading, Text } from '@/components/ui/typography';
import type { FriendshipStatus } from '@/types/friends';
import type { ResUserPublic } from '@grit/schema';
import { Lock } from 'lucide-react';
import { ProfileHeader } from './ProfileHeader';

interface PrivateProfileViewProps {
  user: ResUserPublic;
  friendshipStatus: FriendshipStatus;
  isLoading: boolean;
  isLoggedIn: boolean;
  onAddFriend: () => void;
}

export function PrivateProfileView({
  user,
  friendshipStatus,
  isLoading,
  isLoggedIn,
  onAddFriend,
}: PrivateProfileViewProps) {
  return (
    <div className="space-y-8">
      <BackButton />
      <ProfileHeader
        user={user}
        friendshipStatus={friendshipStatus}
        isLoading={isLoading}
        showFriendButton={isLoggedIn}
        onAddFriend={onAddFriend}
      />
      <div className="bg-card rounded-lg border p-8 text-center space-y-4">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
        <Heading level={3}>This profile is private</Heading>
        <Text className="text-muted-foreground">
          {isLoggedIn
            ? 'Send a friend request to see their full profile and events.'
            : 'Log in to send a friend request and see their full profile.'}
        </Text>
      </div>
    </div>
  );
}
