import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Form } from 'react-router-dom';
import { useNavigation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { toast } from 'sonner';
import { redirect } from 'react-router-dom';
import { Heading } from '@/components/ui/typography';
import type { LoginRes } from '@/types/loginRes';

export async function loginPageAction({ request }: { request: Request }) {
  // This is the action for the login page which takes the form data and sends a POST to the login endpoint
  const formData = await request.formData();

  const reqBody = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error('Login failed');
    } else {
      toast.error('Login Failed', {
        description: 'Please try again.',
      });
      return null;
    }
  }
  const json: unknown = await res.json(); // TODO This should be validated with ZOD
  const data = json as LoginRes;
  useAuthStore.getState().setAuthenticated(data.accessToken);
  const currentUser = {
    id: data.user.id,
    avatar: data.user.avatarKey,
    name: data.user.name,
  };
  useCurrentUserStore.getState().setUser(currentUser);
  return redirect('/?logged_in=true');
}

export const loginPageLoader = () => {
  if (useAuthStore.getState().isLoggedIn) return redirect('/');
  return null;
};

export const LoginPage = () => {
  // Allows us to change the style and text of the button
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <div className="space-y-2">
        <Heading level={1}>Login</Heading>
      </div>
      <div className="w-full max-w-md mt-4">
        <Form method="POST">
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Username</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Max Leiter"
                  autoComplete="username"
                  defaultValue={'test@example.com'}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  defaultValue={'password'}
                />
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
