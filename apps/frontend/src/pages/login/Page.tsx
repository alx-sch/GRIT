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
  email: z.email('Please enter a valid email address'),
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

export const loginPageLoader = async ({ request }: { request: Request }) => {
  // Check for OAuth token in URL first (before checking if logged in)
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (token) {
    try {
      // Store the token
      useAuthStore.getState().setAuthenticated(token);

      // Fetch user data
      const userData = await authService.me();
      useCurrentUserStore.getState().setUser(userData);

      // Clean up URL and redirect with success toast
      return redirect('/events?logged_in=true');
    } catch (err) {
      console.error('OAuth login failed:', err);
      // Clear any stored token if there was an error
      useAuthStore.getState().clearAuthenticated();
      return redirect('/login?error=oauth_failed');
    }
  }

  // Check if already logged in (do this after OAuth check)
  if (useAuthStore.getState().token) return redirect('/');

  return null;
};

export const LoginPage = () => {
  // Control form with React Hook Form (RHF)
  const {
    register,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(LocalLoginSchema),
    mode: 'onChange',
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
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError errors={[errors.password]} />
                </Field>

                <Button disabled={isSubmitting || !isValid} type="submit" className="w-full">
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = '/api/auth/google';
                  }}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
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
