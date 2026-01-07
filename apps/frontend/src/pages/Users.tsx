import { useState, useMemo } from 'react';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { userService } from '@/services/userService';
import type { User } from '@/types/user';

import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const usersLoader = async ({ request }: LoaderFunctionArgs) => {
  console.log(request); //we can use this to fitler or smth
  return userService.getUsers();
};

export default function Users() {
  const users = useLoaderData() as User[];

  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
              <Card
                key={user.id}
                className="hover:-translate-y-1 transition-transform duration-200"
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <Avatar className="h-12 w-12 border-2 border-black">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}
                    />
                    <AvatarFallback seed={user.name}>
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
