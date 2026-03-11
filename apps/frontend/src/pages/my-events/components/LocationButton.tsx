import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { GmapPreview } from '@/components/ui/gmapPreview';
import { APIProvider } from '@vis.gl/react-google-maps';
import type { LocationSummary } from '@/types/location';

interface LocationButtonProps {
  location?: LocationSummary | null;
}

export function LocationButton({ location }: LocationButtonProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API as string;

  const locationText = location?.name ?? location?.city ?? 'TBA';
  const hasCoordinates = location?.latitude != null && location?.longitude != null;

  if (!hasCoordinates) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 mr-1 shrink-0" />
        <span className="line-clamp-1">{locationText}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMapOpen(true);
        }}
        type="button"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
      >
        <MapPin className="w-4 h-4 mr-1 shrink-0" />
        <span className="line-clamp-1 underline decoration-dashed underline-offset-2 hover:decoration-solid">
          {locationText}
        </span>
      </button>

      <APIProvider apiKey={apiKey}>
        <GmapPreview
          lat={location.latitude}
          lng={location.longitude}
          open={isMapOpen}
          onOpenChange={setIsMapOpen}
          location={location}
        />
      </APIProvider>
    </>
  );
}
