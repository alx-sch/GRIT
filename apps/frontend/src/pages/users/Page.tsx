import { useState, useMemo } from 'react';
import { LoaderFunctionArgs } from 'react-router-dom';
import { userService } from '@/services/userService';
import { Heading } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/emptyState';
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

        {filteredUsers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
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
