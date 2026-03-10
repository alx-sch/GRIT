import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioCard } from '@/components/ui/radio-card';
import { useTheme } from '@/providers/theme-provider';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light Mode',
      icon: Sun,
      description: 'Use light theme with bright backgrounds',
    },
    {
      value: 'dark' as const,
      label: 'Dark Mode',
      icon: Moon,
      description: 'Use dark theme with dark backgrounds',
    },
    {
      value: 'system' as const,
      label: 'System Preference',
      icon: Monitor,
      description: 'Automatically match your system theme',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Preferences</CardTitle>
        <CardDescription>Choose your preferred appearance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {themeOptions.map((option) => (
          <RadioCard
            key={option.value}
            selected={theme === option.value}
            icon={option.icon}
            label={option.label}
            description={option.description}
            onClick={() => {
              setTheme(option.value);
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
