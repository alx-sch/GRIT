import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioCard } from '@/components/ui/radio-card';
import { Globe, Lock } from 'lucide-react';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import type { CurrentUser } from '@/types/user';

interface PrivacySettingsProps {
  user: CurrentUser;
  onPrivacyUpdate: (updatedUser: CurrentUser) => void;
}

export function PrivacySettings({ user, onPrivacyUpdate }: PrivacySettingsProps) {
  const [isProfilePublic, setIsProfilePublic] = useState(user.isProfilePublic ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (value: boolean) => {
    setIsProfilePublic(value);
    setHasChanges(value !== (user.isProfilePublic ?? true));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updatedUser = await userService.updateMe({
        isProfilePublic,
      });
      onPrivacyUpdate(updatedUser);
      setHasChanges(false);
      toast.success('Privacy settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsProfilePublic(user.isProfilePublic ?? true);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control who can see your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <RadioCard
            selected={isProfilePublic}
            icon={Globe}
            label="Public Profile"
            description="Anyone can view your profile, bio, location, and events you're hosting"
            onClick={() => {
              handleToggle(true);
            }}
          />

          <RadioCard
            selected={!isProfilePublic}
            icon={Lock}
            label="Private Profile"
            description="Only you and your friends can view your profile information"
            onClick={() => {
              handleToggle(false);
            }}
          />
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                void handleSave();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
