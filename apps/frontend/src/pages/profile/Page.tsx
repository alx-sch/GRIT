import { useState, useEffect } from 'react';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProfileInfo } from './components/ProfileInfo';
import { Overview } from './components/Overview';
import { Settings } from './components/Settings';
import type { CurrentUser } from '@/types/user';
import { userService } from '@/services/userService';
import { useLoaderData, useRevalidator } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Home, IdCard, Cog } from 'lucide-react';

export const profileLoader = async () => {
  return userService.getMe();
};

export function Page() {
  const user = useLoaderData<typeof profileLoader>();
  const setUser = useCurrentUserStore((state) => state.setUser);
  const { revalidate } = useRevalidator();

  const getTabFromHash = () => {
    const hash = window.location.hash.slice(1);
    if (['overview', 'personal', 'settings'].includes(hash)) {
      return hash;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

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
        <ProfileSidebar user={user} avatarUrl={avatarUrl} onAvatarUpdate={handleUserUpdate} />

        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList variant="brutalist">
              <TabsTrigger value="overview" variant="brutalist">
                <Home className="w-8 h-8 sm:hidden" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="personal" variant="brutalist">
                <IdCard className="w-8 h-8 sm:hidden" />
                <span className="hidden sm:inline">Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="settings" variant="brutalist">
                <Cog className="w-8 h-8 sm:hidden" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Overview user={user} />
            </TabsContent>

            <TabsContent value="personal">
              <ProfileInfo user={user} onProfileUpdate={handleUserUpdate} />
            </TabsContent>

            <TabsContent value="settings">
              <Settings user={user} onPrivacyUpdate={handleUserUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
