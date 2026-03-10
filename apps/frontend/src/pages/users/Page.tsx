import { useState, useMemo, useEffect } from 'react';
import { LoaderFunctionArgs, useSearchParams } from 'react-router-dom';
import { userService } from '@/services/userService';
import { friendService } from '@/services/friendService';
import { Heading } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/emptyState';
import { UserResponse } from '@/types/user';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { toast } from 'sonner';
import type { FriendshipStatus } from '@/types/friends';
import { UserCardWithActions } from './components/UserCardWithActions';

interface UsersLoaderData {
  users: UserResponse;
  friendshipStatuses: Record<number, FriendshipStatus>;
}

export const usersLoader = async ({ request }: LoaderFunctionArgs): Promise<UsersLoaderData> => {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const users = await userService.getUsers({ limit, cursor });

  const friendshipStatuses: Record<number, FriendshipStatus> = {};
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
    }
    for (const request of incoming.data) {
      friendshipStatuses[request.requesterId] = 'pending_received';
    }
  } catch {
    // Not logged in or error fetching - leave statuses empty
  }

  return { users, friendshipStatuses };
};

export default function Users() {
  const { users, friendshipStatuses: initialStatuses } = useTypedLoaderData<UsersLoaderData>();
  const currentUser = useCurrentUserStore((s) => s.user);

  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');

  // Sync input when URL param changes externally (e.g. navigated here from GlobalSearch)
  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
    // Only re-run when searchParams changes
  }, [searchParams]);
  const [friendshipStatuses, setFriendshipStatuses] =
    useState<Record<number, FriendshipStatus>>(initialStatuses);
  const [loadingUsers, setLoadingUsers] = useState<Record<number, boolean>>({});

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.data;
    return users.data.filter((user) =>
      (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleAddFriend = async (userId: number) => {
    setLoadingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      await friendService.sendRequest(userId);
      setFriendshipStatuses((prev) => ({ ...prev, [userId]: 'pending_sent' }));
      toast.success('Friend request sent');
    } catch {
      toast.error('Failed to send friend request');
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <Heading level={1}>People</Heading>

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

        {filteredUsers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <UserCardWithActions
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                friendshipStatus={friendshipStatuses[user.id] ?? 'none'}
                isLoading={loadingUsers[user.id] ?? false}
                onAddFriend={handleAddFriend}
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
