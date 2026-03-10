import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { cn } from '@/lib/utils';

const SIZE_CLASSES = {
  xs: 'h-6 w-6',
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
} as const;

const FALLBACK_TEXT_CLASSES = {
  xs: '',
  sm: '',
  md: '',
  lg: 'text-2xl',
  xl: 'text-4xl',
} as const;

type AvatarSize = keyof typeof SIZE_CLASSES;

interface UserAvatarUser {
  id?: number | null;
  name?: string | null;
  email?: string | null;
  avatarKey?: string | null;
}

interface UserAvatarProps {
  user: UserAvatarUser;
  size?: AvatarSize;
  /** Pre-resolved image URL. When provided, takes precedence over deriving from user.avatarKey. */
  src?: string;
  /** Extra className applied to the Avatar root (use for shape overrides, borders, etc.) */
  className?: string;
  /** Extra className applied to the AvatarFallback (use for text size overrides, shape, etc.) */
  fallbackClassName?: string;
  alt?: string;
}

export function UserAvatar({
  user,
  size = 'sm',
  src: srcProp,
  className,
  fallbackClassName,
  alt,
}: UserAvatarProps) {
  const src = srcProp ?? (user.avatarKey ? getAvatarImageUrl(user.avatarKey) : undefined);
  const seed = user.name ?? user.email ?? 'user';
  const displayName = user.name ?? user.email ?? undefined;

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      <AvatarImage src={src} seed={seed} alt={alt} />
      <AvatarFallback
        name={displayName}
        className={cn(FALLBACK_TEXT_CLASSES[size], fallbackClassName)}
      />
    </Avatar>
  );
}
