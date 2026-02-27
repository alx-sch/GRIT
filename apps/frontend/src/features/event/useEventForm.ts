import DRAFT_KEY from './EventForm';
import { getEventImageUrl } from '@/lib/image_utils';
import { type EventFormFields, EventFormSchema } from '@/schema/event';
import { eventService } from '@/services/eventService';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';
import { CreateEventSchema } from '@grit/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { ArrowDownLeftFromSquareIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UseEventFormProps {
  initialData?: EventBase;
  locations: LocationBase[];
}

export function useEventForm({ initialData, locations }: UseEventFormProps) {
  const isEditMode = !!initialData;
  const navigate = useNavigate();

  // Form
  const form = useForm<EventFormFields>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: initialData
      ? {
          isPublic: initialData.isPublic,
          isPublished: initialData.isPublished,
          title: initialData.title,
          content: initialData.content ?? '',
          startAt: new Date(initialData.startAt),
          endAt: new Date(initialData.endAt),
          locationId: initialData.location ? String(initialData.location.id) : undefined,
          imageKey: initialData.imageKey ?? undefined,
        }
      : {
          isPublic: false,
          isPublished: false,
          title: '',
          content: '',
          startAt: undefined,
          endAt: undefined,
          locationId: undefined,
          imageKey: undefined,
        },
  });
  const {
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting, submitCount },
  } = form;

  // Location
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationsList, setLocationsList] = useState<LocationBase[]>(locations);

  // Cover Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);

  // Additional Files
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalFilesError, setAdditionalFilesError] = useState<string | null>(null);
  const [filesUploadProgress, setFilesUploadProgress] = useState(0);
  const [existingFiles, setExistingFiles] = useState(initialData?.files ?? []);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);

  // Draft Restore
  useEffect(() => {
    if (isEditMode) return;
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

  // Submit
  const onSubmit: SubmitHandler<EventFormFields> = async (data) => {
    try {
      const payload = {
        title: data.title,
        isPublic: data.isPublic,
        isPublished: data.isPublished,
        startAt: data.startAt.toISOString(),
        endAt: data.endAt.toISOString(),
        content: data.content ?? undefined,
        locationId: data.locationId ? Number(data.locationId) : isEditMode ? null : undefined,
      };
      // Validating against shared schema
      const parsed = CreateEventSchema.safeParse(payload);
      if (!parsed.success) {
        setError('root', { message: 'Invalid event data' });
        return;
      }

      const result = isEditMode
        ? await eventService.patchEvent(String(initialData.id), payload)
        : await eventService.postEvent(payload);

      if (imageFile) {
        try {
          await eventService.uploadEventImage(result.id, imageFile, setImageUploadProgress);
        } catch {
          toast.warning('Event created, but image upload failed');
        }
      } else if (isEditMode && imageRemoved && initialData.imageKey) {
        try {
          await eventService.deleteEventImage(result.id);
        } catch {
          toast.warning('Event saved, but image deletion failed');
        }
      }
      for (const file of additionalFiles) {
        try {
          await eventService.uploadEventFile(result.id, file);
        } catch {
          toast.warning(`Failed to upload ${file.name}`);
        }
      }
      for (const fileId of filesToDelete) {
        try {
          await eventService.deleteEventFile(result.id, fileId);
        } catch {
          toast.warning(`Failed to delete a file`);
        }
      }
      localStorage.removeItem(DRAFT_KEY);
      void navigate(`/events/${String(result.id)}`, { replace: true });
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

  // Date/time helpers
  // eslint-disable-next-line react-hooks/incompatible-library
  const startAtValue = watch('startAt') as Date | undefined;
  const endAtValue = watch('endAt') as Date | undefined;

  const getTimeFromDate = (date: Date | undefined): string => {
    if (!date) return '12:00';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
      2,
      '0'
    )}`;
  };

  const setTimeOnDate = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

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

  // Errors auto-dismiss
  //  Auto-dismiss title errors after 15 seconds
  const [showTitleError, setShowTitleError] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const [showRootError, setShowRootError] = useState(false);

  const titleErrorMessage = errors.title?.message;
  const dateErrorMessage = errors.startAt?.message ?? errors.endAt?.message;
  const rootErrorMessage = errors.root?.message;

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

  // File handlers
  const handleRemoveExistingFile = (fileId: number) => {
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    setFilesToDelete((prev) => [...prev, fileId]);
  };

  return {
    // form
    form,
    control,
    isEditMode,
    isSubmitting,
    submitCount,
    register: form.register,
    setValue,
    handleSubmit,
    onSubmit,
    // location
    showAddLocation,
    setShowAddLocation,
    locationsList,
    setLocationsList,
    // cover image
    imageFile,
    setImageFile,
    imageRemoved,
    setImageRemoved,
    imageUploadProgress,
    imageError,
    setImageError,
    existingImageUrl: initialData?.imageKey ? getEventImageUrl(initialData) : null,
    // additional files
    additionalFiles,
    setAdditionalFiles,
    additionalFilesError,
    setAdditionalFilesError,
    filesUploadProgress,
    existingFiles,
    handleRemoveExistingFile,
    // dates
    startAtValue,
    endAtValue,
    getTimeFromDate,
    handleStartTimeChange,
    handleEndTimeChange,
    // errors
    errors,
    showTitleError,
    titleErrorMessage,
    showDateError,
    dateErrorMessage,
    showRootError,
    rootErrorMessage,
  };
}
