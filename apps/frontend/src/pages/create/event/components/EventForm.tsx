import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/datepicker';
import { Input } from '@/components/ui/input';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Text } from '@/components/ui/typography';
import { useDebounce } from '@/hooks/useDebounce';
import LocationForm from '@/pages/create/event/components/LocationForm';
import { EventFormSchema, type EventFormFields } from '@/schema/event';
import { eventService } from '@/services/eventService';
import { LocationBase } from '@/types/location';
import { CreateEventSchema } from '@grit/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { AlertCircleIcon, PlusIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Control, Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

// Key for localStorage
const DRAFT_KEY = 'event-draft';
// Component to auto-save draft to localStorage
function DraftSaver({ control }: { control: Control<EventFormFields> }) {
  const formValues = useWatch({ control });
  const debouncedFormValues = useDebounce(formValues, 1000);
  useEffect(() => {
    if (debouncedFormValues.title) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(debouncedFormValues));
    }
  }, [debouncedFormValues]);
  return null;
}

interface EventFormProps {
  locations: LocationBase[];
}

export default function EventForm({ locations }: EventFormProps) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<EventFormFields>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      isPublic: false,
      isPublished: false,
      title: '',
      content: '',
      startAt: undefined,
      endAt: undefined,
      locationId: undefined,
    },
  });

  //Locations set-up
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationsList, setLocationsList] = useState<LocationBase[]>(locations);

  const locationOptionsCombobox: ComboboxOptions[] = [
    { value: '', label: 'TBA (To be Announced)' },
    ...locationsList.map(({ id, name }) => ({
      value: String(id),
      label: name ?? '',
    })),
  ];

  //Restore draft if exists
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const draft = JSON.parse(saved) as Record<string, unknown>;
      for (const [key, value] of Object.entries(draft)) {
        if (key === 'startAt' || key === 'endAt') {
          setValue(key, new Date(value as string));
        } else {
          setValue(key as keyof EventFormFields, value as EventFormFields[keyof EventFormFields]);
        }
      }
    }
  }, [setValue]);

  const onSubmit: SubmitHandler<EventFormFields> = async (data) => {
    try {
      const payload = {
        title: data.title,
        isPublic: data.isPublic,
        isPublished: data.isPublished,
        startAt: data.startAt.toISOString(),
        endAt: data.endAt.toISOString(),
        content: data.content ?? undefined,
        locationId: data.locationId ? Number(data.locationId) : undefined,
      };
      //Validating against shared schema
      const parsed = CreateEventSchema.safeParse(payload);
      if (!parsed.success) {
        setError('root', { message: 'Invalid event data' });
        return;
      }

      await eventService.postEvent(payload);
      localStorage.removeItem(DRAFT_KEY);
      void navigate('/events/');
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

  //eslint-disable-next-line react-hooks/incompatible-library
  const startAtValue = watch('startAt') as Date | undefined;
  const endAtValue = watch('endAt') as Date | undefined;

  // Helper to extract time string from Date
  const getTimeFromDate = (date: Date | undefined): string => {
    if (!date) return '12:00';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Helper to set time on a Date
  const setTimeOnDate = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // Handlers to update form dates when time changes
  const handleStartTimeChange = (time: string) => {
    if (startAtValue) {
      setValue('startAt', setTimeOnDate(startAtValue, time), { shouldValidate: true });
    }
  };

  const handleEndTimeChange = (time: string) => {
    if (endAtValue) {
      setValue('endAt', setTimeOnDate(endAtValue, time), { shouldValidate: true });
    }
  };

  // Auto-dismiss title errors after 15 seconds
  const [showTitleError, setShowTitleError] = useState(false);
  const titleErrorMessage = errors.title?.message;

  useEffect(() => {
    if (titleErrorMessage) {
      setShowTitleError(true);
      const timer = setTimeout(() => {
        setShowTitleError(false);
      }, 15000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [titleErrorMessage, submitCount]);

  // Auto-dismiss date errors after 15 seconds
  const [showDateError, setShowDateError] = useState(false);
  const dateErrorMessage = errors.startAt?.message ?? errors.endAt?.message;

  useEffect(() => {
    if (dateErrorMessage) {
      setShowDateError(true);
      const timer = setTimeout(() => {
        setShowDateError(false);
      }, 15000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [dateErrorMessage, submitCount]);

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
        <DraftSaver control={control} />
        <Controller
          control={control}
          name="isPublic"
          render={({ field: { onChange, value } }) => (
            <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
              <Button
                type="button"
                variant={!value ? 'selected' : 'secondary'}
                onClick={() => {
                  onChange(false);
                }}
                className="translate-x-0 translate-y-0 md:-translate-x-[2px] md:-translate-y-[2px] font-sans text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
              >
                Private
              </Button>
              <span className="font-heading text-xl">OR</span>
              <Button
                type="button"
                variant={value ? 'selected' : 'secondary'}
                onClick={() => {
                  onChange(true);
                }}
                className="translate-x-0 translate-y-0 md:-translate-x-[2px] md:-translate-y-[2px] font-sans text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
              >
                Public
              </Button>
            </div>
          )}
        />
        <div className="flex flex-col py-8 pb-0">
          <Text className="font-heading">Name</Text>
          <Input {...register('title')} placeholder="Give your event a catchy name" />
          {showTitleError && titleErrorMessage && (
            <Alert variant="destructive" className="mt-1.5 md:w-1/3 self-start">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle className="text-sm">{titleErrorMessage}</AlertTitle>
            </Alert>
          )}
        </div>
        <div className="flex flex-col py-8">
          <Text className="font-heading">Description</Text>
          <Textarea
            {...register('content')}
            placeholder="Tell people what to expect at your event - vibe, music, etc"
          />
        </div>

        <div className="md:flex flex-row gap-4 md:gap-12 w-full items-start">
          <Controller
            control={control}
            name="startAt"
            render={({ field: { onChange } }) => (
              <div className="w-full pt-0 pb-4 md:pb-8">
                <DatePicker
                  selected={
                    startAtValue
                      ? {
                          from: startAtValue,
                          to: endAtValue ?? undefined,
                        }
                      : undefined
                  }
                  onSelect={(range) => {
                    // When selecting dates, preserve existing time or default to 12:00
                    if (range?.from) {
                      const newStart = new Date(range.from);
                      if (startAtValue) {
                        // Preserve existing time
                        newStart.setHours(startAtValue.getHours(), startAtValue.getMinutes(), 0, 0);
                      } else {
                        // Default to 12:00
                        newStart.setHours(12, 0, 0, 0);
                      }
                      onChange(newStart);
                    }
                    if (range?.to) {
                      const newEnd = new Date(range.to);
                      if (endAtValue) {
                        newEnd.setHours(endAtValue.getHours(), endAtValue.getMinutes(), 0, 0);
                      } else {
                        newEnd.setHours(12, 0, 0, 0);
                      }
                      setValue('endAt', newEnd, { shouldValidate: true });
                    }
                  }}
                  placeholder="Select date & time"
                  className="bg-secondary text-secondary-foreground w-full min-w-0 text-sm md:text-base px-7"
                  disabled={{ before: new Date() }}
                  singleDateAsRange
                  showTime
                  startTime={getTimeFromDate(startAtValue)}
                  endTime={getTimeFromDate(endAtValue)}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                />
                {showDateError && dateErrorMessage && (
                  <Alert variant="destructive" className="mt-1.5">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertTitle className="text-sm">{dateErrorMessage}</AlertTitle>
                  </Alert>
                )}
              </div>
            )}
          />

          <Controller
            control={control}
            name="locationId"
            render={({ field: { onChange, value } }) => (
              <div className="w-full pt-0 pb-8">
                <Combobox
                  options={locationOptionsCombobox}
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="Select the location"
                  searchPlaceholder="Search"
                  emptyMessage="No location found"
                  className="bg-secondary text-secondary-foreground text-sm md:text-base justify-center text-center"
                  showSelectedTick={true}
                  footer={
                    <Button
                      type="button"
                      onClick={() => setShowAddLocation(true)}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      {' '}
                      <PlusIcon />
                      Add New Location
                    </Button>
                  }
                />
              </div>
            )}
          />
          {showRootError && rootErrorMessage && (
            <Alert variant="destructive" className="mt-1.5">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle className="text-sm">{rootErrorMessage}</AlertTitle>
            </Alert>
          )}
        </div>
        <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValue('isPublished', false);
              void handleSubmit(onSubmit)();
            }}
            className="font-heading text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setValue('isPublished', true);
              void handleSubmit(onSubmit)();
            }}
            className="font-heading text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
          >
            {isSubmitting ? 'Loading...' : 'Publish'}
          </Button>
        </div>
      </form>
      <Sheet open={showAddLocation} onOpenChange={setShowAddLocation}>
        <SheetContent
          side="right"
          className="w-75 border-l-2 border-border sm:w-100 [&>button]:hidden"
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b-2 border-border pb-4 mb-4 space-y-0 text-left">
            <SheetTitle className="font-bold uppercase tracking-wider">Add New Location</SheetTitle>
            <SheetClose asChild>
              <button className="focus:outline-none hover:opacity-70 transition-opacity">
                <X className="h-8 w-8 text-foreground" strokeWidth={3} />
                <span className="sr-only">Close</span>
              </button>
            </SheetClose>
          </SheetHeader>
          <LocationForm
            onSuccess={(location) => {
              setLocationsList((prev) => [...prev, location]);
              setValue('locationId', String(location.id));
              setShowAddLocation(false);
            }}
            onCancel={() => setShowAddLocation(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
