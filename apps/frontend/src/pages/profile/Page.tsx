import { useCurrentUserStore } from '@/store/currentUserStore';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProfileInfo } from './components/ProfileInfo';
import { MyEvents } from './components/MyEvents';
import { ThemeSettings } from './components/ThemeSettings';
import { DangerZone } from './components/DangerZone';
import type { CurrentUser } from '@/types/user';
import { userService } from '@/services/userService';
import { useLoaderData, useRevalidator } from 'react-router-dom';

export const profileLoader = async () => {
  return userService.getMe();
};

export function Page() {
  const user = useLoaderData<typeof profileLoader>();
  const setUser = useCurrentUserStore((state) => state.setUser);
  const { revalidate } = useRevalidator();

  const handleUserUpdate = (updatedUser: CurrentUser) => {
    setUser(updatedUser);
    void revalidate();
  };

  if (!user) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Text>Loading profile...</Text>
        </div>
      </Container>
    );
  }

  const avatarUrl = user.avatarKey ? getAvatarImageUrl(user.avatarKey) : undefined;

  return (
    <div className="space-y-8">
      <div>
        <Heading>Profile</Heading>
        <Text className="text-muted-foreground">Manage your account settings and preferences</Text>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <ProfileSidebar
          user={user}
          avatarUrl={avatarUrl}
          eventsCount={user.attending.length}
          onAvatarUpdate={handleUserUpdate}
        />

        <div className="flex-1 space-y-6">
          <ProfileInfo user={user} onProfileUpdate={handleUserUpdate} />

          <ThemeSettings />

          <MyEvents events={user.attending} />

          <DangerZone />
        </div>
      </div>
    </div>
  );
}
