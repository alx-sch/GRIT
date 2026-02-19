import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * This toast helper is a way to show toast messages in case we redirect in react router actions our loaders.
 * Often times these cannot be shown reliably since the action or loader redirect the user before the <Toaster />
 * component is mounted and toast messages might get lost in that case. Below is a list of get parameters that can
 * be added to the redirects and will cause a toast message on the redirected page through the globally mounted
 * useRouteToast component which will strip the parameter and show the toast message.
 */

const preparedToasts = [
  {
    param: 'logged_out',
    type: 'success',
    message: 'You are logged out',
    description: '',
  },
  {
    param: 'logged_in',
    type: 'success',
    message: 'You are logged in',
    description: '',
  },
  {
    param: 'forbidden',
    type: 'error',
    message: 'You need to login first',
    description: '',
  },
  {
    param: 'signup_success',
    type: 'success',
    message: 'Account created',
    description: 'You can now log in',
  },
] as const;

export function useRouteToasts() {
  const [params, setParams] = useSearchParams();
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    // Get a copy of original params and track if we change it with a flag
    const processedParams = new URLSearchParams(params);
    let changed = false;

    preparedToasts.forEach((el) => {
      if (params.has(el.param)) {
        // Create a unique key for this toast to prevent duplicates in StrictMode
        const paramValue = params.get(el.param) ?? '';
        const toastKey = `${el.param}-${paramValue}`;

        // Only show toast if we haven't processed this exact param before
        if (!processedRef.current.has(toastKey)) {
          const { type, message, description } = el;
          toast[type](message, { description });
          processedRef.current.add(toastKey);
          changed = true;
        }

        processedParams.delete(el.param);
        changed = true;
      }
    });

    if (changed) setParams(processedParams, { replace: true }); // Replace params so we don't run this again
  }, [params, setParams]);
}
