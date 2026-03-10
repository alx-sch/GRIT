import { cn } from '@/lib/utils';

interface AnimatedUnderlineProps {
  /** Whether the underline should be fully visible (active state) */
  isActive?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Animated underline that grows from left to right on hover.
 * Use with a parent that has `group` class and `relative` positioning.
 *
 * @example
 * <div className="group relative">
 *   <button>Hover me</button>
 *   <AnimatedUnderline isActive={false} />
 * </div>
 */
export function AnimatedUnderline({ isActive = false, className = '' }: AnimatedUnderlineProps) {
  return (
    <span
      className={cn(
        'absolute bottom-0 left-0 h-0.5 bg-foreground transition-all duration-300 ease-out',
        isActive ? 'w-full' : 'w-0 group-hover:w-full group-hover:bg-foreground/50',
        className
      )}
    />
  );
}
