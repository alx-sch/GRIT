import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/providers/theme-provider';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light mode',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Use system preference',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Preferences</CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label>Appearance</Label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isSelected ? 'selected' : 'outline'}
                  className="flex flex-col items-center justify-center h-auto py-4 px-3"
                  onClick={() => {
                    setTheme(option.value);
                  }}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-bold">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
