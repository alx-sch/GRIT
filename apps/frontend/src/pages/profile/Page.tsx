import { useCurrentUserStore } from '@/store/currentUserStore';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProfileInfo } from './components/ProfileInfo';
import { MyEvents } from './components/MyEvents';
import { ThemeSettings } from './components/ThemeSettings';
import type { CurrentUser } from '@/types/user';
import { userService } from '@/services/userService';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';

export const profileLoader = async () => {
  return userService.getMyEvents();
};

export function Page() {
  const events = useTypedLoaderData<{ title: string }[]>();
  const currentUser = useCurrentUserStore((state) => state.user);
  const setUser = useCurrentUserStore((state) => state.setUser);

  const handleUserUpdate = (updatedUser: CurrentUser) => {
    setUser(updatedUser);
  };

  if (!currentUser) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Text>Loading profile...</Text>
        </div>
      </Container>
    );
  }

  const avatarUrl = currentUser.avatarKey ? getAvatarImageUrl(currentUser.avatarKey) : undefined;

  return (
    <Container className="py-10">
      <div className="space-y-8">
        <div>
          <Heading>Profile</Heading>
          <Text className="text-muted-foreground">
            Manage your account settings and preferences
          </Text>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <ProfileSidebar
            user={currentUser}
            avatarUrl={avatarUrl}
            eventsCount={events.length}
            onAvatarUpdate={handleUserUpdate}
          />

          <div className="flex-1 space-y-6">
            <ProfileInfo user={currentUser} onProfileUpdate={handleUserUpdate} />

            <ThemeSettings />

            <MyEvents events={events} />
          </div>
        </div>
      </div>
    </Container>
  );
}
