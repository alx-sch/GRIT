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

const schema = z
  .object({
    isPublic: z.boolean(),
    isPublished: z.boolean(),
    title: z
      .string()
      .min(1, 'Name must be at least 1 character long')
      .max(100, 'Name must be at most 100 characters long')
      .trim(),
    description: z.string().max(2000).optional(),
    startAt: z.date().min(new Date(), 'Start date must be in the future'),
    endAt: z.date(),
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
  const locationOptionsCombobox: ComboboxOptions[] = [
    { value: '', label: 'TBA (To be Announced)' },
    ...locations.map(({ id, name }) => ({
      value: String(id),
      label: name!,
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
      description: '',
      startAt: undefined,
      endAt: undefined,
      locationId: undefined,
    },
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    const payload = {
      ...data,
      startAt: data.startAt.toISOString(),
      endAt: data.endAt.toISOString(),
      locationId: data.locationId || undefined,
    };
    console.log(payload);
  };

  const startAtValue = watch('startAt');
  const endAtValue = watch('endAt');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="isPublic"
        render={({ field: { onChange, value } }) => (
          <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
            <Button
              type="button"
              variant={value === false ? 'selected' : 'outline'}
              onClick={() => onChange(false)}
              className="shadow-none translate-x-0 translate-y-0 md:shadow-grit md:-translate-x-[2px] md:-translate-y-[2px] font-sans text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
            >
              Private
            </Button>
            <span className="font-heading text-xl">OR</span>
            <Button
              type="button"
              variant={value === true ? 'selected' : 'outline'}
              onClick={() => onChange(true)}
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
          {...register('description')}
          placeholder="Tell people what to expect at your event - vibe, music, etc"
        />
      </div>

      <Controller
        control={control}
        name="startAt"
        render={({ field: { onChange, value } }) => (
          <div className="gap-4 md:gap-12 w-full items-center pt-0 pb-8">
            <DatePicker
              selected={
                startAtValue
                  ? {
                      from: startAtValue instanceof Date ? startAtValue : new Date(startAtValue),
                      to:
                        endAtValue instanceof Date
                          ? endAtValue
                          : endAtValue
                            ? new Date(endAtValue)
                            : undefined,
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

      <Controller
        control={control}
        name="isPublished"
        render={({ field: { onChange, value } }) => (
          <div className="flex flex-row gap-4 md:gap-12 w-full items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(false)}
              className="font-heading text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-heading text-lg md:text-2xl py-4 md:py-8 px-4 md:px-12 flex-1"
            >
              {isSubmitting ? 'Loading...' : 'Publish'}
            </Button>
          </div>
        )}
      />
    </form>
  );
}
