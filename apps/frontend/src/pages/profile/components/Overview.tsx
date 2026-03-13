import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { Calendar, Ticket, Users, CalendarCheck } from 'lucide-react';
import { friendService } from '@/services/friendService';
import type { CurrentUser } from '@/types/user';
import { MyEvents } from './MyEvents';

interface OverviewProps {
  user: CurrentUser;
}

export function Overview({ user }: OverviewProps) {
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const response = await friendService.listFriends();
        setFriendsCount(response.data.length);
      } catch (error) {
        console.error('Failed to load friends:', error);
        setFriendsCount(0);
      } finally {
        setIsLoadingFriends(false);
      }
    };

    void loadFriends();
  }, []);

  const totalEvents = user.attending?.length ?? 0;
  const hostingEvents = user.attending?.filter((event) => event.isOrganizer).length ?? 0;
  const attendingEvents = user.attending?.filter((event) => !event.isOrganizer).length ?? 0;

  const stats = [
    {
      label: 'Total Events',
      value: totalEvents,
      icon: Ticket,
    },
    {
      label: 'Hosting',
      value: hostingEvents,
      icon: CalendarCheck,
    },
    {
      label: 'Attending',
      value: attendingEvents,
      icon: Calendar,
    },
    {
      label: 'Friends',
      value: isLoadingFriends ? '...' : friendsCount,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex flex-col items-start space-y-2">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <Text className="text-3xl font-bold font-heading">{stat.value}</Text>
                <Text className="caption">{stat.label}</Text>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Events Preview */}
      <Card>
        <CardHeader>
          <CardTitle>My Events</CardTitle>
        </CardHeader>
        <CardContent>
          <MyEvents events={user.attending ?? []} variant="standalone" />
        </CardContent>
      </Card>
    </div>
  );
}
