import { PrivacySettings } from './PrivacySettings';
import { ThemeSettings } from './ThemeSettings';
import { DangerZone } from './DangerZone';
import type { CurrentUser } from '@/types/user';

interface SettingsProps {
  user: CurrentUser;
  onPrivacyUpdate: (updatedUser: CurrentUser) => void;
}

export function Settings({ user, onPrivacyUpdate }: SettingsProps) {
  return (
    <div className="space-y-6">
      <PrivacySettings user={user} onPrivacyUpdate={onPrivacyUpdate} />
      <ThemeSettings />
      <DangerZone />
    </div>
  );
}
