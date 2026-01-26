import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Location } from '@/types/location';
import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { Text } from '@/components/ui/typography';
import { DatePicker } from '@/components/ui/datepicker';
import { useNavigate } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

const today = new Date();
today.setHours(0, 0, 0, 0);

const schema = z
  .object({
    isPublic: z.boolean(),
    isPublished: z.boolean(),
    title: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters long')
      .trim(),
    content: z.string().max(2000).optional(),
    startAt: z
      .date({ error: 'Start date is required' })
      .min(today, 'Start date must be in the future'),
    endAt: z.date({ error: 'End date is required' }),
    locationId: z.string().optional(),
  })
  .refine((data) => data.endAt >= data.startAt, {
    message: 'End date must be after start date',
    path: ['endAt'],
  });

interface EventFormProps {
  locations: Location[];
}

type FormFields = z.infer<typeof schema>;

export default function EventForm({ locations }: EventFormProps) {
  const navigate = useNavigate();
  const locationOptionsCombobox: ComboboxOptions[] = [
    { value: '', label: 'TBA (To be Announced)' },
    ...locations.map(({ id, name }) => ({
      value: String(id),
      label: name ?? '',
    })),
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
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

  const DRAFT_KEY = 'event-draft';

  //Restore draft if exists
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const draft = JSON.parse(saved) as Record<string, unknown>;
      for (const [key, value] of Object.entries(draft)) {
        setValue(key as keyof FormFields, value as FormFields[keyof FormFields]);
      }
    }
  }, [setValue]);

  //Save draft on change (debounced)
  // eslint-disable-next-line react-hooks/incompatible-library
  const formValues = watch();
  const debouncedFormValues = useDebounce(formValues, 1000);
  useEffect(() => {
    if (debouncedFormValues.title) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(debouncedFormValues));
    }
  }, [debouncedFormValues]);

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    console.log('1. onSubmit called with:', data);
    try {
      const payload = {
        title: data.title,
        isPublic: data.isPublic,
        isPublished: data.isPublished,
        startAt: format(data.startAt, "yyyy-MM-dd'T'12:00:00.000'Z'"),
        endAt: format(data.endAt, "yyyy-MM-dd'T'12:00:00.000'Z'"),
        content: data.content ?? undefined,
        locationId: data.locationId ? Number(data.locationId) : undefined,
      };
      console.log('2. Payload built:', payload);
      const event = await eventService.postEvent(payload);
      console.log('3. Event created:', event);
      localStorage.removeItem(DRAFT_KEY);
      void navigate('/events/');
    } catch (error) {
      console.error('4. Failed to create event:', error);
    }
  };

  const startAtValue = watch('startAt') as Date | undefined;
  const endAtValue = watch('endAt') as Date | undefined;

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        control={control}
        name="isPublic"
        render={({ field: { onChange, value } }) => (
          <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
            <Button
              type="button"
              variant={!value ? 'selected' : 'outline'}
              onClick={() => {
                onChange(false);
              }}
              className="shadow-none translate-x-0 translate-y-0 md:shadow-grit md:-translate-x-[2px] md:-translate-y-[2px] font-sans text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
            >
              Private
            </Button>
            <span className="font-heading text-xl">OR</span>
            <Button
              type="button"
              variant={value ? 'selected' : 'outline'}
              onClick={() => {
                onChange(true);
              }}
              className="shadow-none translate-x-0 translate-y-0 md:shadow-grit md:-translate-x-[2px] md:-translate-y-[2px] font-sans text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
            >
              Public
            </Button>
          </div>
        )}
      />
      <div className="flex flex-col py-8 pb-0">
        <Text className="font-heading">Name</Text>
        <Input {...register('title')} placeholder="Give your event a catchy name" />
        {errors.title && <div className="text-red-500">{errors.title.message}</div>}
      </div>
      <div className="flex flex-col py-8">
        <Text className="font-heading">Description</Text>
        <Textarea
          {...register('content')}
          placeholder="Tell people what to expect at your event - vibe, music, etc"
        />
      </div>

      <Controller
        control={control}
        name="startAt"
        render={({ field: { onChange } }) => (
          <div className="gap-4 md:gap-12 w-full items-center pt-0 pb-8">
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
                onChange(range?.from);
                if (range?.to) {
                  setValue('endAt', range.to, { shouldValidate: true });
                }
              }}
              placeholder="Date"
              className="flex-1 min-w-0 md:flex-none text-sm md:text-base px-7"
              disabled={{ before: new Date() }}
            />
            {errors.startAt && <div className="text-red-500 text-sm">{errors.startAt.message}</div>}
            {errors.endAt && <div className="text-red-500 text-sm">{errors.endAt.message}</div>}
          </div>
        )}
      />

      <Controller
        control={control}
        name="locationId"
        render={({ field: { onChange, value } }) => (
          <div className="gap-4 md:gap-12 w-full items-center pt-0 pb-8">
            <Combobox
              options={locationOptionsCombobox}
              value={value ?? undefined}
              onChange={onChange}
              placeholder="Select the location or venue"
              searchPlaceholder="Search"
              emptyMessage="No location found"
              className="justify-center text-center"
              showSelectedTick={true}
            />
          </div>
        )}
      />

      <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
        <Button
          type="button"
          variant="outline"
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
  );
}
