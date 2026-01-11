import { useEffect } from 'react';
import { Outlet, useNavigation } from 'react-router-dom';
import NProgress from 'nprogress';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/sonner';

NProgress.configure({ showSpinner: false, speed: 400 });

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto py-6">
        <Outlet />
      </main>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
