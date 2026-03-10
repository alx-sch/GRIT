import { BackButton } from '@/components/ui/backButton';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { FriendshipStatus } from '@/types/friends';
import type { ResUserPublicEvents } from '@grit/schema';
import { useState } from 'react';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { PrivateProfileView } from './components/PrivateProfileView';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs } from './components/ProfileTabs';

export const publicProfileLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = parseInt(params.id ?? '', 10);
  if (isNaN(id)) {
    throw new Response('User not found', { status: 404 });
  }

  const user = await userService.getUserById(id);

  // Only fetch events if profile is public (or the field is not set, for backwards compatibility)
  let events: ResUserPublicEvents = [];
  if (user.isProfilePublic !== false) {
    events = await userService.getUserEvents(id);
  }

  // Only fetch friendship status if user is logged in
  let friendshipStatus: FriendshipStatus = 'none';
  const token = useAuthStore.getState().token;
  if (token) {
    try {
      const status = await userService.getFriendshipStatus(id);
      friendshipStatus = status;
    } catch (error) {
      // Network error or other issue - log but don't block page load
      console.error('Failed to fetch friendship status:', error);
      friendshipStatus = 'none';
    }
  }

  return { user, events, friendshipStatus };
};

export default function PublicProfilePage() {
  const data = useLoaderData<typeof publicProfileLoader>();
  const currentUser = useCurrentUserStore((s) => s.user);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>(data.friendshipStatus);
  const [isLoading, setIsLoading] = useState(false);

  const isViewingSelf = currentUser?.id === data.user.id;
  const isLoggedIn = !!currentUser;
  const isPrivateProfile = data.user.isProfilePublic === false;

  const handleFriendAction = async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      if (friendshipStatus === 'none') {
        await friendService.sendRequest(data.user.id);
        setFriendshipStatus('pending_sent');
        toast.success('Friend request sent');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPrivateProfile && !isViewingSelf) {
    return (
      <PrivateProfileView
        user={data.user}
        friendshipStatus={friendshipStatus}
        isLoading={isLoading}
        isLoggedIn={isLoggedIn}
        onAddFriend={() => {
          void handleFriendAction();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <BackButton />
      <ProfileHeader
        user={data.user}
        friendshipStatus={friendshipStatus}
        isLoading={isLoading}
        showFriendButton={isLoggedIn && !isViewingSelf}
        onAddFriend={() => {
          void handleFriendAction();
        }}
      />
      <ProfileTabs user={data.user} events={data.events} />
    </div>
  );
}
