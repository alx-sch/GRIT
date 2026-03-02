import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocationSummary } from '@/types/location';
import { DialogDescription } from '@radix-ui/react-dialog';
import { AdvancedMarker, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';

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
  const handleCopyAddress = async () => {
    const cityPostal = [location?.postalCode, location?.city].map((s) => s?.trim()).filter(Boolean);
    const locationPostal = cityPostal.length > 0 ? cityPostal.join(' ') : null;
    const locationParts = [location?.address, locationPostal].map((s) => s?.trim()).filter(Boolean);

    const fullAddress = locationParts.join(', ');

    try {
      await navigator.clipboard.writeText(fullAddress);
      toast.info('Address copied');
    } catch (error) {
      toast.warning('Failed to copy address');
    }
  };

  const handleGetDirections = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {location?.name && (
          <DialogHeader className="gap-0 justify-start">
            <DialogTitle>{location?.name}</DialogTitle>
            {(location?.address || location?.postalCode || location?.city || location?.country) && (
              <DialogDescription className="pt-0">
                {location?.address && location.address !== undefined && (
                  <>
                    {location.address}
                    <br />
                  </>
                )}
                {[
                  [location?.postalCode, location?.city].filter(Boolean).join(' '),
                  location?.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </DialogDescription>
            )}
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
        <div className="flex flex-row justify-between pt-4">
          <Button variant="outline" className="md:min-w-48" onClick={handleCopyAddress}>
            Copy address
          </Button>
          <Button variant="default" className="md:min-w-48" onClick={handleGetDirections}>
            Get directions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
