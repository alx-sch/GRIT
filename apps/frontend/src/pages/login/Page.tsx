import { Field, FieldGroup, FieldLabel, FieldSet, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, redirect, useNavigation, useActionData, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { authService } from '@/services/authService';
import { ActionFormError } from '@/types/actionFormError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import axios from 'axios';
import z from 'zod';
import { type LoginInput } from '@grit/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const LocalLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginPageAction({ request }: { request: Request }) {
  const formData = await request.formData();

  // Checking login data before submitting for validity
  const parsedData = LocalLoginSchema.safeParse({
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
    //Use redirect param
    const searchParams = new URLSearchParams(location.search);
    let redirectTo = searchParams.get('redirect') ?? '/events';

    // Append logged_in param for toast
    const redirectUrl = new URL(redirectTo, window.location.origin);
    redirectUrl.searchParams.set('logged_in', 'true');
    redirectTo = redirectUrl.pathname + redirectUrl.search;

    // Redirect on success
    return redirect(redirectTo);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        return { formErrors: ['Invalid email or password'] } satisfies ActionFormError;
      }
    }
    return { formErrors: ['An error occurred. Please try again.'] } satisfies ActionFormError;
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
  } = useForm<LoginInput>({
    resolver: zodResolver(LocalLoginSchema),
  });

  const [showPassword, setShowPassword] = useState(false);

  /**
   * ERROR HANDLING FOR FORM SUBMISSIONS
   */
  // Get data from form submission action
  const actionData = useActionData<ActionFormError | undefined>();

  // FIELD validation errors are injected into RHF for error display
  useEffect(() => {
    if (!actionData?.fieldErrors) return;
    Object.entries(actionData.fieldErrors).forEach(([field, message]) => {
      setError(field as keyof LoginInput, {
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
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            noValidate
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
                    placeholder="Enter your email..."
                    error={!!errors.email}
                    {...register('email')}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      error={!!errors.password}
                      {...register('password')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError errors={[errors.password]} />
                </Field>

                <Button disabled={isSubmitting} type="submit" className="w-full">
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </FieldGroup>
            </FieldSet>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
