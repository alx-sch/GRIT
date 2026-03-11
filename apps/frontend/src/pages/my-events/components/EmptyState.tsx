import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heading, Text } from '@/components/ui/typography';
import { CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarDays className="w-16 h-16 text-muted-foreground mb-4" />
        <Heading className="mb-2">No events yet</Heading>
        <Text className="text-muted-foreground mb-6 max-w-md">
          You haven't joined any events yet. Start by creating your own event or browse existing
          events to attend.
        </Text>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              void navigate('/create/event');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigate('/events');
            }}
          >
            Browse Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
