import { FileIcon, ImageIcon } from 'lucide-react';

export const getEventFileUrl = (filekey: string) => {
  return `/s3/event-files/${filekey}`;
};

export function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}
