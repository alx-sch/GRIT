import { useEffect, useState, useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useDebounce } from '@/hooks/useDebounce';

import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function Users() {
  const { users, loading, error } = useUserStore();
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => user.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [users, debouncedSearch]);

  if (loading) {
    return (
      <Container className="py-10 space-y-8">
        <div className="space-y-2">
          <Heading level={1}>Users</Heading>
          <Text className="text-muted-foreground">Manage your team members and permissions.</Text>
        </div>

        <Skeleton className="h-10 w-full max-w-sm" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-24 flex items-center p-4">
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-3 w-[80%]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-10">
        <div className="p-4 border-2 border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <Text className="font-bold">Error loading users: {error}</Text>
        </div>
      </Container>
    );
  }

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
              <Card
                key={user.id}
                className="hover:-translate-y-1 transition-transform duration-200"
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <Avatar className="h-12 w-12 border-2 border-black">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}
                    />
                    <AvatarFallback className="font-bold">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="overflow-hidden">
                    <CardTitle className="text-base truncate">{user.name}</CardTitle>
                    <CardDescription className="truncate" title={user.email}>
                      {user.email}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
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
