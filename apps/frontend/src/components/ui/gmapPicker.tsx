import { CreateLocationInput } from '@grit/schema';
import {
  Map as GoogleMap, // No collisions with JS Map
  useMap,
  useMapsLibrary,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import { useRef, useEffect, useState } from 'react';
import { type UseFormSetValue } from 'react-hook-form';
import { AlertDescription } from './alert';
import { InfoIcon } from 'lucide-react';
import { Button } from './button';

/**
 * TYPES
 */

type LatLng = { lat: number; lng: number } | null;

type GmpSelectEvent = Event & {
  placePrediction: google.maps.places.PlacePrediction;
};

/**
 * HELPER FUNCTIONS
 */

/**
 * The Google Maps API returns an addressComponents array for every address of the format
 *
 * addressComponents: [
 *   { longText: "10178", types: ["postal_code"] },
 *   { longText: "Berlin", types: ["locality"] },
 *   { longText: "Germany", types: ["country"] }
 * ]
 *
 * For faster lookup we create a map helper which returns a prestructured object
 */

function extractAddress(components: google.maps.places.AddressComponent[]) {
  const map = new Map<string, string>();

  for (const c of components) {
    for (const type of c.types) {
      if (!map.has(type)) {
        map.set(type, c.longText ?? '');
      }
    }
  }

  return {
    zip: map.get('postal_code') ?? '',
    city: map.get('locality') ?? map.get('postal_town') ?? '',
    country: map.get('country') ?? '',
    street: map.get('route') ?? '',
    streetNumber: map.get('street_number') ?? '',
  };
}

/**
 * MAIN CODE
 */

export const GmapPicker = ({
  setValue,
  lng,
  lat,
}: {
  setValue: UseFormSetValue<CreateLocationInput>;
  lng: number;
  lat: number;
}) => {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [markerPos, setMarkerPos] = useState<LatLng>(null);
  const [showMarkerMovedNotive, setShowMarkerMovedNotice] = useState(false);
  const geocodingLibrary = useMapsLibrary('geocoding');

  // Restore data from local storage
  useEffect(() => {
    if (!map) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const pos = { lat, lng };

    map.panTo(pos);
    map.setZoom(15);
    // Linting bullshit callback solution
    setTimeout(() => {
      setMarkerPos(pos);
    }, 0);
  }, [map, lat, lng]);

  // Recalculate when the pin is moved and user wants to get new address
  const recalculate = () => {
    void (async () => {
      if (!geocodingLibrary || !markerPos) return;

      const geocoder = new geocodingLibrary.Geocoder();

      const response = await geocoder.geocode({
        location: markerPos,
      });

      const result = response.results?.[0];
      if (!result?.address_components) return;

      const addressData = extractAddress(
        result.address_components.map((c: google.maps.GeocoderAddressComponent) => ({
          longText: c.long_name,
          shortText: c.short_name,
          types: c.types,
        }))
      );

      setValue('address', addressData.street + ' ' + addressData.streetNumber);
      setValue('postalCode', addressData.zip);
      setValue('city', addressData.city);
      setValue('country', addressData.country);

      setShowMarkerMovedNotice(false);
    })();
  };

  // Search bar behavior
  useEffect(() => {
    if (!placesLibrary || !containerRef.current || !map) return;

    const autocomplete = new google.maps.places.PlaceAutocompleteElement({});
    autocomplete.setAttribute('placeholder', 'Search for a location or address');
    containerRef.current.appendChild(autocomplete);

    // Fires on search enter
    autocomplete.addEventListener('gmp-select', (event) => {
      void (async () => {
        const placePrediction = (event as GmpSelectEvent).placePrediction;

        if (!placePrediction) return;

        const place = placePrediction.toPlace();

        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        if (!place.location) return;

        const lat = place.location.lat();
        const lng = place.location.lng();

        map.panTo({ lat, lng });
        map.setZoom(15);
        setMarkerPos({ lat, lng });
        setValue('latitude', lat);
        setValue('longitude', lng);
        if (place.addressComponents) {
          const addressData = extractAddress(place.addressComponents);
          setValue('address', addressData.street + ' ' + addressData.streetNumber);
          setValue('postalCode', addressData.zip);
          setValue('city', addressData.city);
          setValue('country', addressData.country);
        }
      })();
    });

    return () => {
      autocomplete.remove();
    };
  }, [placesLibrary]);

  return (
    <>
      <div className="mx-1.5 relative -mb-18 z-10" ref={containerRef} />
      <GoogleMap
        style={{ width: 'calc(100% - 2px)', minHeight: '300px', margin: '1px', color: 'black' }}
        defaultCenter={{ lat: 48.54992, lng: 14 }}
        defaultZoom={3}
        gestureHandling="cooperative"
        mapId="mapid"
        disableDefaultUI
      >
        {markerPos && (
          <AdvancedMarker
            position={markerPos}
            draggable
            onDragEnd={(e) => {
              const pos = e.latLng;
              if (!pos) return;
              setMarkerPos({
                lat: pos.lat(),
                lng: pos.lng(),
              });
              setValue('latitude', pos.lat());
              setValue('longitude', pos.lng());
              setShowMarkerMovedNotice(() => true);
            }}
          />
        )}
      </GoogleMap>
      {showMarkerMovedNotive && (
        <div>
          <AlertDescription className="flex">
            <InfoIcon />
            <div className="ml-2 flex flex-col justify-end">
              <div className="mb-2">
                <AlertDescription>
                  You have moved the marker, do you want to recalculate the address?
                </AlertDescription>
              </div>
              <Button className="self-end" variant="secondary" type="button" onClick={recalculate}>
                Yes, recalculate
              </Button>
            </div>
          </AlertDescription>
        </div>
      )}
    </>
  );
};
