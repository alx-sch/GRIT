import { BackButton } from '@/components/ui/backButton';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { FriendshipStatus } from '@/types/friends';
import type { ResUserPublicEventsPaginated } from '@grit/schema';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Link, LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { PrivateProfileView } from './components/PrivateProfileView';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs } from './components/ProfileTabs';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

const fetchAllRequests = async <T,>(
  serviceFn: (params: { limit: string; cursor?: string }) => Promise<PaginatedResponse<T>>,
  accumulated: T[] = [],
  cursor?: string
): Promise<T[]> => {
  const response = await serviceFn({ limit: '100', cursor });
  const all = [...accumulated, ...response.data];

  if (response.pagination.hasMore && response.pagination.nextCursor) {
    return fetchAllRequests(serviceFn, all, response.pagination.nextCursor);
  }
  return all;
};

export const publicProfileLoader = async ({ params }: LoaderFunctionArgs) => {
  const username = params.username ?? '';
  if (!username) {
    throw new Response('User not found', { status: 404 });
  }

  const user = await userService.getUserByName(username);

  const token = useAuthStore.getState().token;
  const currentUserId = useCurrentUserStore.getState().user?.id;

  // Only fetch friendship status if user is logged in
  let friendshipStatus: FriendshipStatus = 'none';
  let friendRequestId: string | null = null;
  if (token) {
    try {
      const status = await userService.getFriendshipStatus(user.id);
      friendshipStatus = status;

      // If there's a pending received request, fetch the request details to get the ID
      if (status === 'pending_received') {
        const incomingRequests = await fetchAllRequests(friendService.listIncomingRequests);
        const request = incomingRequests.find((req) => req.requesterId === user.id);
        if (request) {
          friendRequestId = request.id;
        }
      }

      // If there's a pending sent request, fetch the request details to get the ID
      if (status === 'pending_sent') {
        const outgoingRequests = await fetchAllRequests(friendService.listOutgoingRequests);
        const request = outgoingRequests.find((req) => req.receiverId === user.id);
        if (request) {
          friendRequestId = request.id;
        }
      }
    } catch {
      // Network error or other issue - log but don't block page load
      friendshipStatus = 'none';
    }
  }

  const canSeeHostedEvents =
    user.isProfilePublic !== false ||
    (currentUserId !== undefined && currentUserId === user.id) ||
    friendshipStatus === 'friends' ||
    friendshipStatus === 'self';

  let eventPage: ResUserPublicEventsPaginated = {
    data: [],
    pagination: { hasMore: false, nextCursor: null },
  };
  if (canSeeHostedEvents) {
    eventPage = await userService.getUserEventsByName({ username });
  }

  return { user, eventPage, friendshipStatus, friendRequestId };
};

export default function PublicProfilePage() {
  const data = useLoaderData<typeof publicProfileLoader>();
  const currentUser = useCurrentUserStore((s) => s.user);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>(data.friendshipStatus);
  const [friendRequestId, setFriendRequestId] = useState<string | null>(data.friendRequestId);
  const [isLoading, setIsLoading] = useState(false);

  const isViewingSelf = currentUser?.id === data.user.id;
  const isLoggedIn = !!currentUser;
  const canViewPrivateProfileAsViewer =
    isViewingSelf || friendshipStatus === 'friends' || friendshipStatus === 'self';
  const showPrivateProfileGate =
    data.user.isProfilePublic === false && !canViewPrivateProfileAsViewer;

  const handleFriendAction = async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      if (friendshipStatus === 'none') {
        const response = await friendService.sendRequest(data.user.id);
        setFriendshipStatus('pending_sent');
        setFriendRequestId(response.id);
        toast.success('Friend request sent');
      }
    } catch {
      toast.error('Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      await friendService.removeFriend(data.user.id);
      setFriendshipStatus('none');
      toast.success('Friend removed');
    } catch {
      toast.error('Failed to remove friend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!isLoggedIn || !friendRequestId) return;

    setIsLoading(true);
    try {
      await friendService.acceptRequest(friendRequestId);
      setFriendshipStatus('friends');
      setFriendRequestId(null);
      toast.success('Friend request accepted');
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      toast.error('Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!isLoggedIn || !friendRequestId) return;

    setIsLoading(true);
    try {
      await friendService.cancelRequest(friendRequestId);
      setFriendshipStatus('none');
      setFriendRequestId(null);
      toast.info('Friend request canceled');
    } catch (error) {
      console.error('Failed to cancel friend request:', error);
      toast.error('Failed to cancel friend request');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPrivateProfileGate) {
    return (
      <PrivateProfileView
        user={data.user}
        friendshipStatus={friendshipStatus}
        isLoading={isLoading}
        isLoggedIn={isLoggedIn}
        onAddFriend={() => {
          void handleFriendAction();
        }}
        onRemoveFriend={() => {
          void handleRemoveFriend();
        }}
        onAcceptRequest={() => {
          void handleAcceptRequest();
        }}
        onCancelRequest={() => {
          void handleCancelRequest();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <BackButton />
      {isViewingSelf && data.user.isProfilePublic === false && (
        <div
          className="flex gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
          role="status"
        >
          <Lock className="size-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
          <div className="space-y-1.5 min-w-0">
            <p className="font-semibold text-foreground">Your profile is private</p>
            <p className="text-muted-foreground leading-relaxed">
              Only friends can see your bio, location and hosted public events.
            </p>
            <Link
              to="/profile#settings"
              className="font-medium text-primary underline-offset-4 hover:underline inline-block"
            >
              Change in profile settings
            </Link>
          </div>
        </div>
      )}
      <ProfileHeader
        user={data.user}
        friendshipStatus={friendshipStatus}
        isLoading={isLoading}
        showFriendButton={isLoggedIn && !isViewingSelf}
        onAddFriend={() => {
          void handleFriendAction();
        }}
        onRemoveFriend={() => {
          void handleRemoveFriend();
        }}
        onAcceptRequest={() => {
          void handleAcceptRequest();
        }}
        onCancelRequest={() => {
          void handleCancelRequest();
        }}
      />
      <ProfileTabs
        user={data.user}
        username={data.user.name}
        initialEvents={data.eventPage.data}
        initialPagination={data.eventPage.pagination}
      />
    </div>
  );
}
