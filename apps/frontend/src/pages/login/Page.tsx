import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Form } from 'react-router-dom';
import { useNavigation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { redirect } from 'react-router-dom';
import { Heading } from '@/components/ui/typography';

export async function loginPageAction({ request }: { request: Request }) {
  // This is the action for the login page which takes the form data and sends a POST to the login endpoint
  const formData = await request.formData();

  const reqBody = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  // TODO Implement real request once backend works. Use Axios instead maybe?
  // const res = await fetch('http://localhost:3000/api/auth/login', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(reqBody),
  // });

  // fake latency
  await new Promise((r) => setTimeout(r, 500));
  let res;
  // fake response
  if (reqBody.email === 'test@example.com' && reqBody.password === 'password') {
    res = new Response(JSON.stringify({ token: 'fake-jwt-token' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    res = new Response(JSON.stringify({ message: 'Invalid credentials' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
  const data = (await res.json()) as { token: string };
  toast.success('Logged In', {});
  useAuthStore.getState().storeToken(data.token);
  return redirect('/');
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
