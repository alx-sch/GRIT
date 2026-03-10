import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
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
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export function DangerZone() {
  const [isDeleting, setIsDeleting] = useState(false);

  const clearAuthenticated = useAuthStore((state) => state.clearAuthenticated);
  const clearUser = useCurrentUserStore((state) => state.clearUser);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      clearAuthenticated();
      clearUser();
      toast.success('Account deleted successfully');
      window.location.href = '/?account_deleted=true';
    } catch (error) {
      console.error('Failed to delete account:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status !== 403) {
        toast.error('Failed to delete account. Please try again.');
      } else toast.error('You can not delete an admin user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-2 border-destructive/50 rounded-base p-6 space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <Text className="text-lg font-semibold text-destructive">Danger Zone</Text>
      </div>

      <div className="space-y-2">
        <Text className="font-medium">Delete Account</Text>
        <Text className="text-sm text-muted-foreground">
          Once you delete your account, there is no going back. Please be certain.
        </Text>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove
              your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
