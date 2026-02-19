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
import { useEffect, useState } from 'react';
import axios from 'axios';
import z from 'zod';
import { RegisterSchema } from '@grit/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Check, X, Eye, EyeOff } from 'lucide-react';

const LocalRegisterSchema = RegisterSchema.extend({
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
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
    const data = await authService.register(registerData);

    useAuthStore.getState().setAuthenticated(data.accessToken);
    useCurrentUserStore.getState().setUser(data.user);
    return redirect('/?signup_success=true');
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 409) {
        return { formErrors: ['Email already exists'] } satisfies ActionFormError;
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
    watch,
    formState: { errors },
  } = useForm<LocalRegisterInput>({
    resolver: zodResolver(LocalRegisterSchema),
    mode: 'onChange',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const password = watch('password') || '';

  const actionData = useActionData<ActionFormError | undefined>();

  useEffect(() => {
    actionData?.formErrors?.forEach((err) => {
      toast.error(err);
    });
  }, [actionData]);

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
    { label: '10+ chars', valid: password.length >= 10 },
    { label: 'Uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
  ];

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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
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

                  <ul className="space-y-1 mt-2">
                    {criteria.map((c, i) => (
                      <li
                        key={i}
                        className={`text-xs flex items-center gap-2 transition-colors ${
                          c.valid ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      >
                        {c.valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {c.label}
                      </li>
                    ))}
                  </ul>

                  {/* <FieldError errors={[errors.password]} /> */}
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Re-type Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      error={!!errors.confirmPassword}
                      {...register('confirmPassword')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError errors={[errors.confirmPassword]} />
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
