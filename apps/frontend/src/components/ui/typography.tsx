import * as React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
}

export function Heading({ level = 1, className, ...props }: HeadingProps) {
  const Tag = `h${String(level)}` as React.ElementType;

  const sizeClasses = {
    1: 'heading-1',
    2: 'heading-2',
    3: 'heading-3',
    4: 'heading-3 text-xl',
  };

  return <Tag className={cn(sizeClasses[level], 'scroll-m-20', className)} {...props} />;
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'lg' | 'base' | 'sm';
}

export function Text({ size = 'base', className, ...props }: TextProps) {
  const sizeClasses = {
    lg: 'body-lg',
    base: 'body-base',
    sm: 'body-sm',
  };

  return <p className={cn(sizeClasses[size], 'not-first:mt-1', className)} {...props} />;
}

// --- CAPTION ---
export function Caption({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('caption', className)} {...props} />;
}
