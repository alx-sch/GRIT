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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormAuthLoginDto } from '@/types/auth';
import axios from 'axios';
import z from 'zod';

export async function loginPageAction({ request }: { request: Request }) {
  const formData = await request.formData();

  // Checking login data before submitting for validity
  const parsedData = FormAuthLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsedData.success) return z.flattenError(parsedData.error);

  try {
    // Sending data for authService for communication with backend and potential error handling
    const data = await authService.login(parsedData.data);
    // Side effects in action = not ideal
    useAuthStore.getState().setAuthenticated(data.accessToken);
    useCurrentUserStore.getState().setUser(data.user);
    // Redirect on success
    return redirect('/?logged_in=true');
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) return { formError: 'Invalid credentials' };
    }
    throw err; // other errors are rethrown to react routers error boundary
  }
}

export const loginPageLoader = () => {
  if (useAuthStore.getState().token) return redirect('/');
  return null;
};

export const LoginPage = () => {
  const actionData = useActionData<typeof loginPageAction>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const {
    register,
    setError,
    formState: { errors },
  } = useForm<FormAuthLoginDto>({
    resolver: zodResolver(FormAuthLoginSchema),
  });

  // Inject action-level errors into RHF
  useEffect(() => {
    if (!actionData) return;

    // Field-level Zod errors
    if ('fieldErrors' in actionData) {
      Object.entries(actionData.fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          setError(field as keyof FormAuthLoginDto, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }

    // Form-level error
    if ('formError' in actionData) {
      toast.error(actionData.formError);
    }
  }, [actionData, setError]);

  return (
    <>
      <div className="space-y-2">
        <Heading level={1}>Login</Heading>
      </div>

      <div className="w-full max-w-md mt-4">
        <Form method="post">
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" autoComplete="username" {...register('email')} />
                {errors.email && <div className="text-red-500 text-sm">{errors.email.message}</div>}
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
                  <div className="text-red-500 text-sm">{errors.password.message}</div>
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
