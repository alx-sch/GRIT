import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UploadIcon, X } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  disabled?: boolean;
  value?: string | null;
  onChange: (file: File | null) => void;
  progress?: number;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  onError?: (error: string | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

const DEFAULT_ACCEPT = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] };
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

export function FileUpload({
  disabled,
  value,
  onChange,
  progress = 0,
  className,
  aspectRatio = 'square',
  onError,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayImage = preview ?? value;
  const isUploading = progress > 0 && progress < 100;

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio];

  const handleDrop = (acceptedFiles: File[]) => {
    onError?.(null);
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      onChange(selected);
    }
  };

  const handleError = (err: Error) => {
    if (err.message.includes('larger than')) {
      onError?.(`File must be less than ${formatBytes(maxSize)}`);
    } else if (err.message.includes('File type')) {
      onError?.('Invalid file type');
    } else {
      onError?.(err.message);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onChange(null);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {displayImage ? (
        //Preview with delete button
        <div
          className={cn(
            'relative rounded-lg overflow-hidden border-2 border-border mx-auto w-full md:max-w-md',
            aspectClass
          )}
        >
          <img src={displayImage} alt="preview" className="w-full h-full object-cover" />
          {/* Progress overlay when uploading */}
          {isUploading && (
            <div className="absolute flex items-center justify-center">
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Delete button */}
          {!disabled && !isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        //Dropzone
        <Dropzone
          src={file ? [file] : undefined}
          onDrop={handleDrop}
          accept={accept}
          maxSize={maxSize}
          disabled={disabled}
          className={cn('w-full h-48', aspectClass)}
          onError={handleError}
        >
          <DropzoneContent />
          <DropzoneEmptyState>
            <div className="flex flex-col items-center justify-center">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <UploadIcon size={16} />
              </div>
              <p className="my-2 font-medium text-sm normal-case text-wrap">
                Drag and drop, or click to select a file.
              </p>
            </div>
          </DropzoneEmptyState>
        </Dropzone>
      )}
      {/*Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
