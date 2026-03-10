import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { adminService, AdminEvent } from '@/services/adminService';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AxiosError } from 'axios';

interface AdminEventsTableProps {
  initialEvents: AdminEvent[];
}

export function AdminEventsTable({ initialEvents }: AdminEventsTableProps) {
  const [events, setEvents] = useState(initialEvents);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDeleteEvent = async (eventId: number) => {
    setIsDeleting(eventId);
    try {
      await adminService.deleteEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
      toast.success('Event deleted');
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 403) {
        toast.error('Failed to delete event');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-2 sm:px-4 py-2 text-left">Title</th>
            <th className="px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Start Date</th>
            <th className="px-2 sm:px-4 py-2 text-left hidden md:table-cell">Status</th>
            <th className="px-2 sm:px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 sm:px-4 py-2 text-center text-muted-foreground">
                No events found
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id} className="border-t hover:bg-muted/50">
                <td className="px-2 sm:px-4 py-2">
                  <div>
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {format(new Date(event.startAt), 'MMM d')}
                    </p>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                  {format(new Date(event.startAt), 'MMM d, yyyy')}
                </td>
                <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      event.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting === event.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{event.title}". This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDeleteEvent(event.id)}
                            className="bg-destructive"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
