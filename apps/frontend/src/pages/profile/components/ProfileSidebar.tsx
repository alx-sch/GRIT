import { useState, useRef } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Text } from '@/components/ui/typography';
import { Ticket, Trash2, Upload, Edit, MapPin, Users, Eye } from 'lucide-react';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import type { CurrentUser } from '@/types/user';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { validateImageFile, readFileAsDataURL } from '@/lib/image-crop-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface ProfileSidebarProps {
  user: CurrentUser;
  avatarUrl?: string;
  onAvatarUpdate: (updatedUser: CurrentUser) => void;
}

export function ProfileSidebar({ user, avatarUrl, onAvatarUpdate }: ProfileSidebarProps) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    setShowOptionsDialog(true);
  };

  const handleUploadClick = () => {
    setShowOptionsDialog(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setSelectedImageSrc(dataUrl);
      setShowCropDialog(true);
    } catch (error) {
      console.error('Failed to read image file:', error);
      toast.error('Failed to read image file. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    setShowCropDialog(false);

    try {
      const updatedUser = await userService.uploadAvatar(croppedFile);
      onAvatarUpdate(updatedUser);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
      setSelectedImageSrc('');
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setSelectedImageSrc('');
  };

  const handleRemoveAvatar = async () => {
    setShowOptionsDialog(false);
    setIsRemoving(true);
    try {
      const updatedUser = await userService.removeAvatar();
      onAvatarUpdate(updatedUser);
      toast.success('Profile picture reset to default');
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      toast.error('Failed to reset profile picture. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const hasCustomAvatar = user.avatarKey && !user.avatarKey.startsWith('default-');

  const navLinks = [
    {
      label: 'My Events',
      icon: Ticket,
      href: '/profile/my-events',
    },
    {
      label: 'My Friends',
      icon: Users,
      href: '/profile/my-friends',
    },
    {
      label: 'Public Profile',
      icon: Eye,
      href: `/users/${user.id}`,
    },
  ];

  return (
    <div className="w-full md:w-80 md:border-r-2 md:border-primary md:pr-8 space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div
          className="relative group cursor-pointer"
          onClick={handleAvatarClick}
          title="Click to edit profile picture"
        >
          <UserAvatar user={user} src={avatarUrl} size="xl" alt={user.name ?? 'User avatar'} />
          <div
            className={`absolute inset-0 bg-black/50 rounded-full transition-opacity flex items-center justify-center ${
              isUploading || isRemoving ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isUploading || isRemoving ? (
              <Text className="text-white text-sm">Saving...</Text>
            ) : (
              <Edit className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        <div className="text-center space-y-1">
          <Text className="text-xl font-semibold">{user.name ?? 'Anonymous'}</Text>
          <Text className="text-sm text-muted-foreground">{user.email ?? ''}</Text>
          {(user.city ?? user.country) && (
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <Text className="text-sm">
                {[user.city, user.country].filter(Boolean).join(', ')}
              </Text>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-6 border-t-2 border-primary">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button
              key={link.href}
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => {
                void navigate(link.href);
              }}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          void handleFileChange(e);
        }}
        className="hidden"
      />

      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleUploadClick}
              className="w-full flex items-center justify-start gap-2"
              variant="outline"
            >
              <Upload className="w-4 h-4" />
              Upload New Picture
            </Button>
            {hasCustomAvatar && (
              <Button
                onClick={() => {
                  void handleRemoveAvatar();
                }}
                className="w-full flex items-center justify-start gap-2"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4" />
                Remove Current Picture
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        open={showCropDialog}
        imageSrc={selectedImageSrc}
        onClose={handleCropCancel}
        onCropComplete={(file) => {
          void handleCropComplete(file);
        }}
        title="Crop Your Profile Picture"
        description="Adjust the position, zoom, and rotation of your image"
      />
    </div>
  );
}
