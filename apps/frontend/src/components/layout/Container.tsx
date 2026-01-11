import * as React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  fluid?: boolean;
}

const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ className, fluid, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('mx-auto w-full px-8 md:px-12', fluid ? '' : 'max-w-8xl', className)}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';

export { Container };
