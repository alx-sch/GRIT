import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocationSummary } from '@/types/location';
import { DialogDescription } from '@radix-ui/react-dialog';
import { AdvancedMarker, Map as GoogleMap } from '@vis.gl/react-google-maps';

interface GmapPreviewProps {
  lng: number;
  lat: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: LocationSummary;
}

/**
 * MAIN CODE
 */

export const GmapPreview = ({ lng, lat, open, onOpenChange, location }: GmapPreviewProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {location?.name && (
          <DialogHeader className="gap-0 justify-start">
            <DialogTitle>{location?.name}</DialogTitle>
            <DialogDescription className="pt-0">
              {location?.address}
              {location?.postalCode && (
                <>
                  <br />
                  {location.postalCode}
                </>
              )}
              {location?.city && ` ${location.city}`}
              {location?.country && `, ${location.country}`}
            </DialogDescription>
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
