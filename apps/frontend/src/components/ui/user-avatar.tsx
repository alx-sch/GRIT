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
  src?: string;
  className?: string;
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
  // Handle avatar logic:
  // - If srcProp is provided, use it (URL)
  // - If avatarKey starts with 'default-', extract the seed and use for dicebear generation
  // - Otherwise if avatarKey exists, use it as S3 URL
  // - Fall back to name/email as seed
  let src: string | undefined = srcProp;
  let seed: string;

  if (!srcProp) {
    if (user.avatarKey?.startsWith('default-')) {
      // Extract the random seed from 'default-{seed}'
      seed = user.avatarKey.substring('default-'.length);
      src = undefined; // Let AvatarImage generate from seed
    } else if (user.avatarKey) {
      // Get S3 URL of uploaded avatar
      src = getAvatarImageUrl(user.avatarKey);
      seed = user.name ?? user.email ?? 'user';
    } else {
      // No avatar at all - use name/email as seed
      src = undefined;
      seed = user.name ?? user.email ?? 'user';
    }
  } else {
    seed = user.name ?? user.email ?? 'user';
  }

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
