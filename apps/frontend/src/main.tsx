import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from '@/components/ui/sonner';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  // <React.StrictMode>
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <Toaster position="bottom-right" richColors />
    <RouterProvider router={router} />
  </ThemeProvider>
  // </React.StrictMode>
);
