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
import { adminService, AdminUser } from '@/services/adminService';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface AdminUsersTableProps {
  initialUsers: AdminUser[];
}

export function AdminUsersTable({ initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDeleteUser = async (userId: number) => {
    setIsDeleting(userId);
    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
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
            <th className="px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Email</th>
            <th className="px-2 sm:px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-2 sm:px-4 py-2 text-center text-muted-foreground">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-muted/50">
                <td className="px-2 sm:px-4 py-2">
                  <div>
                    <p className="font-medium">{user.displayName ?? user.name ?? 'N/A'}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{user.email}</td>
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex justify-end">
                    {/* Only show delete if NOT admin */}
                    {!user.isAdmin ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting === user.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {user.displayName ?? user.name ?? user.email}. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void handleDeleteUser(user.id)}
                              className="bg-destructive"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">Admin</span>
                    )}
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
