import * as React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  fluid?: boolean;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, fluid, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mx-auto w-full px-4 md:px-8', fluid ? '' : 'max-w-7xl', className)}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';

export { Container };
