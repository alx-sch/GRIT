import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, redirect, useNavigation, useActionData } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { toast } from 'sonner';
import { Heading } from '@/components/ui/typography';
import { authService } from '@/services/authService';
import { FormAuthLoginSchema } from '@/schema/auth';
import { ActionFormError } from '@/types/actionFormError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import axios from 'axios';
import z from 'zod';
import { FormAuthLoginDto } from '@/types/auth';

export async function loginPageAction({ request }: { request: Request }) {
  const formData = await request.formData();

  // Checking login data before submitting for validity
  const parsedData = FormAuthLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsedData.success) {
    const errorData = z.flattenError(parsedData.error);
    return {
      fieldErrors: errorData.fieldErrors,
      formErrors: errorData.formErrors,
    } as ActionFormError;
  }

  try {
    // Sending data for authService for communication with backend and potential error handling
    const data = await authService.login(parsedData.data);
    // Side effects in action = not ideal
    useAuthStore.getState().setAuthenticated(data.accessToken);
    useCurrentUserStore.getState().setUser(data.user);
    // Redirect on success
    return redirect('/?logged_in=true');
  } catch (err) {
    if (axios.isAxiosError(err))
      if (err.response?.status === 401)
        return { formErrors: ['Invalid credentials'] } satisfies ActionFormError;
    throw err; // other errors are rethrown to react routers error boundary
  }
}

export const loginPageLoader = () => {
  // Redirect if already logged in
  if (useAuthStore.getState().token) return redirect('/');
  return null;
};

export const LoginPage = () => {
  // Control form with React Hook Form (RHF)
  const {
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormAuthLoginDto>({
    resolver: zodResolver(FormAuthLoginSchema),
  });

  /**
   * ERROR HANDLING FOR FORM SUBMISSIONS
   */
  // Get data from form submission action
  const actionData = useActionData<ActionFormError | undefined>();

  // FORM validation errors appear as toasts
  useEffect(() => {
    actionData?.formErrors?.forEach((err) => {
      toast.error(err);
    });
  }, [actionData]);

  // FIELD validation errors are injected into RHF for error display
  useEffect(() => {
    if (!actionData?.fieldErrors) return;
    Object.entries(actionData.fieldErrors).forEach(([field, message]) => {
      setError(field as keyof FormAuthLoginDto, {
        message,
      });
    });
  }, [actionData, setError]);

  /**
   * DISPLAY THE FORM
   */
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <div className="space-y-2">
        <Heading level={1}>Login</Heading>
      </div>

      <div className="w-full max-w-md mt-4">
        <Form method="post" onSubmit={() => clearErrors()}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="text" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
              </Field>

              <Field orientation="horizontal">
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Logging in' : 'Login'}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </Form>
      </div>
    </>
  );
};
