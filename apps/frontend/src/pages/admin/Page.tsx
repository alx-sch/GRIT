import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { redirect } from 'react-router-dom';
import { adminService, AdminUser } from '@/services/adminService';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';
import { AdminUsersTable } from './components/AdminUsersTable';
import { AdminLocationsTable } from './components/AdminLocationsTable';
import { AdminEventsTable } from './components/AdminEventsTable';

interface AdminLoaderData {
  users: AdminUser[];
  locations: LocationBase[];
  events: EventBase[];
}

export const adminLoader = async (): Promise<AdminLoaderData | Response> => {
  const user = useCurrentUserStore.getState().user;
  if (!user?.isAdmin) {
    return redirect('/');
  }

  const [users, locations, events] = await Promise.all([
    adminService.getAllUsers(),
    adminService.getAllLocations(),
    adminService.getAllEvents(),
  ]);

  return { users, locations, events };
};

export default function AdminPage() {
  const { users, locations, events } = useTypedLoaderData<AdminLoaderData>();

  return (
    <Container className="py-10 space-y-8">
      <div>
        <Heading level={1}>Admin Dashboard</Heading>
        <Text className="text-muted-foreground mt-2">Manage users, locations, and events</Text>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="locations">Locations ({locations.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminUsersTable initialUsers={users} />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <AdminLocationsTable initialLocations={locations} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <AdminEventsTable initialEvents={events} />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
