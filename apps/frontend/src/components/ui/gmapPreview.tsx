import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdvancedMarker, Map as GoogleMap } from '@vis.gl/react-google-maps';

interface GmapPreviewProps {
  lng: number;
  lat: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName?: string | null | undefined;
}

/**
 * MAIN CODE
 */

export const GmapPreview = ({ lng, lat, open, onOpenChange, locationName }: GmapPreviewProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {locationName && (
          <DialogHeader>
            <DialogTitle>{locationName}</DialogTitle>
          </DialogHeader>
        )}
        <GoogleMap
          style={{ width: '100%', height: '300px' }}
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          gestureHandling="cooperative"
          mapId="mapid"
          disableDefaultUI
        >
          <AdvancedMarker position={{ lat, lng }} />
        </GoogleMap>
      </DialogContent>
    </Dialog>
  );
};
