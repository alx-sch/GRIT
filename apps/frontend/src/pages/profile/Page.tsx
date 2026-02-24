import { useCurrentUserStore } from '@/store/currentUserStore';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileInfo } from './ProfileInfo';
import { AccountInfo } from './AccountInfo';
import { MyEvents } from './MyEvents';
import type { CurrentUser } from '@/types/user';

export function Page() {
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
  const initials =
    currentUser.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ??
    currentUser.email?.[0]?.toUpperCase() ??
    'U';

  return (
    <Container className="py-10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Heading>Profile</Heading>
          <Text className="text-muted-foreground">
            Manage your account settings and preferences
          </Text>
        </div>

        <ProfileAvatar
          user={currentUser}
          avatarUrl={avatarUrl}
          initials={initials}
          onAvatarUpdate={handleUserUpdate}
        />

        <ProfileInfo user={currentUser} onProfileUpdate={handleUserUpdate} />

        <MyEvents userId={currentUser.id} />

        <AccountInfo user={currentUser} />
      </div>
    </Container>
  );
}
