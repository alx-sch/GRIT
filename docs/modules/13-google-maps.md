# Module 13 — Module of Choice: Google Maps API

| Attribute      | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| **Category**   | IV.10                                                                                  |
| **Type**       | Minor                                                                                  |
| **Points**     | 1                                                                                      |
| **Status**     | Done                                                                                   |
| **Notes**      | Location with Google Maps API                                                          |
| **Developers** | johdac (geocoding integration in location form), AudreyBil (map preview on event page) |

---

## Description

Google Maps integration for creating locations with address search and geocoding, and for previewing event locations with an interactive map on the event detail page.

---

## Justification

### Why we chose this module

GRIT is a platform for real-world, in-person events. Location is not an optional metadata field — it is central to whether a user decides to attend. A plain text address field is not enough: users need to find events near them, visualise where they are going, and get directions. The Google Maps Platform was the only integration that covered all three needs (geocoding, map rendering, and navigation handoff) with a production-grade, well-documented API.

### Technical challenges it addresses

**Geocoding and reverse geocoding in a form context.** The location creation form uses the Google Places Autocomplete API to resolve a free-text address into structured fields (name, city, country, postal code) and precise `(latitude, longitude)` coordinates. When a user drags the map marker, reverse geocoding updates all address fields accordingly. Keeping the form state, the map state, and the Places API in sync required careful coordination between React Hook Form, the `@vis.gl/react-google-maps` library, and geocoder callbacks.

**API key security for a client-side key.** Because `VITE_GOOGLE_MAPS_API` is embedded in the compiled frontend bundle, it is inherently public. Mitigating abuse required configuring HTTP referrer restrictions in Google Cloud Console, limiting the key to specific APIs (Maps JavaScript API and Places API only), and setting quota caps — a real-world API security challenge beyond simply plugging in a key.

**Graceful degradation.** The form remains fully functional when the Maps API key is unavailable (CI, staging, local dev without a key). Default coordinates (Berlin centre) are used as a fallback so the form can still be tested and submitted in all environments.

### Value added to the project

- **Accuracy** — coordinates are geocoded, not hand-typed, eliminating invalid or imprecise locations
- **Usability** — users find and confirm a location in seconds via autocomplete rather than filling in five fields manually
- **Discoverability** — stored coordinates enable future proximity-based event search
- **Attendee experience** — one-click directions from the event page reduce friction for people unfamiliar with the venue

---

## Implementation

### Frontend Library

**`@vis.gl/react-google-maps`** — A React wrapper around the Google Maps JavaScript API, maintained by the Google Maps Platform team.

```env
VITE_GOOGLE_MAPS_API=your_google_maps_api_key
```

### Location Creation: Address Search + Geocoding

In the location creation form, a Google Maps `PlaceAutocomplete` input lets users type an address. When an address is selected:

1. The Google Places API returns structured address components.
2. The geocoder resolves the address to `(latitude, longitude)` coordinates.
3. All form fields are auto-populated (name, address, city, country, postal code, lat, lng).
4. A map is rendered showing a draggable marker at the resolved position.
5. If the user drags the marker, reverse geocoding updates the address fields.

```tsx
onPlaceSelect(place) {
  form.setValue('address', place.formatted_address);
  form.setValue('city', extractComponent(place, 'locality'));
  form.setValue('country', extractComponent(place, 'country'));
  form.setValue('latitude', place.geometry.location.lat());
  form.setValue('longitude', place.geometry.location.lng());
}
```

Default values (Berlin center) are used as a fallback when the Maps API key is unavailable, keeping the form testable in all environments.

### Event Page: Location Preview

Clicking the location name on the event detail page opens a Google Maps dialog:

- Displays a map centered on the event's coordinates with a marker.
- **Copy address** button — copies the full address to the clipboard.
- **Get directions** button — opens Google Maps in a new tab with the event as the destination.

```tsx
<GoogleMap center={{ lat: location.latitude, lng: location.longitude }} zoom={15}>
  <Marker position={{ lat: location.latitude, lng: location.longitude }} />
</GoogleMap>
```

### Database Storage

```prisma
model Location {
  longitude  Float
  latitude   Float
  // ...
}
```

Both fields are `Float` (double precision), providing sufficient accuracy for event locations.

### API Key Security

`VITE_GOOGLE_MAPS_API` is a frontend environment variable embedded in the compiled bundle. To prevent abuse:

- The key is restricted in Google Cloud Console to specific HTTP referrers (the app's domain).
- API access is limited to the Maps JavaScript API and Places API.
- Quota limits are configured in Google Cloud Console to cap costs.
