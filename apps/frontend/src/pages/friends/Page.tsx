import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heading, Text } from '@/components/ui/typography';
import { UserCard } from '@/components/ui/userCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { conversationService } from '@/services/conversationService';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { FriendRequestResponse, FriendResponse } from '@/types/friends';
import { ResUserPublic, type ConversationRes } from '@grit/schema';
import { MessageCircleMore, UserPlus, UserRoundX, Check, X} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useRevalidator } from 'react-router-dom';

type FriendsLoaderData = {
  pendingIncoming: FriendRequestResponse;
  pendingOutgoing: FriendRequestResponse;
  friendsList: FriendResponse;
};

export const friendsLoader = async (): Promise<FriendsLoaderData> => {
  const [pendingIncoming, pendingOutgoing, friendsList] = await Promise.all([
    friendService.listIncomingRequests({ limit: '100' }),
    friendService.listOutgoingRequests({ limit: '100' }),
    friendService.listFriends({ limit: '100' }),
  ]);
  return {
    pendingIncoming,
    pendingOutgoing,
    friendsList,
  };
};

export default function FriendsPage() {
  const friends = useTypedLoaderData<FriendsLoaderData>();
  const { revalidate } = useRevalidator();

  //Refetch every 30s to get updated list
  useEffect(() => {
    const interval = setInterval(() => {
      void revalidate();
    }, 30000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  //Cross-reference friends and pending requests to avoid showing users in search that already have a pending request or are already friends
  const friendIds = new Set(friends.friendsList.data.map((f) => f.friendId));
  const outgoingIds = new Set(friends.pendingOutgoing.data.map((r) => r.receiverId));
  const incomingIds = new Set(friends.pendingIncoming.data.map((r) => r.requesterId));

  //Search input to add new friends
  const [users, setUsers] = useState<ResUserPublic[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchInput, 500);
  const searchDone = fetchedFor === debouncedSearch && debouncedSearch === searchInput;

  useEffect(() => {
    if (!debouncedSearch) {
      setUsers([]);
      setFetchedFor(null);
      return;
    }
    userService.getUsers({ search: debouncedSearch, limit: '50' }).then((res) => {
      setUsers(res.data);
      setFetchedFor(debouncedSearch);
    });
  }, [debouncedSearch]);

  //Filter out current user from search results
  const currentUser = useCurrentUserStore((s) => s.user);
  const filteredUsers = users.filter((u) => u.id !== currentUser?.id);

  //Start chat action
  const navigate = useNavigate();
  function startChat(friend: { id: number }) {
    void startChatAsync(friend);
  }

  async function startChatAsync(friend: { id: number }) {
    try {
      const res: ConversationRes = await conversationService.getConversation({
        type: 'DIRECT',
        directId: friend.id,
      });

      void navigate(`/chat/${res.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  //Send Friend Request
  async function sendRequest(userId: number) {
    try {
      await friendService.sendRequest(userId);
      void revalidate();
    } catch (err) {
      console.error(err);
    }
  }

  //Accept friend request
  async function accept(requestId: string) {
    try {
      await friendService.acceptRequest(requestId);
      void revalidate();
    } catch (err) {
      console.error(err);
    }
  }

  //Decline friend request
  async function decline(requestId: string) {
    try {
      await friendService.declineRequest(requestId);
      void revalidate();
    } catch (err) {
      console.error(err);
    }
  }

  //Remove friend
  async function remove(friendId: number) {
    try {
      await friendService.removeFriend(friendId);
      void revalidate();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Container className="py-10 space-y-8">
      {/*<div className="space-y-2">*/}
      {/*<Heading level={1}>My friends</Heading>
        <Text className="text-muted-foreground">Manage your friends</Text>
      </div>*/}

      {/* User Search*/}
      <div className="flex flex-col gap-6">
        <Input
          placeholder="Search for new friends..."
          className="max-w-sm"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
          }}
        />

        {searchInput === '' ? null : !searchDone ? (
          <Text className="text-muted-foreground">Searching...</Text>
        ) : filteredUsers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => {
              const isFriend = friendIds.has(user.id);
              const isPending = outgoingIds.has(user.id);
              const requestedMe = incomingIds.has(user.id);

              let action: React.ReactNode;
              if (isFriend) {
                action = (
                  <MessageCircleMore
                    className="cursor-pointer"
                    onClick={() => {
                      startChat(user);
                    }}
                  />
                );
              } else if (isPending || requestedMe) {
                action = <span className="text-xs text-muted-foreground">Pending</span>;
              } else {
                action = <UserPlus onClick={() => sendRequest(user.id)} />;
              }
              return <UserCard key={user.id} user={user} actions={action} />;
            })}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-muted-foreground/20">
            <Text className="text-muted-foreground">No users found matching "{searchInput}"</Text>
          </div>
        )}
      </div>

      {/* Pending Incoming Friends requests*/}

      {friends.pendingIncoming.data.length > 0 && (
        <div className="flex flex-col gap-4">
          <Heading level={2}>Pending Friends Requests</Heading>

          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.pendingIncoming.data.map((req) => (
                <UserCard
                  key={req.id}
                  user={req.requester}
                  actions={
                    <>
                      <Check  onClick={() => accept(req.id)} />
                      <X  onClick={() => decline(req.id)}>
                      </X>
                    </>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List of Friends */}
      {friends.friendsList.data.length > 0 && (
        <div className="flex flex-col gap-4">
          <Heading level={2}>Your friends</Heading>
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.friendsList.data.map((friend) => (
                <UserCard
                  key={friend.id}
                  user={friend.friend}
                  actions={
                    <>
                      <MessageCircleMore
                        className="cursor-pointer"
                        onClick={() => {
                          startChat(friend.friend);
                        }}
                      />
                      <UserRoundX
                        className="cursor-point"
                        onClick={() => {
                          remove(friend.friendId);
                        }}
                      />
                    </>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
