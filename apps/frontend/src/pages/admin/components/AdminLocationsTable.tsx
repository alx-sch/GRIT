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
import { LocationBase } from '@/types/location';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';

interface AdminLocationsTableProps {
  initialLocations: LocationBase[];
}

export function AdminLocationsTable({ initialLocations }: AdminLocationsTableProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDeleteLocation = async (locationId: number) => {
    setIsDeleting(locationId);
    try {
      await adminService.deleteLocation(locationId);
      setLocations(locations.filter((l) => l.id !== locationId));
      toast.success('Location deleted');
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 403) {
        toast.error('Failed to delete location');
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
            <th className="px-2 sm:px-4 py-2 text-left">Name</th>
            <th className="px-2 sm:px-4 py-2 text-left hidden sm:table-cell">City</th>
            <th className="px-2 sm:px-4 py-2 text-left hidden md:table-cell">Country</th>
            <th className="px-2 sm:px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 sm:px-4 py-2 text-center text-muted-foreground">
                No locations found
              </td>
            </tr>
          ) : (
            locations.map((location) => (
              <tr key={location.id} className="border-t hover:bg-muted/50">
                <td className="px-2 sm:px-4 py-2">
                  <div>
                    <p className="font-medium">{location.name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {location.city ?? 'N/A'}
                    </p>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{location.city ?? 'N/A'}</td>
                <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
                  {location.country ?? 'N/A'}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === location.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete location?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {location.name}. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDeleteLocation(location.id)}
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
