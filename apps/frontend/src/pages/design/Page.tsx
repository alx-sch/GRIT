import { Container } from '@/components/layout/Container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/datepicker';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Caption, Heading, Text } from '@/components/ui/typography';
import { AlertCircleIcon, CheckCircle2Icon, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

const mockedComboboxOptions = [
  {
    value: 'berghain',
    label: 'Berghain',
  },
  {
    value: 'ohm',
    label: 'Ohm',
  },
  {
    value: 'wilde renate.js',
    label: 'Wilde Renate',
  },
  {
    value: 'sisyphos',
    label: 'Sisyphos',
  },
  {
    value: 'grießmühle rip',
    label: 'Grießmühle RIP',
  },
];

export default function Design() {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxValue, setComboboxValue] = useState('');

  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const handleDateSelect = (date: DateRange | undefined) => {
    setSelectedDateRange(date);
  };

  const handleToast = () => {
    toast.success('Event Created', {
      description: "We've sent a confirmation email to your inbox.",
      action: {
        label: 'Undo',
        onClick: () => {
          console.log('Undo');
        },
      },
    });
  };

  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Container className="py-10 space-y-12">
      <section className="space-y-4">
        <Heading level={2}>1. Typography System</Heading>

        <Separator />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex space-y-4 h-full w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Headings</CardTitle>
              </CardHeader>
              <CardContent>
                <Heading level={1}>Heading 1</Heading>
                <Heading level={2}>Heading 2</Heading>
                <Heading level={3}>Heading 3</Heading>
                <Heading level={4}>Heading 4</Heading>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 h-full w-full">
            <Card>
              <CardHeader>
                <CardTitle>Bodies</CardTitle>
              </CardHeader>
              <CardContent>
                <Text size="lg">
                  <strong>Body Large:</strong> The quick brown fox jumps over the lazy dog. Used for
                  introductory text or leads.
                </Text>
                <Text size="base">
                  <strong>Body Base:</strong> The standard paragraph size. Good for long form
                  content and readability. It has comfortable line height.
                </Text>
                <Text size="sm">
                  <strong>Body Small:</strong> Compact text for dense interfaces.
                </Text>
                <Caption>Caption: Used for timestamps, hints, or footnotes.</Caption>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Heading level={2}>2. Interactive Elements</Heading>
        <Separator />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Achtung</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="disabled">Disabled</Button>
                <div className="w-full" /> {/* Line break */}
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="outline">
                  <Mail className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calendar - Date Picker</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <DatePicker
                  selected={selectedDateRange}
                  onSelect={handleDateSelect}
                  placeholder="Pick a date"
                ></DatePicker>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Combobox - Select value </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Combobox
                  options={mockedComboboxOptions}
                  value={comboboxValue}
                  onChange={setComboboxValue}
                  placeholder="Select Location"
                  emptyMessage="No locations found"
                ></Combobox>
              </CardContent>
            </Card>
          </div>

          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs & Forms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Caption>Email Address</Caption>
                <Input placeholder="name@example.com" />
              </div>

              <div className="grid gap-2">
                <Caption className="text-destructive">Error State</Caption>
                <Input error placeholder="Invalid input..." defaultValue="Wrong Value" />
                <span className="text-xs text-destructive font-medium">
                  Please enter a valid email.
                </span>
              </div>

              <div className="flex gap-2 align-center">
                <Input placeholder="Search..." className="max-w-50" />
                <Button>Search</Button>
              </div>

              <Textarea placeholder="Your event description here..." />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: FEEDBACK & DISPLAY */}
      <section className="space-y-4">
        <Heading level={2}>3. Feedback & Display</Heading>
        <Separator />

        <div className="grid gap-8 md:grid-cols-3">
          {/* Toast Notification */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Toasts (Sonner)</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="mt-0 mb-4">Click to trigger a toast notification.</Text>
              <Button onClick={handleToast} className="w-full">
                Trigger Success Toast
              </Button>
            </CardContent>
          </Card>

          {/* Avatars */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" seed="test" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://broken-link.com/img.png" seed="meowmeow" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Heading level={4} className="text-sm">
                  Logged In User
                </Heading>
                <Caption>@johndoe</Caption>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Loading State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" size="sm" onClick={toggleLoading} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reload Skeleton'}
              </Button>

              {isLoading ? (
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-50" />
                    <Skeleton className="h-4 w-37.5" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    AB
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium leading-none">Alex Brown</div>
                    <div className="text-sm text-muted-foreground">alex@example.com</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="gap-2 flex flex-col">
                <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    This is an alert with icon, title and description.
                  </AlertDescription>
                </Alert>
                <Alert variant={'destructive'}>
                  <AlertCircleIcon />
                  <AlertTitle>Error!</AlertTitle>
                  <AlertDescription>
                    This is an alert with icon, title and description.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Container>
  );
}
