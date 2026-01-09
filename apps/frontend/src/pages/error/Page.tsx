import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { FileQuestion, AlertTriangle, Lock } from 'lucide-react';

interface ApiErrorResponse {
  message?: string;
}

export default function ErrorPage() {
  const error = useRouteError();
  console.error('ErrorPage caught:', error);

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred.';
  let Icon = AlertTriangle;

  if (isRouteErrorResponse(error)) {
    title = `${String(error.status)} ${error.statusText}`;

    const data = error.data as ApiErrorResponse | undefined;
    message = data?.message ?? 'Page error.';
  } else if (isAxiosError(error)) {
    const status = error.response?.status ?? 500;

    const data = error.response?.data as ApiErrorResponse | undefined;
    message = data?.message ?? error.message;

    if (status === 404) {
      title = 'Not Found';
      message = "We couldn't find the data you were looking for.";
      Icon = FileQuestion;
    } else if (status === 401 || status === 403) {
      title = 'Access Denied';
      message = "You don't have permission to see this.";
      Icon = Lock;
    } else {
      title = 'Server Error';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Container className="py-20 flex flex-col items-center justify-center text-center space-y-6">
      <div className="bg-destructive/10 p-4 rounded-full">
        <Icon className="h-12 w-12 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
      </div>
      <div className="flex gap-4">
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          Try Again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>
    </Container>
  );
}
