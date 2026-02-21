import { useEffect } from 'react';
import { Outlet, useMatches, useNavigation } from 'react-router-dom';
import NProgress from 'nprogress';
import { Navbar } from '@/components/layout/Navbar';
import { Container } from '@/components/layout/Container';
import { env } from '@/config/env';
import { useRouteToasts } from '@/hooks/useRouteToast';

NProgress.configure({ showSpinner: false, speed: 400 });

interface RouteHandle {
  title?: string;
}

export function DefaultLayout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading' || navigation.state === 'submitting';

  useEffect(() => {
    if (isLoading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [isLoading]);
  const matches = useMatches();

  useEffect(() => {
    const currentMatch = matches
      .filter((match) => match.handle && (match.handle as RouteHandle).title)
      .at(-1);

    const title = (currentMatch?.handle as RouteHandle | undefined)?.title;

    if (title) {
      document.title = `${title} | ${env.VITE_APP_NAME}`;
    } else {
      document.title = env.VITE_APP_NAME;
    }
  }, [matches]);

  useRouteToasts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Container as="main" className="py-6">
        <Outlet />
      </Container>
    </div>
  );
}
