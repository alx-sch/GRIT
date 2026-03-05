import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Heading, Text } from '@/components/ui/typography';
import { UserCard } from '@/components/ui/userCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { FriendRequestResponse, FriendResponse } from '@/types/friends';
import { ResUserPublic } from '@grit/schema';
import { useEffect, useState } from 'react';

type FriendsLoaderData = {
  pendingIncoming: FriendRequestResponse;
  pendingOutgoing: FriendRequestResponse;
  friends: FriendResponse;
};

export const friendsLoader = async (): Promise<FriendsLoaderData> => {
  const [pendingIncoming, pendingOutgoing, friends] = await Promise.all([
    friendService.listIncomingRequests({ limit: '100' }),
    friendService.listOutgoingRequests({ limit: '100' }),
    friendService.listFriends({ limit: '100' }),
  ]);
  return {
    pendingIncoming,
    pendingOutgoing,
    friends,
  };
};

export default function FriendsPage() {
  const friends = useTypedLoaderData<FriendsLoaderData>();

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
    userService
      .getUsers({ search: debouncedSearch, limit: '50' })
      .then((res) => {setUsers(res.data); setFetchedFor(debouncedSearch)});
  }, [debouncedSearch]);

  return (
    <Container className="py-10 space-y-8">
      <div className="space-y-2">
        <Heading level={1}>My friends</Heading>
        <Text className="text-muted-foreground">Manage your friends</Text>
      </div>

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
		) : users.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-muted-foreground/20">
            <Text className="text-muted-foreground">No users found matching "{searchInput}"</Text>
          </div>
        )}
      </div>

	  {/* Pending Friends requests*/}
	  <div className="flex flex-col gap-6">


     { friends.pendingIncoming.data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.pendingIncoming.data.map((req) => (
              <UserCard key={req.id} user={req.requester} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
