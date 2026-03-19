import { Field, FieldGroup, FieldLabel, FieldSet, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ActionFormError } from '@/types/actionFormError';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import axios from 'axios';
import z from 'zod';
import { RegisterSchema } from '@grit/schema';
import { AlertCircle } from 'lucide-react';
import { Form, Link, redirect, useActionData, useNavigation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

const LocalRegisterSchema = RegisterSchema.extend({
  email: z.email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LocalRegisterInput = z.infer<typeof LocalRegisterSchema>;

export async function registerPageAction({ request }: { request: Request }) {
  const formData = await request.formData();

  const parsedData = LocalRegisterSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
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
    // Exclude confirmPassword
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = parsedData.data;
    // Register
    await authService.register(registerData);

    // Log in
    const loginData = await authService.login({
      emailOrUsername: parsedData.data.email,
      password: parsedData.data.password,
    });
    useAuthStore.getState().setAuthenticated(loginData.accessToken);
    useCurrentUserStore.getState().setUser(loginData.user);

    // Clean up URL and redirect to /events with success toast
    toast.success('Account created successfully!');
    return redirect('/events?logged_in=true');
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        return { formErrors: ['Username or email already exists'] } satisfies ActionFormError;
      }
      if (err.response?.status === 400) {
        return { formErrors: ['Invalid data provided'] } satisfies ActionFormError;
      }
    }
    throw err;
  }
}

export const registerPageLoader = () => {
  if (useAuthStore.getState().token) return redirect('/');
  return null;
};

export const RegisterPage = () => {
  const {
    register,
    setError,
    clearErrors,
    control,
    formState: { errors, isValid },
  } = useForm<LocalRegisterInput>({
    resolver: zodResolver(LocalRegisterSchema),
    mode: 'onChange',
  });

  const password = useWatch({ control, name: 'password' }) ?? '';

  const actionData = useActionData<ActionFormError | undefined>();

  useEffect(() => {
    if (!actionData?.fieldErrors) return;
    Object.entries(actionData.fieldErrors).forEach(([field, message]) => {
      setError(field as keyof LocalRegisterInput, {
        message,
      });
    });
  }, [actionData, setError]);

  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const criteria = [
    { label: '8+ chars', valid: password.length >= 8 },
    { label: 'Uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md mx-4 sm:mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
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
                    placeholder="Enter your email"
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
                    placeholder="Enter your name"
                    error={!!errors.name}
                    {...register('name')}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    error={!!errors.password}
                    {...register('password')}
                  />

                  <ul className="space-y-1 mt-2">
                    {criteria.map((c, i) => (
                      <li
                        key={i}
                        className={`text-xs flex items-center gap-2 transition-colors ${
                          c.valid ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      >
                        {c.valid ? '✓' : '○'} {c.label}
                      </li>
                    ))}
                  </ul>

                  {/* <FieldError errors={[errors.password]} /> */}
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Re-type Password</FieldLabel>
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    error={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  <FieldError errors={[errors.confirmPassword]} />
                </Field>

                <Button disabled={isSubmitting || !isValid} type="submit" className="w-full">
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
