import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Main heading text */
  title: string;
  /** Description text shown below the title */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Reusable empty state component with consistent styling across the app.
 * Matches the design from EventFeedPage.
 *
 * @example
 * <EmptyState
 *   title="No users found"
 *   description='No results for "John"'
 *   action={{ label: "Clear Search", onClick: () => setSearch('') }}
 * />
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-border text-center bg-card">
      <Heading level={3} className="uppercase tracking-tight">
        {title}
      </Heading>

      <Text size="base" className="text-muted-foreground mt-2">
        {description}
      </Text>

      {action && (
        <Button variant="destructive" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
