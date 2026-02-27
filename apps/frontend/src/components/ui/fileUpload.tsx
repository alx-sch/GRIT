import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FileIcon, ImageIcon, Trash2, UploadIcon, X } from 'lucide-react';
import { useState } from 'react';

const DEFAULT_ACCEPT = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] };
const DEFAULT_ACCEPT_WITH_PDF = {
  ...DEFAULT_ACCEPT,
  'application/pdf': ['.pdf'],
};
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const DEFAULT_MAX_SIZE_WITH_PDF = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

interface FileUploadProps {
  multiple?: boolean;
  value?: string | null;
  onChange: (files: File[]) => void;
  progress?: number;
  existingFiles?: Array<{ id: number; fileName: string; mimeType: string }>;
  onRemoveExisting?: (id: number) => void;
  aspectRatio?: 'square' | 'video' | 'auto';
  onError?: (error: string | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  multiple = false,
  value,
  onChange,
  progress = 0,
  existingFiles = [],
  onRemoveExisting,
  aspectRatio = 'square',
  onError,
  maxSize = multiple ? DEFAULT_MAX_SIZE_WITH_PDF : DEFAULT_MAX_SIZE,
  accept = multiple ? DEFAULT_ACCEPT_WITH_PDF : DEFAULT_ACCEPT,
  disabled,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const displayImage = isCleared ? null : (preview ?? value);
  const isUploading = progress > 0 && progress < 100;

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio];

  const handleDrop = (acceptedFiles: File[]) => {
    onError?.(null);
    if (!multiple && accept === DEFAULT_ACCEPT) {
      const selected = acceptedFiles[0];
      if (selected) {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        onChange([selected]);
        setIsCleared(false);
      }
    } else {
      const updatedFiles = [...files, ...acceptedFiles];
      setFiles(updatedFiles);
      onChange(updatedFiles);
    }
  };

  const handleError = (err: Error) => {
    if (err.message.includes('larger than')) {
      onError?.(`File must be less than ${formatBytes(maxSize)}`);
    } else if (err.message.includes('File type')) {
      onError?.('Invalid file type');
    } else if (err.message.includes('Too many files')) {
      onError?.(`You can only upload up to ${multiple ? 20 : 1} files`);
    } else {
      onError?.(err.message);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onChange([]);
    setIsCleared(true);
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
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-8">
              <Progress value={progress} className="w-full bg-muted" />
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
          maxFiles={multiple ? 20 : 1}
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
      {/* Files list */}
      {/* Pending Files */}
      <ul className="flex flex-col gap-1 mt-2">
        {files.map((file, index) => (
          <li key={index} className="flex items-center gap-2 text-sm px-2 py-1 rounded-md bg-muted">
            <FileTypeIcon mimeType={file.type} />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="text-muted-foreground text-zs shrink-0">{formatBytes(file.size)}</span>
            <button
              type="button"
              onClick={() => {
                const updated = files.filter((_, i) => i !== index);
                setFiles(updated);
                onChange(updated);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {/*Separator - if existing files = true*/}
      {files.length > 0 && existingFiles && existingFiles.length > 0 && (
        <p className="text-muted-foreground text-xs mt-2">Already uploaded:</p>
      )}
      {/* Existing files */}
      {existingFiles && existingFiles.length > 0 && (
        <ul className="flex flex-col gap-1 mt-2">
          {existingFiles.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 text-sm px-2 py-1 rounded-md bg-muted"
            >
              <FileTypeIcon mimeType={file.mimeType} />
              <span className="flex-1 truncate">{file.fileName}</span>
              <button type="button" onClick={() => onRemoveExisting?.(file.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/*Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
