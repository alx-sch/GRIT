import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { Camera } from 'lucide-react';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import type { CurrentUser } from '@/types/user';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { validateImageFile, readFileAsDataURL } from '@/lib/image-crop-utils';

interface ProfileAvatarProps {
  user: CurrentUser;
  avatarUrl?: string;
  initials: string;
  onAvatarUpdate: (updatedUser: CurrentUser) => void;
}

export function ProfileAvatar({ user, avatarUrl, initials, onAvatarUpdate }: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      // Read file as data URL for cropper
      const dataUrl = await readFileAsDataURL(file);
      setSelectedImageSrc(dataUrl);
      setShowCropDialog(true);
    } catch (error) {
      console.error('Failed to read image file:', error);
      toast.error('Failed to read image file. Please try again.');
    } finally {
      // Reset file input
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Click on your avatar to upload a new profile picture</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl} alt={user.name ?? 'User avatar'} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <Button
              variant="outline"
              onClick={() => {
                handleAvatarClick();
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Change Picture'}
            </Button>
            <Text className="text-sm text-muted-foreground mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </Text>
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
        </CardContent>
      </Card>

      {/* Image Crop Dialog */}
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
    </>
  );
}
