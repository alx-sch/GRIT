import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heading, Text } from '@/components/ui/typography';
import { BackButton } from '@/components/ui/backButton';
import { UserCard } from '@/components/ui/userCard';
import { EmptyState } from '@/components/ui/emptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { conversationService } from '@/services/conversationService';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { FriendRequestResponse, FriendResponse } from '@/types/friends';
import {
  ResFriendBase,
  ResFriendRequest,
  ResUserPublic,
  ResConversationSingleId,
} from '@grit/schema';
import { Check, MessageCircleMore, UserPlus, UserX, X, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useRevalidator, Link } from 'react-router-dom';
import { toast } from 'sonner';

interface FriendsLoaderData {
  pendingIncoming: FriendRequestResponse;
  pendingOutgoing: FriendRequestResponse;
  friendsList: FriendResponse;
}

export const friendsLoader = async (): Promise<FriendsLoaderData> => {
  const [pendingIncoming, pendingOutgoing, friendsList] = await Promise.all([
    friendService.listIncomingRequests({ limit: '100' }),
    friendService.listOutgoingRequests({ limit: '100' }),
    friendService.listFriends({ limit: '100' }),
  ]);
  return { pendingIncoming, pendingOutgoing, friendsList };
};

export default function FriendsPage() {
  const friends = useTypedLoaderData<FriendsLoaderData>();
  const { revalidate } = useRevalidator();

  //Refetch every 30s to get updated list
  useEffect(() => {
    const interval = setInterval(() => void revalidate(), 30000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  //Cross-reference users to determine User Card actions
  const friendIds = new Set(friends.friendsList.data.map((f) => f.friendId));
  const outgoingIds = new Set(friends.pendingOutgoing.data.map((r) => r.receiverId));
  const incomingIds = new Set(friends.pendingIncoming.data.map((r) => r.requesterId));

  //Actions functions
  async function sendRequest(userId: number) {
    try {
      await friendService.sendRequest(userId);
      void revalidate();
    } catch {
      toast.error('Failed to send friend request');
    }
  }

  async function accept(requestId: string) {
    try {
      await friendService.acceptRequest(requestId);
      void revalidate();
    } catch {
      toast.error('Failed to accept friend request');
    }
  }

  async function decline(requestId: string) {
    try {
      await friendService.declineRequest(requestId);
      void revalidate();
    } catch {
      toast.error('Failed to decline friend request');
    }
  }

  async function remove(friendId: number) {
    try {
      await friendService.removeFriend(friendId);
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
      <FriendsSection friends={friends.friendsList.data} onChat={startChat} onRemove={remove} />
    </div>
  );
}

//Sub-components

interface FriendSearchProps {
  friendIds: Set<number>;
  outgoingIds: Set<number>;
  incomingIds: Set<number>;
  onSendRequest: (userId: number) => Promise<void>;
}

function FriendSearch({ friendIds, outgoingIds, incomingIds, onSendRequest }: FriendSearchProps) {
  const [users, setUsers] = useState<ResUserPublic[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchInput, 500);
  const searchDone =
    !!debouncedSearch && fetchedFor === debouncedSearch && debouncedSearch === searchInput;
  const currentUser = useCurrentUserStore((s) => s.user);

  useEffect(() => {
    if (!debouncedSearch) return;
    void userService.getUsers({ search: debouncedSearch, limit: '50' }).then((res) => {
      setUsers(res.data);
      setFetchedFor(debouncedSearch);
    });
  }, [debouncedSearch]);

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

interface FriendsSectionProps {
  friends: ResFriendBase[];
  onChat: (friendUserId: number) => Promise<void>;
  onRemove: (friendId: number) => Promise<void>;
}

function FriendsSection({ friends, onChat, onRemove }: FriendsSectionProps) {
  if (friends.length === 0) {
    return (
      <EmptyState
        title="No friends yet"
        description="Search for new friends above to start connecting!"
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Heading level={3}>All Friends</Heading>
      <UserGrid>
        {friends.map((friend) => (
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
                <Button
                  variant="destructive"
                  size="sm"
                  title="Remove friend"
                  onClick={() => void onRemove(friend.friendId)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
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
