import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';
import { Calendar, Ticket, Trash2, Upload, Edit, MapPin } from 'lucide-react';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import type { CurrentUser } from '@/types/user';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { validateImageFile, readFileAsDataURL } from '@/lib/image-crop-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProfileSidebarProps {
  user: CurrentUser;
  avatarUrl?: string;
  eventsCount: number;
  onAvatarUpdate: (updatedUser: CurrentUser) => void;
}

export function ProfileSidebar({
  user,
  avatarUrl,
  eventsCount,
  onAvatarUpdate,
}: ProfileSidebarProps) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const hasCustomAvatar = user.avatarKey && !user.avatarKey.startsWith('default-');

  return (
    <div className="w-full md:w-80 md:border-r-2 md:border-primary md:pr-8 space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div
          className="relative group cursor-pointer"
          onClick={handleAvatarClick}
          title="Click to edit profile picture"
        >
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={avatarUrl}
              seed={user.email ?? 'user'}
              alt={user.name ?? 'User avatar'}
            />
            <AvatarFallback name={user.name ?? user.email ?? 'User'} className="text-4xl" />
          </Avatar>
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

      <div className="space-y-3 pt-6 border-t-2 border-primary">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <Text className="text-sm text-muted-foreground">Member since</Text>
            <Text className="text-sm font-medium">{formatDate(user.createdAt)}</Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <Text className="text-sm text-muted-foreground">Events</Text>
            <Text className="text-sm font-medium">
              {eventsCount} {eventsCount === 1 ? 'event' : 'events'}
            </Text>
          </div>
        </div>
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
