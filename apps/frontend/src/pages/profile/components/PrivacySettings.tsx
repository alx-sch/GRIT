import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
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
      console.error('Privacy update failed:', error);
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
          {/* Public Profile Option */}
          <div
            className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              isProfilePublic
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => {
              handleToggle(true);
            }}
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isProfilePublic ? 'border-primary' : 'border-border'
                }`}
              >
                {isProfilePublic && <div className="w-3 h-3 rounded-full bg-primary" />}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="cursor-pointer flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="font-semibold">Public Profile</span>
              </Label>
              <Text className="text-sm text-muted-foreground">
                Anyone can view your profile, bio, location, and events you're hosting
              </Text>
            </div>
          </div>

          {/* Private Profile Option */}
          <div
            className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              !isProfilePublic
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => {
              handleToggle(false);
            }}
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  !isProfilePublic ? 'border-primary' : 'border-border'
                }`}
              >
                {!isProfilePublic && <div className="w-3 h-3 rounded-full bg-primary" />}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="cursor-pointer flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="font-semibold">Private Profile</span>
              </Label>
              <Text className="text-sm text-muted-foreground">
                Only you and your friends can view your profile information
              </Text>
            </div>
          </div>
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
