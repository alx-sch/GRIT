import { useState, useMemo } from 'react';
import { LoaderFunctionArgs } from 'react-router-dom';
import { userService } from '@/services/userService';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { UserResponse } from '@/types/user';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { UserCard } from '@/components/ui/userCard';

export const usersLoader = async ({ request }: LoaderFunctionArgs): Promise<UserResponse> => {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  return userService.getUsers({ limit, cursor });
};

export default function Users() {
  const users = useTypedLoaderData<UserResponse>();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.data;
    return users.data.filter((user) =>
      (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <Container className="py-10 space-y-8">
      <div className="space-y-2">
        <Heading level={1}>Users</Heading>
        <Text className="text-muted-foreground">Manage your team members and permissions.</Text>
      </div>

      <div className="flex flex-col gap-6">
        <Input
          placeholder="Search users..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />

        {filteredUsers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-muted-foreground/20">
            <Text className="text-muted-foreground">No users found matching "{searchTerm}"</Text>
          </div>
        )}
      </div>
    </Container>
  );
}
