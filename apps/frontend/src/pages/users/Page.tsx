import { EmptyState } from '@/components/ui/emptyState';
import { Input } from '@/components/ui/input';
import { Heading } from '@/components/ui/typography';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { FriendshipStatus } from '@/types/friends';
import type { UserResponse } from '@/types/user';
import { useCallback, useEffect, useState } from 'react';
import { LoaderFunctionArgs, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UserCardWithActions } from './components/UserCardWithActions';
import { useDebounce } from '@/hooks/useDebounce';

interface UsersLoaderData {
  users: UserResponse;
  friendshipStatuses: Record<number, FriendshipStatus>;
  requestIds: Record<number, string>;
}

export const usersLoader = async ({ request }: LoaderFunctionArgs): Promise<UsersLoaderData> => {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const search = url.searchParams.get('search') ?? undefined;
  const users = await userService.getUsers({ limit, cursor, search });
  const token = useAuthStore.getState().token;

  const friendshipStatuses: Record<number, FriendshipStatus> = {};
  const requestIds: Record<number, string> = {};
  if (token) {
    try {
      const [friends, outgoing, incoming] = await Promise.all([
        friendService.listFriends(),
        friendService.listOutgoingRequests(),
        friendService.listIncomingRequests(),
      ]);

      for (const friend of friends.data) {
        friendshipStatuses[friend.friendId] = 'friends';
      }
      for (const request of outgoing.data) {
        friendshipStatuses[request.receiverId] = 'pending_sent';
        requestIds[request.receiverId] = request.id;
      }
      for (const request of incoming.data) {
        friendshipStatuses[request.requesterId] = 'pending_received';
        requestIds[request.requesterId] = request.id;
      }
    } catch {
      // Not logged in or error fetching - leave statuses empty
    }
  }

  return { users, friendshipStatuses, requestIds };
};

export default function Users() {
  const {
    users: initialUsers,
    friendshipStatuses: initialStatuses,
    requestIds: initialRequestIds,
  } = useTypedLoaderData<UsersLoaderData>();
  const currentUser = useCurrentUserStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [users, setUsers] = useState(initialUsers);
  const [friendshipStatuses, setFriendshipStatuses] =
    useState<Record<number, FriendshipStatus>>(initialStatuses);
  const [requestIds, setRequestIds] = useState<Record<number, string>>(initialRequestIds);
  const [loadingUsers, setLoadingUsers] = useState<Record<number, boolean>>({});
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch users from backend when search term changes
  const fetchUsers = useCallback(
    async (search: string) => {
      setIsSearching(true);
      try {
        const result = await userService.getUsers({ search: search || undefined });
        setUsers(result);

        // Update URL with search param
        const newSearchParams = new URLSearchParams(searchParams);
        if (search) {
          newSearchParams.set('search', search);
        } else {
          newSearchParams.delete('search');
        }
        void navigate(`?${newSearchParams.toString()}`, { replace: true });
      } catch {
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    },
    [navigate, searchParams]
  );

  useEffect(() => {
    void fetchUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchUsers]);

  const handleAddFriend = async (userId: number) => {
    setLoadingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await friendService.sendRequest(userId);
      setFriendshipStatuses((prev) => ({ ...prev, [userId]: 'pending_sent' }));
      setRequestIds((prev) => ({ ...prev, [userId]: response.id }));
      toast.success('Friend request sent');
    } catch {
      toast.error('Failed to send friend request');
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleCancelRequest = async (userId: number) => {
    const requestId = requestIds[userId];
    if (!requestId) return;

    setLoadingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      await friendService.cancelRequest(requestId);
      setFriendshipStatuses((prev) => ({ ...prev, [userId]: 'none' }));
      toast.info('Friend request canceled');
    } catch {
      toast.error('Failed to cancel friend request');
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <Heading level={1}>Users</Heading>

      <div className="flex flex-col gap-6">
        <Input
          placeholder="Search users..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          clearable
          onClear={() => {
            setSearchTerm('');
          }}
        />

        {isSearching ? (
          <div className="text-center py-8 text-muted-foreground">Searching...</div>
        ) : users.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.data.map((user) => (
              <UserCardWithActions
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                friendshipStatus={friendshipStatuses[user.id] ?? 'none'}
                isLoading={loadingUsers[user.id] ?? false}
                onAddFriend={handleAddFriend}
                onCancelRequest={handleCancelRequest}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No users found"
            description={
              searchTerm ? `No results for "${searchTerm}"` : 'No users available at the moment.'
            }
            action={
              searchTerm
                ? {
                    label: 'Clear Search',
                    onClick: () => {
                      setSearchTerm('');
                    },
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
