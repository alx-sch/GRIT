import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heading, Text } from '@/components/ui/typography';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import { CreateLocationInput, CreateLocationSchema } from '@grit/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { AlertCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

interface LocationFormProps {
  onSuccess: (location: LocationBase) => void;
  onCancel: () => void;
}

//TODO: Remove default coordinate value (lng/lat) once Google maps is integrated
export default function LocationForm({ onSuccess, onCancel }: LocationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<CreateLocationInput>({
    resolver: zodResolver(CreateLocationSchema),
    defaultValues: {
      name: '',
      city: '',
      country: '',
      latitude: 52.52,
      longitude: 13.405,
      isPublic: undefined,
      address: '',
    },
  });

  const onSubmit: SubmitHandler<CreateLocationInput> = async (data) => {
    try {
      const payload = {
        name: data.name,
        city: data.city,
        country: data.country,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        isPublic: data.isPublic,
        address: data.address,
      };

      console.log('Submitting location with payload:', payload);
      const newLocation = await locationService.postLocation(payload);
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

  //Auto-dimiss name error after 15 seconds
  const [showNameError, setShowNameError] = useState(false);
  const nameErrorMessage = errors.name?.message;

  (useEffect(() => {
    if (nameErrorMessage) {
      setShowNameError(true);
      const timer = setTimeout(() => {
        setShowNameError(false);
      }, 15000);
      return () => {
        clearTimeout(timer);
      };
    }
  }),
    [nameErrorMessage, submitCount]);

  // Auto-dismiss root errors after 15 seconds
  const [showRootError, setShowRootError] = useState(false);
  const rootErrorMessage = errors.root?.message;

  useEffect(() => {
    if (rootErrorMessage) {
      setShowRootError(true);
      const timer = setTimeout(() => {
        setShowRootError(false);
      }, 15000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [rootErrorMessage, submitCount]);

  return (
    <>
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
      >
        <div className="flex flex-col py-8 pb-0">
          <Text className="font-heading"> Name </Text>
          <Input {...register('name')} placeholder="e.g Berghain, My awesome flat, etc." />
          {showNameError && nameErrorMessage && (
            <Alert variant="destructive" className="self-start">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle className="text-sm">{nameErrorMessage}</AlertTitle>
            </Alert>
          )}
        </div>
        <div className="flex flex-col py-4">
          <Text>***PLACEHOLDER FOR GOOGLE MAPS***</Text>
        </div>
        <div className="flex flex-col py-4">
			<Text className="font-heading"> Address </Text>
          <Input {...register('address')} placeholder="e.g Finowstraße 43, 10245 Berlin, Germany" />
        </div>
        <div className="flex flex-col py-4 pb-8">
		  <Text className="font-heading"> City </Text>
          <Input {...register('city')} placeholder="e.g Berlin" />
		  <Text className="font-heading"> Country </Text>
          <Input {...register('country')} placeholder="e.g Germany" />
        </div>
        <div className="flex flex-col py-4">
          <Input type="hidden" {...register('latitude')} />
          <Input type="hidden" {...register('longitude')} />
        </div>
        <Text className="font-heading"> Choose your location visibility </Text>
        <Controller
          control={control}
          name="isPublic"
          render={({ field: { onChange, value } }) => (
            <div className="flex flex-row w-full items-center">
              <Button
                type="button"
                variant={!value ? 'selected' : 'secondary'}
                onClick={() => {
                  onChange(false);
                }}
                className="font-sans text-sm md:text-base py-2 md:py-3 px-3 md:px-6 flex-1"
              >
                Private
              </Button>
              <Button
                type="button"
                variant={value ? 'selected' : 'secondary'}
                onClick={() => {
                  onChange(true);
                }}
                className="font-sans text-sm md:text-base py-2 md:py-3 px-3 md:px-6 flex-1"
              >
                Public
              </Button>
            </div>
          )}
        />

        {showRootError && rootErrorMessage && (
          <Alert variant="destructive" className="mt-1.5">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-sm">{rootErrorMessage}</AlertTitle>
          </Alert>
        )}
        <div className="flex flex-row w-full items-center gap-4">
          <Button
            type="button"
			variant="secondary"
            onClick={onCancel}
            className="font-sans text-sm md:text-base py-2 md:py-3 px-3 md:px-6 flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
			variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmit(onSubmit)();
            }}
            className="font-sans text-sm md:text-base py-2 md:py-3 px-3 md:px-6 flex-1"
          >
            {isSubmitting ? 'Loading...' : 'Submit'}
          </Button>
        </div>
      </form>
    </>
  );
}
