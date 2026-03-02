import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

const AVATAR_CONFIG = {
  style: 'notionists',
  version: '9.x',
  params: '',
};

function getAvatarUrl(seed: string, params: string = AVATAR_CONFIG.params) {
  return `https://api.dicebear.com/${AVATAR_CONFIG.version}/${AVATAR_CONFIG.style}/svg?seed=${encodeURIComponent(seed)}${params}`;
}

/**
 * Generate initials from a name or email
 * - If name has spaces, take first letter of first two words (e.g., "John Doe" -> "JD")
 * - If name has no spaces, take first two characters (e.g., "John" -> "JO")
 * - If email, take first two characters before @ (e.g., "john@example.com" -> "JO")
 */
function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return '??';

  const cleaned = nameOrEmail.trim();

  // Check if it's an email (contains @)
  if (cleaned.includes('@')) {
    const username = cleaned.split('@')[0];
    return username.slice(0, 2).toUpperCase();
  }

  // Check if name has spaces (first and last name)
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Single word name - take first 2 characters
  return cleaned.slice(0, 2).toUpperCase();
}

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  seed?: string;
  params?: string;
}

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, seed, params, ...props }, ref) => {
  const imageSource = src ?? (seed ? getAvatarUrl(seed, params) : undefined);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={imageSource}
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Fallback
> {
  name?: string;
}

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, name, children, ...props }, ref) => {
  const initials = name ? getInitials(name) : children;

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted font-bold text-muted-foreground',
        className
      )}
      {...props}
    >
      {initials}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
