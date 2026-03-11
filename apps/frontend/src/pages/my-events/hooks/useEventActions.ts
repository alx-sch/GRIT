import { useState } from 'react';
import { useNavigate, useRevalidator } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { validateEventForPublish } from '@/lib/event-validation';
import { toast } from 'sonner';

export type OptimisticUpdates = Record<number, { isPublished?: boolean; isPublic?: boolean }>;

export function useEventActions() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdates>({});

  const publishEvent = async (eventId: number, eventSlug: string): Promise<boolean> => {
    try {
      const event = await eventService.getEvent(eventSlug);
      const validation = validateEventForPublish(event);

      if (!validation.isValid) {
        toast.error('Event is incomplete', {
          description: 'Please edit and fill all required fields before publishing.',
        });
        void navigate(`/events/${eventSlug}/edit`);
        return false;
      }

      setOptimisticUpdates((prev) => ({
        ...prev,
        [eventId]: { isPublished: true },
      }));

      await eventService.patchEvent(String(eventId), { isPublished: true });

      toast.success('Event published successfully!', {
        action: {
          label: 'View Event',
          onClick: () => {
            void navigate(`/events/${eventSlug}`);
          },
        },
      });

      void revalidator.revalidate();
      return true;
    } catch {
      setOptimisticUpdates((prev) => {
        const newUpdates = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newUpdates[eventId];
        return newUpdates;
      });
      toast.error('Failed to publish event', {
        description: 'Please try again later.',
      });
      return false;
    }
  };

  const unpublishEvent = async (eventId: number): Promise<boolean> => {
    try {
      setOptimisticUpdates((prev) => ({
        ...prev,
        [eventId]: { isPublished: false },
      }));

      await eventService.patchEvent(String(eventId), { isPublished: false });
      toast.success('Event unpublished successfully!');

      void revalidator.revalidate();
      return true;
    } catch {
      setOptimisticUpdates((prev) => {
        const newUpdates = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newUpdates[eventId];
        return newUpdates;
      });
      toast.error('Failed to unpublish event', {
        description: 'Please try again later.',
      });
      return false;
    }
  };

  const revertOptimisticUpdate = (eventId: number) => {
    setOptimisticUpdates((prev) => {
      const newUpdates = { ...prev };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newUpdates[eventId];
      return newUpdates;
    });
  };

  return {
    publishEvent,
    unpublishEvent,
    optimisticUpdates,
    setOptimisticUpdates,
    revertOptimisticUpdate,
  };
}
