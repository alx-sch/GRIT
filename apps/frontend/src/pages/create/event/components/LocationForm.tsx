import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import { CreateLocationInput, CreateLocationSchema } from '@grit/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { AlertCircleIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Control, Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GMap } from '@/components/ui/gmap';

//Key for local Storage
const DRAFT_KEY = 'location-draft';
//Component to auto-sav draft to localStorage
function DraftSaver({ control }: { control: Control<CreateLocationInput> }) {
  const formValues = useWatch({ control });
  const debouncedFormValues = useDebounce(formValues, 1000);
  useEffect(() => {
    if (debouncedFormValues.name) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(debouncedFormValues));
    }
  }, [debouncedFormValues]);
  return null;
}

interface LocationFormProps {
  onSuccess: (location: LocationBase) => void;
  onCancel: () => void;
}

export default function LocationForm({ onSuccess, onCancel }: LocationFormProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API as string;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLocationInput>({
    resolver: zodResolver(CreateLocationSchema),
    defaultValues: {
      name: '',
      city: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      isPublic: undefined,
      address: '',
      postalCode: '',
    },
  });

  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });

  //Restore draft if exists
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const draft = JSON.parse(saved) as CreateLocationInput;
      reset(draft);
    }
  }, [reset]);

  const onSubmit: SubmitHandler<CreateLocationInput> = async (data) => {
    if (!data.longitude || !data.latitude) {
      setError('root', { message: 'Invalid address. Please select a location on the map' });
      return;
    }
    try {
      const payload = {
        name: data.name,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        isPublic: data.isPublic,
        address: data.address,
        postalCode: data.postalCode,
      };

      const newLocation = await locationService.postLocation(payload);
      localStorage.removeItem(DRAFT_KEY);
      onSuccess(newLocation);
    } catch (error) {
      let message = 'Something went wrong. Please try again.';
      if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          message = data.message;
        }
      }
      setError('root', { message });
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          void handleSubmit(
            onSubmit /*(validationErrors) => {
            if (validationErrors.latitude || validationErrors.longitude) {
              setError('root', { message: 'Please select a location on the map' });
            }
          }*/
          )(e);
        }}
        className="flex flex-col gap-4 h-full overflow-y-auto flex-1 px-1 pb-1 pr-3"
      >
        <DraftSaver control={control} />
        {/* Hidden Inputs: latitude and longitude */}
        <Input {...register('latitude')} />
        <Input {...register('longitude')} />
        {/* Name */}
        <div className="flex flex-col gap-2 mb-2">
          <label htmlFor="name" className="font-heading">
            Name of the location
          </label>
          <Input
            id="name"
            type="text"
            aria-invalid={!!errors.name}
            {...register('name')}
            placeholder="e.g Berghain, My awesome flat, etc."
          />
          {errors.name?.message && (
            <Alert variant="destructive" className="self-start">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle className="text-sm">{errors.name.message}</AlertTitle>
            </Alert>
          )}
        </div>

        {/* Map component */}
        <APIProvider apiKey={apiKey}>
          <GMap setValue={setValue} lng={longitude} lat={latitude} />
        </APIProvider>

        {/* Address/PostCode */}
        <div className="flex flex-row gap-6">
          <div className="flex flex-col flex-1 gap-2">
            <label htmlFor="address" className="font-heading">
              Address
            </label>
            <Input
              id="address"
              type="text"
              {...register('address')}
              placeholder='e.g "Harzer Straße 42"'
            />
          </div>
        </div>
        {/* City/Country */}
        <div className="flex flex-row gap-6">
          <div className="flex flex-col flex-1 gap-2">
            <label htmlFor="postalCode" className="font-heading">
              Postal Code
            </label>
            <Input
              id="postalCode"
              type="text"
              {...register('postalCode')}
              placeholder='e.g "12059"'
            />
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <label htmlFor="city" className="font-heading">
              City
            </label>
            <Input id="city" type="text" {...register('city')} placeholder='e.g "Berlin"' />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="country" className="font-heading">
            Country
          </label>
          <Input id="country" type="text" {...register('country')} placeholder='e.g "Germany"' />
        </div>
        {/* Visibility */}
        <fieldset className="flex flex-col gap-4">
          <legend className="font-heading mb-2"> Choose your location visibility </legend>
          <Controller
            control={control}
            name="isPublic"
            render={({ field: { onChange, value } }) => (
              <div className="flex w-fit">
                <Button
                  type="button"
                  variant={!value ? 'default' : 'secondary'}
                  onClick={() => {
                    onChange(false);
                  }}
                  className="font-sans text-sm py-2 md:py-3 px-3 flex-1 shadow-none rounded-r-none border-r-0"
                >
                  Private
                </Button>
                <Button
                  type="button"
                  variant={value ? 'default' : 'secondary'}
                  onClick={() => {
                    onChange(true);
                  }}
                  className="font-sans text-sm py-2 md:py-3 px-3 flex-1 shadow-none rounded-l-none border-l-0"
                >
                  Public
                </Button>
              </div>
            )}
          />
        </fieldset>

        {errors.root?.message && (
          <Alert variant="destructive" className="mt-1.5">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-sm">{errors.root.message}</AlertTitle>
          </Alert>
        )}

        {/* Buttons */}
        <div className="flex flex-row gap-4 mt-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="font-sans text-sm md:text-base py-2 md:py-3 px-3 md:px-6 flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="font-sans text-sm md:text-base py-2 md:py-3 px-3 md:px-6 flex-1"
          >
            {isSubmitting ? 'Loading...' : 'Submit'}
          </Button>
        </div>
      </form>
    </>
  );
}
