import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { Mail, User, MapPin, FileText } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import type { CurrentUser } from '@/types/user';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().max(150, 'Bio must be 150 characters or less').optional(),
  city: z.string().optional(),
  country: z.string().optional(),
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
    control,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? '',
      bio: user.bio ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
    },
    values: {
      name: user.name ?? '',
      bio: user.bio ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
    },
  });

  const bioValue = useWatch({ control, name: 'bio' }) ?? '';

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updatedUser = await userService.updateMe({
        name: data.name,
        bio: data.bio ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
      });
      onProfileUpdate(updatedUser);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    reset({
      name: user.name ?? '',
      bio: user.bio ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
    });
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
              clearable={isEditing && !isSubmitting}
            />
            {errors.name && <Text className="text-sm text-destructive">{errors.name.message}</Text>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">
              <FileText className="w-4 h-4 inline mr-2" />
              Bio
            </Label>
            <Textarea
              id="bio"
              {...register('bio')}
              disabled={!isEditing || isSubmitting}
              placeholder="Tell us about yourself (max 150 characters)"
              rows={3}
            />
            <div className="flex justify-between items-center">
              {errors.bio && <Text className="text-sm text-destructive">{errors.bio.message}</Text>}
              <Text className="text-sm text-muted-foreground ml-auto">{bioValue.length}/150</Text>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                <MapPin className="w-4 h-4 inline mr-2" />
                City
              </Label>
              <Input
                id="city"
                {...register('city')}
                disabled={!isEditing || isSubmitting}
                placeholder="Your city"
                clearable={isEditing && !isSubmitting}
              />
              {errors.city && (
                <Text className="text-sm text-destructive">{errors.city.message}</Text>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                <MapPin className="w-4 h-4 inline mr-2" />
                Country
              </Label>
              <Input
                id="country"
                {...register('country')}
                disabled={!isEditing || isSubmitting}
                placeholder="Your country"
                clearable={isEditing && !isSubmitting}
              />
              {errors.country && (
                <Text className="text-sm text-destructive">{errors.country.message}</Text>
              )}
            </div>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
