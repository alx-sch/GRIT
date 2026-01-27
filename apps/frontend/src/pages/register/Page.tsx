import { Field, FieldGroup, FieldLabel, FieldSet, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, redirect, useNavigation, useActionData, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { ActionFormError } from '@/types/actionFormError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import axios from 'axios';
import z from 'zod';
import { RegisterSchema } from '@grit/schema';
import type { RegisterInput } from '@grit/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export async function registerPageAction({ request }: { request: Request }) {
  const formData = await request.formData();

  // Checking register data before submitting for validity
  const parsedData = RegisterSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
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
    const data = await authService.register(parsedData.data);
    // Side effects in action = not ideal
    useAuthStore.getState().setAuthenticated(data.accessToken);
    useCurrentUserStore.getState().setUser(data.user);
    // Redirect on success
    return redirect('/?registered=true');
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        return { formErrors: ['Email already exists'] } satisfies ActionFormError;
      }
      if (err.response?.status === 400) {
        return { formErrors: ['Invalid data provided'] } satisfies ActionFormError;
      }
    }
    throw err; // other errors are rethrown to react routers error boundary
  }
}

export const registerPageLoader = () => {
  // Redirect if already logged in
  if (useAuthStore.getState().token) return redirect('/');
  return null;
};

export const RegisterPage = () => {
  // Control form with React Hook Form (RHF)
  const {
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  /**
   * ERROR HANDLING FOR FORM SUBMISSIONS
   */
  // Get data from form submission action
  const actionData = useActionData<ActionFormError | undefined>();

  // FORM validation errors appear as toasts (or alert)
  useEffect(() => {
    actionData?.formErrors?.forEach((err) => {
      toast.error(err);
    });
  }, [actionData]);

  // FIELD validation errors are injected into RHF for error display
  useEffect(() => {
    if (!actionData?.fieldErrors) return;
    Object.entries(actionData.fieldErrors).forEach(([field, message]) => {
      setError(field as keyof RegisterInput, {
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
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md mx-4 sm:mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your email below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            onSubmit={() => {
              clearErrors();
            }}
            className="space-y-4"
          >
            {actionData?.formErrors && actionData.formErrors.length > 0 && (
              <div className="flex items-center gap-3 p-3 text-sm border rounded-md bg-destructive/15 text-destructive border-destructive/50">
                <AlertCircle className="w-4 h-4" />
                <div className="flex-1">
                  {actionData.formErrors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              </div>
            )}

            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    error={!!errors.email}
                    {...register('email')}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    error={!!errors.name}
                    {...register('name')}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    error={!!errors.password}
                    {...register('password')}
                  />
                  <FieldError errors={[errors.password]} />
                </Field>

                <Button disabled={isSubmitting} type="submit" className="w-full">
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </FieldGroup>
            </FieldSet>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
