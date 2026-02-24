import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import type { CurrentUser } from '@/types/user';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileInfoProps {
  user: CurrentUser;
  onProfileUpdate: (updatedUser: CurrentUser) => void;
}

export function ProfileInfo({ user, onProfileUpdate }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? '',
    },
    values: {
      name: user.name ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await userService.updateMe({ name: data.name });
      onProfileUpdate(updatedUser);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    reset({ name: user.name ?? '' });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">
              <User className="w-4 h-4 inline mr-2" />
              Name
            </Label>
            <Input
              id="name"
              {...register('name')}
              disabled={!isEditing || isSubmitting}
              placeholder="Enter your name"
            />
            {errors.name && <Text className="text-sm text-destructive">{errors.name.message}</Text>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </Label>
            <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
            <Text className="text-sm text-muted-foreground">Email cannot be changed</Text>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleCancel();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
