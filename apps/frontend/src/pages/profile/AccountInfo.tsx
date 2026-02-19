import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { Calendar } from 'lucide-react';
import type { CurrentUser } from '@/types/user';

interface AccountInfoProps {
  user: CurrentUser;
}

export function AccountInfo({ user }: AccountInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.createdAt && (
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Text className="font-medium">Member Since</Text>
            </div>
            <Text className="text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
