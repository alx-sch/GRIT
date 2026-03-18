import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BackButton } from '@/components/ui/backButton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/emptyState';
import { Input } from '@/components/ui/input';
import { Heading, Text } from '@/components/ui/typography';
import { UserCard } from '@/components/ui/userCard';
import { useSearchParam } from '@/hooks/useSearchParam';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { conversationService } from '@/services/conversationService';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { FriendRequestResponse } from '@/types/friends';
import {
  ResConversationSingleId,
  ResFriendBase,
  ResFriendRequest,
  ResUserPublic,
} from '@grit/schema';
import {
  ArrowDownZA,
  ArrowUpAZ,
  Check,
  Eye,
  MessageCircleMore,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useRevalidator } from 'react-router-dom';
import { toast } from 'sonner';

interface FriendsLoaderData {
  pendingIncoming: FriendRequestResponse;
  pendingOutgoing: FriendRequestResponse;
  friendsList: ResFriendBase[];
}

const PAGE_SIZE = '100';

// Helper function to fetch all friends recursively
async function fetchAllFriends(): Promise<ResFriendBase[]> {
  const allFriends: ResFriendBase[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await friendService.listFriends({ limit: PAGE_SIZE, cursor });
    allFriends.push(...result.data);
    hasMore = result.pagination.hasMore;
    cursor = result.pagination.nextCursor ?? undefined;
  }

  return allFriends;
}

export const friendsLoader = async (): Promise<FriendsLoaderData> => {
  const [pendingIncoming, pendingOutgoing, friendsList] = await Promise.all([
    friendService.listIncomingRequests({ limit: PAGE_SIZE }),
    friendService.listOutgoingRequests({ limit: PAGE_SIZE }),
    fetchAllFriends(),
  ]);
  return { pendingIncoming, pendingOutgoing, friendsList };
};

export default function FriendsPage() {
  const friends = useTypedLoaderData<FriendsLoaderData>();
  const { revalidate } = useRevalidator();

  const [searchInput, setSearchInput, debouncedSearch] = useSearchParam('search');

  //Refetch every 30s to get updated list
  useEffect(() => {
    const interval = setInterval(() => void revalidate(), 30000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  //Cross-reference users to determine User Card actions
  const friendIds = new Set(friends.friendsList.map((f) => f.friendId));
  const outgoingIds = new Set(friends.pendingOutgoing.data.map((r) => r.receiverId));
  const incomingIds = new Set(friends.pendingIncoming.data.map((r) => r.requesterId));

  //Actions functions
  async function sendRequest(userId: number) {
    try {
      await friendService.sendRequest(userId);
      toast.info('Friend request sent');
      void revalidate();
    } catch {
      toast.error('Failed to send friend request');
    }
  }

  async function cancel(requestId: string) {
    try {
      await friendService.cancelRequest(requestId);
      toast.info('Friend request canceled');
      void revalidate();
    } catch {
      toast.error('Failed to cancel friend request');
    }
  }

  async function accept(requestId: string) {
    try {
      await friendService.acceptRequest(requestId);
      toast.info('Friend request accepted');
      void revalidate();
    } catch {
      toast.error('Failed to accept friend request');
    }
  }

  async function decline(requestId: string) {
    try {
      await friendService.declineRequest(requestId);
      toast.info('Friend request declined');
      void revalidate();
    } catch {
      toast.error('Failed to decline friend request');
    }
  }

  async function remove(friendId: number) {
    try {
      await friendService.removeFriend(friendId);
      toast.info('Friend removed');
      void revalidate();
    } catch {
      toast.error('Failed to remove friend');
    }
  }

  const navigate = useNavigate();
  async function startChat(friendUserId: number) {
    try {
      const res: ResConversationSingleId = await conversationService.getConversation({
        type: 'DIRECT',
        directId: friendUserId,
      });
      void navigate(`/chat/${res.id}`);
    } catch {
      toast.error('Failed to start chat');
    }
  }

  return (
    <div className="space-y-8">
      <BackButton label="Back to Profile" onClick={() => void navigate('/profile')} />
      <div className="space-y-6">
        <Heading>My Friends</Heading>
      </div>
      <FriendSearch
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        debouncedSearch={debouncedSearch}
        friendIds={friendIds}
        outgoingIds={outgoingIds}
        incomingIds={incomingIds}
        onSendRequest={sendRequest}
      />
      <PendingSection
        requests={friends.pendingIncoming.data}
        onAccept={accept}
        onDecline={decline}
      />
      <OutgoingSection requests={friends.pendingOutgoing.data} onCancel={cancel} />
      <FriendsSection friends={friends.friendsList} onChat={startChat} onRemove={remove} />
    </div>
  );
}

//Sub-components

interface FriendSearchProps {
  searchInput: string;
  setSearchInput: (v: string) => void;
  debouncedSearch: string;
  friendIds: Set<number>;
  outgoingIds: Set<number>;
  incomingIds: Set<number>;
  onSendRequest: (userId: number) => Promise<void>;
}

function FriendSearch({
  searchInput,
  setSearchInput,
  debouncedSearch,
  friendIds,
  outgoingIds,
  incomingIds,
  onSendRequest,
}: FriendSearchProps) {
  const [users, setUsers] = useState<ResUserPublic[]>([]);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const currentUser = useCurrentUserStore((s) => s.user);

  useEffect(() => {
    if (!debouncedSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      return;
    }
    void userService.getUsers({ search: debouncedSearch, limit: '50' }).then((res) => {
      setUsers(res.data);
      setFetchedFor(debouncedSearch);
    });
  }, [debouncedSearch]);

  const searchDone =
    !!debouncedSearch && fetchedFor === debouncedSearch && debouncedSearch === searchInput;
  const filteredUsers = users.filter((u) => u.id !== currentUser?.id && !friendIds.has(u.id));

  return (
    <div className="flex flex-col gap-6">
      <Input
        placeholder="Search for new friends..."
        className="max-w-sm"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
        }}
        clearable
        onClear={() => {
          setSearchInput('');
        }}
      />
      {searchInput === '' ? null : !searchDone ? (
        <Text className="text-muted-foreground">Searching...</Text>
      ) : filteredUsers.length > 0 ? (
        <UserGrid>
          {filteredUsers.map((user) => {
            const isPending = outgoingIds.has(user.id) || incomingIds.has(user.id);
            return (
              <UserCard
                key={user.id}
                user={user}
                actions={
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/users/${user.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isPending ? (
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        Pending
                      </span>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        title="Send friend request"
                        onClick={() => void onSendRequest(user.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                }
              />
            );
          })}
        </UserGrid>
      ) : (
        <EmptyState
          title="No users found"
          description={`No results for "${searchInput}"`}
          action={{
            label: 'Clear Search',
            onClick: () => {
              setSearchInput('');
            },
          }}
        />
      )}
    </div>
  );
}

interface PendingSectionProps {
  requests: ResFriendRequest[];
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
}

function PendingSection({ requests, onAccept, onDecline }: PendingSectionProps) {
  if (requests.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <Heading level={3}>Pending Requests</Heading>
      <UserGrid>
        {requests.map((req) => (
          <UserCard
            key={req.id}
            user={req.requester}
            actions={
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/users/${req.requester.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="sm" onClick={() => void onAccept(req.id)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void onDecline(req.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            }
          />
        ))}
      </UserGrid>
    </div>
  );
}

interface OutgoingSectionProps {
  requests: ResFriendRequest[];
  onCancel: (requestId: string) => Promise<void>;
}

function OutgoingSection({ requests, onCancel }: OutgoingSectionProps) {
  if (requests.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <Heading level={3}>Sent Requests</Heading>
      <UserGrid>
        {requests.map((req) => (
          <UserCard
            key={req.id}
            user={req.receiver}
            actions={
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/users/${req.receiver.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void onCancel(req.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            }
          />
        ))}
      </UserGrid>
    </div>
  );
}

interface FriendsSectionProps {
  friends: ResFriendBase[];
  onChat: (friendUserId: number) => Promise<void>;
  onRemove: (friendId: number) => Promise<void>;
}

function FriendsSection({ friends, onChat, onRemove }: FriendsSectionProps) {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (friends.length === 0) {
    return (
      <EmptyState
        title="No friends yet"
        description="Search for new friends above to start connecting!"
      />
    );
  }

  // Sort friends alphabetically by name
  const sortedFriends = [...friends].sort((a, b) => {
    const nameA = a.friend.name.toLowerCase();
    const nameB = b.friend.name.toLowerCase();
    if (sortDirection === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });

  const toggleSort = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Heading level={3}>All Friends ({friends.length})</Heading>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="gap-2"
          title={sortDirection === 'asc' ? 'Sort Z → A' : 'Sort A → Z'}
        >
          <span className="hidden sm:inline">Sort</span>
          {sortDirection === 'asc' ? (
            <ArrowUpAZ className="h-4 w-4" />
          ) : (
            <>
              <ArrowDownZA className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <UserGrid>
        {sortedFriends.map((friend) => (
          <UserCard
            key={friend.id}
            user={friend.friend}
            actions={
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/users/${friend.friend.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  title="Chat"
                  onClick={() => void onChat(friend.friend.id)}
                >
                  <MessageCircleMore className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" title="Remove friend">
                      <UserX className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove this friend?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will remove {friend.friend.name} from
                        your friends.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          void onRemove(friend.friendId);
                        }}
                      >
                        Remove friend
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            }
          />
        ))}
      </UserGrid>
    </div>
  );
}

function UserGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
