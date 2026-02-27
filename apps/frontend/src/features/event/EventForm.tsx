import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/datepicker';
import { FileUpload } from '@/components/ui/fileUpload';
import { Input } from '@/components/ui/input';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import LocationForm from '@/features/event/LocationForm';
import { useDebounce } from '@/hooks/useDebounce';
import { getEventImageUrl } from '@/lib/image_utils';
import { type EventFormFields } from '@/schema/event';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';
import { AlertCircleIcon, PlusIcon, X } from 'lucide-react';
import { useEffect } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { useEventForm } from './useEventForm';

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
  initialData?: EventBase;
  locations: LocationBase[];
}

export default function EventForm({ initialData, locations }: EventFormProps) {
  const {
    form,
    control,
    isEditMode,
    isSubmitting,
    register,
    setValue,
    handleSubmit,
    onSubmit,
    showAddLocation,
    setShowAddLocation,
    locationsList,
    setLocationsList,
    setImageFile,
    setImageRemoved,
    imageUploadProgress,
    imageError,
    setImageError,
    existingImageUrl,
    setAdditionalFiles,
    additionalFilesError,
    setAdditionalFilesError,
    filesUploadProgress,
    existingFiles,
    handleRemoveExistingFile,
    startAtValue,
    endAtValue,
    getTimeFromDate,
    handleStartTimeChange,
    handleEndTimeChange,
    errors,
    showTitleError,
    titleErrorMessage,
    showDateError,
    dateErrorMessage,
    showRootError,
    rootErrorMessage,
  } = useEventForm({ initialData, locations });

  const locationOptionsCombobox: ComboboxOptions[] = [
    { value: '', label: 'TBA (To be Announced)' },
    ...locationsList.map(({ id, name }) => ({
      value: String(id),
      label: name ?? '',
    })),
  ];

  return (
    <>
      <form className="flex flex-col gap-8">
        {!isEditMode && <DraftSaver control={control} />}
        {/*Visibility*/}
        <div className="flex flex-col gap-4">
          <Controller
            control={control}
            name="isPublic"
            render={({ field: { onChange, value } }) => (
              <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
                <Button
                  type="button"
                  variant={!value ? 'selected' : 'secondary'}
                  aria-pressed={!value}
                  onClick={() => {
                    onChange(false);
                  }}
                  className="font-sans text-lg md:text-2xl md:py-8 md:px-12 flex-1"
                >
                  Private
                </Button>
                <span className="font-heading text-xl">OR</span>
                <Button
                  type="button"
                  variant={value ? 'selected' : 'secondary'}
                  aria-pressed={!value}
                  onClick={() => {
                    onChange(true);
                  }}
                  className="font-sans text-lg md:text-2xl md:py-8 md:px-12 flex-1"
                >
                  Public
                </Button>
              </div>
            )}
          />
        </div>
        {/*Name*/}
        <div className="flex flex-col gap-4">
          <label htmlFor="title" className="font-heading">
            Name
          </label>
          <Input
            type="text"
            id="title"
            aria-invalid={!!errors.title}
            {...register('title')}
            placeholder="Give your event a catchy name"
          />
          {showTitleError && titleErrorMessage && (
            <Alert variant="destructive" className="mt-1.5 md:w-1/3 self-start">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle className="text-sm">{titleErrorMessage}</AlertTitle>
            </Alert>
          )}
        </div>
        {/* Description */}
        <div className="flex flex-col gap-4">
          <label htmlFor="content" className="font-heading">
            Description
          </label>
          <Textarea
            id="content"
            {...register('content')}
            placeholder="Tell people what to expect at your event - vibe, music, etc"
          />
        </div>

        <div className="md:flex flex-row gap-4 md:gap-12">
          <Controller
            control={control}
            name="startAt"
            render={({ field: { onChange } }) => (
              <div className="w-full pb-4">
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
              <div className="w-full">
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
                      onClick={() => {
                        setShowAddLocation(true);
                      }}
                      variant="ghost"
                      className="w-full justify-start text-xs font-sans h-8"
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
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-4">
          <label htmlFor="image" className="font-heading">
            Cover image
          </label>
          <div className="items-center">
            <FileUpload
              onChange={(files) => {
                const file = files[0] ?? null;
                setImageFile(file);
                setImageRemoved(!file);
              }}
              progress={imageUploadProgress}
              aspectRatio="square"
              onError={setImageError}
              value={initialData?.imageKey ? getEventImageUrl(initialData) : null}
            />
            {imageError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle className="text-sm">{imageError}</AlertTitle>
              </Alert>
            )}
          </div>
        </div>

        {/* Documents Upload */}
        <div className="flex flex-col gap-4">
          <label htmlFor="image" className="font-heading">
            Additionnal documents
          </label>
          <div className="items-center">
            <FileUpload
              multiple
              onChange={setAdditionalFiles}
              onError={setAdditionalFilesError}
              progress={filesUploadProgress}
              existingFiles={existingFiles}
              onRemoveExisting={handleRemoveExistingFile}
            />
            {additionalFilesError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle className="text-sm">{additionalFilesError}</AlertTitle>
              </Alert>
            )}
          </div>
        </div>

        {showRootError && rootErrorMessage && (
          <Alert variant="destructive" className="mt-1.5">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-sm">{rootErrorMessage}</AlertTitle>
          </Alert>
        )}
        <div className="flex flex-row gap-4 md:gap-12">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValue('isPublished', false);
              void handleSubmit(onSubmit)();
            }}
            className="font-heading text-lg md:text-2xl md:py-8 flex-1"
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
            className="font-heading text-lg md:text-2xl md:py-8 flex-1"
          >
            {isSubmitting ? 'Loading...' : 'Publish'}
          </Button>
        </div>
      </form>
      <Sheet open={showAddLocation} onOpenChange={setShowAddLocation}>
        <SheetContent
          side="right"
          className="flex flex-col w-full h-full sm:w-full [&>button]:hidden overflow-hidden border-l-0 sm:max-w-md"
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b-2 border-border pb-4 mb-2 space-y-0 text-left">
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
            onCancel={() => {
              setShowAddLocation(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
