import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { ImageCropControls } from './image-crop-controls';
import { getCroppedImg } from '@/lib/image-crop-utils';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageFile: File) => void;
  title?: string;
  description?: string;
}

export function ImageCropDialog({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'Crop Your Image',
  description = 'Adjust the position and size of your image',
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setShowGrid(false);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    setIsProcessing(true);

    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { width: 400, height: 400 },
        0.9
      );

      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert(error instanceof Error ? error.message : 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] p-4 sm:p-6 gap-3">
        <DialogHeader className="space-y-1">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-75 sm:h-87.5 bg-muted border-4 border-border">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={showGrid}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            style={{
              containerStyle: {
                backgroundColor: 'hsl(var(--muted))',
              },
              cropAreaStyle: {
                border: '3px solid hsl(var(--border))',
              },
            }}
          />
        </div>

        {/* Controls */}
        <ImageCropControls
          zoom={zoom}
          rotation={rotation}
          showGrid={showGrid}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onToggleGrid={() => {
            setShowGrid(!showGrid);
          }}
          onReset={handleReset}
          minZoom={1}
          maxZoom={3}
        />

        <DialogFooter className="pt-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={void handleApply}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="animate-spin" />}
            {isProcessing ? 'Processing...' : 'Apply & Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
