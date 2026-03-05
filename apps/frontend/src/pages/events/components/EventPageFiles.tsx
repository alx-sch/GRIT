import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';
import { FileTypeIcon, getEventFileUrl } from '@/lib/file_utils';
import type { EventFile } from '@/types/event';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EventPageFilesProps {
  imageFiles: EventFile[];
  otherFiles: EventFile[];
  selectedImageIndex: number | null;
  onSelectImage: (idx: number) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const EventPageFiles = ({
  imageFiles,
  otherFiles,
  selectedImageIndex,
  onSelectImage,
  onClose,
  onPrev,
  onNext,
}: EventPageFilesProps) => {
  return (
    <>
      <div className="flex flex-col gap-4">
        {imageFiles.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2">
            {imageFiles.map((file, idx) => (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  onSelectImage(idx);
                }}
                className="h-24 w-24 shrink-0 cursor-pointer"
              >
                <img
                  src={getEventFileUrl(file.fileKey)}
                  alt=""
                  className="w-full h-full object-cover rounded"
                />
              </button>
            ))}
          </div>
        )}
        {otherFiles.length > 0 && (
          <ul className="flex flex-col gap-2 mt-2">
            {otherFiles.map((file) => (
              <li key={file.id}>
                <a
                  href={getEventFileUrl(file.fileKey)}
                  download={file.fileName}
                  target="_blank"
                  className="flex items-center gap-2 hover:underline"
                  rel="noreferrer"
                >
                  <FileTypeIcon mimeType={file.mimeType} />
                  <Text>{file.fileName}</Text>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-3xl p-2">
          {(() => {
            const file = selectedImageIndex !== null ? imageFiles[selectedImageIndex] : null;
            if (!file) return null;
            return (
              <div className="relative">
                <img src={getEventFileUrl(file.fileKey)} alt="" className="w-full h-auto rounded" />
                {imageFiles.length > 1 && (
                  <>
                    <button
                      onClick={onPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-white p-1 bg-black/60 rounded-full"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </button>
                    <button
                      onClick={onNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white p-1 bg-black/60 rounded-full"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};
